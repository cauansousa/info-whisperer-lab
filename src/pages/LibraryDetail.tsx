import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import type { Library, Document as DocType, Permission, Profile, DriveConnection } from "@/types";
import { Upload, FileText, Loader2, Shield, Puzzle, Save, RefreshCw, Unplug, FolderOpen, CheckCircle, AlertCircle, ChevronRight, Home, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function LibraryDetail() {
  const { libraryId } = useParams<{ libraryId: string }>();
  const [searchParams] = useSearchParams();
  const [library, setLibrary] = useState<Library | null>(null);
  const [documents, setDocuments] = useState<DocType[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [connections, setConnections] = useState<DriveConnection[]>([]);
  const [connectorsAvailable, setConnectorsAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Permissions form
  const [subjectType, setSubjectType] = useState<string>("user");
  const [subjectId, setSubjectId] = useState("");
  const [accessLevel, setAccessLevel] = useState<string>("read");
  const [addingPerm, setAddingPerm] = useState(false);
  const [users, setUsers] = useState<Profile[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [savingPrompt, setSavingPrompt] = useState(false);

  // Integration state
  const [connectingDrive, setConnectingDrive] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  // Folder picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerConnectionId, setPickerConnectionId] = useState<string | null>(null);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerFolders, setPickerFolders] = useState<{ id: string; name: string }[]>([]);
  const [pickerPath, setPickerPath] = useState<{ id: string; name: string }[]>([
    { id: "root", name: "My Drive" },
  ]);

  // Default tab: switch to integrations if redirected from OAuth
  const defaultTab = searchParams.get("tab") === "integrations" ? "integrations" : "documents";

  useEffect(() => {
    if (!libraryId) return;
    Promise.all([
      api.getLibrary(libraryId),
      api.getDocuments(libraryId),
      api.getLibraryPermissions(libraryId),
      api.getUsers(),
      api.getConnections(libraryId).catch(() => {
        setConnectorsAvailable(false);
        return [] as DriveConnection[];
      }),
    ])
      .then(([lib, docs, perms, u, conns]) => {
        setLibrary(lib);
        setSystemPrompt(lib.system_prompt || "");
        setDocuments(docs);
        setPermissions(perms);
        setUsers(u);
        setConnections(conns);
      })
      .catch(() => toast.error("Failed to load library"))
      .finally(() => setLoading(false));
  }, [libraryId]);

  // Polling for processing docs
  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === "processing");
    if (!hasProcessing || !libraryId) return;
    const interval = setInterval(() => {
      api.getDocuments(libraryId).then(setDocuments);
    }, 3000);
    return () => clearInterval(interval);
  }, [documents, libraryId]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !libraryId) return;
    setUploading(true);
    try {
      await api.ingestFile(file, libraryId, title || file.name);
      const docs = await api.getDocuments(libraryId);
      setDocuments(docs);
      setFile(null);
      setTitle("");
      if (fileRef.current) fileRef.current.value = "";
      toast.success("Document uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleAddPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!libraryId || !subjectId) return;
    setAddingPerm(true);
    try {
      const perm = await api.addLibraryPermission(libraryId, subjectType, subjectId, accessLevel);
      setPermissions((prev) => [...prev, perm]);
      setSubjectId("");
      toast.success("Permission added");
    } catch (err: any) {
      toast.error(err.message || "Failed to add permission");
    } finally {
      setAddingPerm(false);
    }
  };

  const handleSavePrompt = async () => {
    if (!libraryId) return;
    setSavingPrompt(true);
    try {
      const updated = await api.updateLibrary(libraryId, { system_prompt: systemPrompt });
      setLibrary(updated);
      toast.success("System prompt saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save prompt");
    } finally {
      setSavingPrompt(false);
    }
  };

  const handleConnectDrive = async () => {
    if (!libraryId) return;
    setConnectingDrive(true);
    try {
      const { auth_url } = await api.getGoogleDriveAuthUrl(libraryId);
      window.open(auth_url, "google_oauth", "width=600,height=700");

      // Google's OAuth pages set Cross-Origin-Opener-Policy: same-origin which
      // severs window.opener — postMessage won't reach us. BroadcastChannel
      // works same-origin without needing the opener reference.
      const bc = new BroadcastChannel("oauth_drive");
      const timeout = setTimeout(() => {
        bc.close();
        setConnectingDrive(false);
      }, 5 * 60 * 1000);

      bc.onmessage = async (event) => {
        if (event.data?.type !== "oauth_drive_connected") return;
        bc.close();
        clearTimeout(timeout);
        setConnectingDrive(false);
        if (event.data.error) {
          toast.error(`OAuth error: ${event.data.error}`);
        } else {
          toast.success("Google Drive connected! A sync will start shortly.");
          const conns = await api.getConnections(libraryId!);
          setConnections(conns);
        }
      };
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate Google Drive connection");
      setConnectingDrive(false);
    }
  };

  // ── Folder picker ──────────────────────────────────────────────────────────

  const openFolderPicker = useCallback(async (connectionId: string) => {
    setPickerConnectionId(connectionId);
    setPickerPath([{ id: "root", name: "My Drive" }]);
    setPickerOpen(true);
    setPickerLoading(true);
    try {
      const folders = await api.listDriveFolders(connectionId);
      setPickerFolders(folders);
    } catch (err: any) {
      toast.error(err.message || "Failed to load Drive folders");
      setPickerOpen(false);
    } finally {
      setPickerLoading(false);
    }
  }, []);

  const navigateIntoFolder = useCallback(async (folder: { id: string; name: string }) => {
    if (!pickerConnectionId) return;
    setPickerLoading(true);
    setPickerPath((prev) => [...prev, folder]);
    try {
      const folders = await api.listDriveFolders(pickerConnectionId, folder.id);
      setPickerFolders(folders);
    } catch (err: any) {
      toast.error(err.message || "Failed to load subfolders");
    } finally {
      setPickerLoading(false);
    }
  }, [pickerConnectionId]);

  const navigateToBreadcrumb = useCallback(async (index: number) => {
    if (!pickerConnectionId) return;
    const newPath = pickerPath.slice(0, index + 1);
    setPickerPath(newPath);
    setPickerLoading(true);
    const target = newPath[newPath.length - 1];
    try {
      const folders = await api.listDriveFolders(pickerConnectionId, target.id);
      setPickerFolders(folders);
    } catch (err: any) {
      toast.error(err.message || "Failed to load folders");
    } finally {
      setPickerLoading(false);
    }
  }, [pickerConnectionId, pickerPath]);

  const selectCurrentFolder = useCallback(async () => {
    if (!pickerConnectionId) return;
    const current = pickerPath[pickerPath.length - 1];
    if (current.id === "root") {
      // Selecting root means sync all of My Drive (no folder filter)
      const updated = await api.updateConnection(pickerConnectionId, {
        folder_id: undefined,
        folder_name: undefined,
      });
      setConnections((prev) => prev.map((c) => (c.id === pickerConnectionId ? updated : c)));
    } else {
      const updated = await api.updateConnection(pickerConnectionId, {
        folder_id: current.id,
        folder_name: current.name,
      });
      setConnections((prev) => prev.map((c) => (c.id === pickerConnectionId ? updated : c)));
    }
    setPickerOpen(false);
    toast.success("Folder saved — next sync will use this folder");
  }, [pickerConnectionId, pickerPath]);

  const handleSyncNow = async (connectionId: string) => {
    setSyncing(connectionId);
    try {
      const result = await api.syncNow(connectionId);
      toast.success(`Sync complete: ${result.files_added} added, ${result.files_updated} updated, ${result.files_deleted} removed`);
      if (libraryId) {
        const [conns, docs] = await Promise.all([
          api.getConnections(libraryId),
          api.getDocuments(libraryId),
        ]);
        setConnections(conns);
        setDocuments(docs);
      }
    } catch (err: any) {
      toast.error(err.message || "Sync failed");
    } finally {
      setSyncing(null);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm("Disconnect Google Drive? Documents already in the library will be kept.")) return;
    try {
      await api.disconnectDrive(connectionId);
      setConnections((prev) => prev.filter((c) => c.id !== connectionId));
      toast.success("Google Drive disconnected");
    } catch (err: any) {
      toast.error(err.message || "Failed to disconnect");
    }
  };

  const filteredUsers = users.filter((u) =>
    userSearch.length >= 2 && u.email.toLowerCase().includes(userSearch.toLowerCase())
  ).slice(0, 6);

  if (loading) return <div className="p-6"><Skeleton className="h-8 w-48 mb-4" /><Skeleton className="h-64 w-full" /></div>;

  const statusBadge = (status: string) => {
    if (status === "ready") return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Ready</Badge>;
    if (status === "processing") return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Loader2 className="h-3 w-3 animate-spin mr-1" />Processing</Badge>;
    return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Error</Badge>;
  };

  return (
    <div className="p-6">
      <h1 className="font-display text-2xl font-bold mb-1">{library?.name || "Library Details"}</h1>
      {library?.description && (
        <p className="text-sm text-muted-foreground mb-6">{library.description}</p>
      )}
      {!library?.description && <div className="mb-6" />}

      <Tabs defaultValue={defaultTab}>
        <TabsList className="bg-secondary/30">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-6">
          <form onSubmit={handleUpload} className="mb-6 flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">File</label>
              <input
                ref={fileRef}
                type="file"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setFile(f);
                  if (f && !title) setTitle(f.name);
                }}
                className="text-xs text-muted-foreground"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-xs text-muted-foreground">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Document title" className="bg-secondary/20 border-border/40" />
            </div>
            <Button type="submit" disabled={uploading || !file} size="sm">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Upload className="h-4 w-4 mr-1" />Upload</>}
            </Button>
          </form>

          {documents.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-muted-foreground">
              <FileText className="mb-3 h-10 w-10 opacity-30" />
              <p className="text-sm">No documents yet.</p>
            </div>
          ) : (
            <div className="overflow-auto rounded-lg border border-border/30">
              <table className="w-full text-sm">
                <thead className="border-b border-border/30 bg-secondary/20">
                  <tr><th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Title</th><th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Type</th><th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Size</th><th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Status</th><th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Date</th></tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-secondary/10">
                      <td className="px-4 py-2">{doc.title}</td>
                      <td className="px-4 py-2 text-muted-foreground">{doc.mime_type}</td>
                      <td className="px-4 py-2 text-muted-foreground">{formatBytes(doc.size_bytes)}</td>
                      <td className="px-4 py-2">{statusBadge(doc.status)}</td>
                      <td className="px-4 py-2 text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="max-w-2xl space-y-4">
            <div className="space-y-2">
              <Label htmlFor="system-prompt" className="text-sm font-medium">
                System Prompt
              </Label>
              <p className="text-xs text-muted-foreground">
                Define o prompt base que será usado por todos os agentes que utilizarem esta biblioteca. 
                Este prompt é concatenado com o prompt pessoal de cada agente.
              </p>
              <Textarea
                id="system-prompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Ex: Você é um assistente especializado em documentos corporativos. Responda sempre em português, de forma clara e objetiva..."
                className="min-h-[200px] bg-secondary/20 border-border/40 font-mono text-xs"
              />
            </div>
            <Button onClick={handleSavePrompt} disabled={savingPrompt} size="sm">
              {savingPrompt ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              Salvar prompt
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="mt-6">
          <div className="space-y-4">
            {!connectorsAvailable ? (
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-6 text-center">
                <AlertCircle className="mx-auto mb-3 h-10 w-10 text-yellow-500 opacity-60" />
                <h3 className="text-sm font-semibold mb-1">Connectors Service Unavailable</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  The integrations service is temporarily unavailable. File upload still works normally. Please try again later.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setConnectorsAvailable(true);
                    api.getConnections(libraryId!).then(setConnections).catch(() => {
                      setConnectorsAvailable(false);
                      toast.error("Connectors service is still unavailable");
                    });
                  }}
                >
                  <RefreshCw className="h-3 w-3 mr-1" /> Retry
                </Button>
              </div>
            ) : (
            <>
            {/* Google Drive card */}
            <div className="rounded-xl border border-border/30 bg-card/50 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <svg className="h-6 w-6" viewBox="0 0 87.3 78" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066DA"/>
                    <path d="M43.65 25L29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.2 48.35c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00AC47"/>
                    <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H60.1l5.55 10.35z" fill="#EA4335"/>
                    <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832D"/>
                    <path d="M60.1 52.85H27.5L13.75 76.65c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.4 4.5-1.2z" fill="#2684FC"/>
                    <path d="M73.4 26.35L60.65 4.5c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25l16.45 27.85H87.3c0-1.55-.4-3.1-1.2-4.5z" fill="#FFBA00"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-sm">Google Drive</p>
                  <p className="text-xs text-muted-foreground">Sync documents from a Drive folder automatically</p>
                </div>
                {connections.length === 0 && (
                  <Button
                    size="sm"
                    className="ml-auto"
                    onClick={handleConnectDrive}
                    disabled={connectingDrive}
                  >
                    {connectingDrive
                      ? <><Loader2 className="h-3 w-3 animate-spin mr-1" />Connecting...</>
                      : "Connect Google Drive"
                    }
                  </Button>
                )}
              </div>

              {connections.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-muted-foreground">
                  <Puzzle className="mb-2 h-8 w-8 opacity-20" />
                  <p className="text-xs">No connections yet. Connect Google Drive to sync files automatically.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {connections.map((conn) => (
                    <div key={conn.id} className="rounded-lg border border-border/30 bg-secondary/10 px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/* Status indicator */}
                        {conn.status === "active" && <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />}
                        {conn.status === "error" && <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />}
                        {conn.status === "paused" && <AlertCircle className="h-4 w-4 text-yellow-400 shrink-0" />}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">
                              {conn.folder_name
                                ? <><FolderOpen className="inline h-3 w-3 mr-1" />{conn.folder_name}</>
                                : conn.folder_id
                                  ? <><FolderOpen className="inline h-3 w-3 mr-1" />{conn.folder_id.slice(0, 16)}...</>
                                  : "Entire My Drive"
                              }
                            </span>
                            <Badge variant="outline" className={`text-[10px] ${
                              conn.status === "active" ? "border-green-500/30 text-green-400" :
                              conn.status === "error" ? "border-red-500/30 text-red-400" :
                              "border-yellow-500/30 text-yellow-400"
                            }`}>
                              {conn.status}
                            </Badge>
                          </div>
                          {conn.last_synced_at && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Last sync: {new Date(conn.last_synced_at).toLocaleString()}
                            </p>
                          )}
                          {conn.error_message && (
                            <p className="text-[10px] text-red-400 mt-0.5">{conn.error_message}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => handleSyncNow(conn.id)}
                            disabled={syncing === conn.id}
                          >
                            {syncing === conn.id
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <><RefreshCw className="h-3 w-3 mr-1" />Sync Now</>
                            }
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-muted-foreground hover:text-destructive"
                            onClick={() => handleDisconnect(conn.id)}
                          >
                            <Unplug className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Folder picker button */}
                      <button
                        className="mt-2 text-[10px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline flex items-center gap-1"
                        onClick={() => openFolderPicker(conn.id)}
                      >
                        <FolderOpen className="h-3 w-3" />
                        {conn.folder_name
                          ? `Mudar pasta (atual: ${conn.folder_name})`
                          : "Selecionar pasta do Drive"}
                      </button>
                    </div>
                  ))}

                  {/* Add another connection */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={handleConnectDrive}
                    disabled={connectingDrive}
                  >
                    {connectingDrive ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                    + Add another Drive connection
                  </Button>
                </div>
              )}
            </div>

            {/* Other providers — still coming soon */}
            <div className="grid gap-3 sm:grid-cols-3">
              {["Notion", "Confluence", "SharePoint"].map((name) => (
                <div key={name} className="rounded-xl border border-border/30 bg-card/50 p-4 text-center opacity-60">
                  <Puzzle className="mx-auto mb-2 h-6 w-6 text-muted-foreground/30" />
                  <p className="text-xs font-medium">{name}</p>
                  <Badge variant="outline" className="mt-2 text-[10px]">Coming soon</Badge>
                </div>
              ))}
            </div>
            </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="mt-6">
          <form onSubmit={handleAddPermission} className="mb-6 flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Subject type</label>
              <Select value={subjectType} onValueChange={setSubjectType}>
                <SelectTrigger className="w-32 bg-secondary/20 border-border/30 h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="user">User</SelectItem><SelectItem value="group">Group</SelectItem><SelectItem value="role">Role</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="relative flex-1 min-w-[200px]">
              <label className="mb-1 block text-xs text-muted-foreground">
                {subjectType === "user" ? "Search by email" : subjectType === "role" ? "Role" : "Group ID"}
              </label>
              {subjectType === "role" ? (
                <Select value={subjectId} onValueChange={setSubjectId}>
                  <SelectTrigger className="bg-secondary/20 border-border/40 h-9 text-xs"><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent><SelectItem value="member">Member</SelectItem><SelectItem value="manager">Manager</SelectItem><SelectItem value="admin">Admin</SelectItem><SelectItem value="owner">Owner</SelectItem></SelectContent>
                </Select>
              ) : subjectType === "user" ? (
                <div>
                  <Input
                    value={userSearch}
                    onChange={(e) => { setUserSearch(e.target.value); }}
                    placeholder="Search email..."
                    className="bg-secondary/20 border-border/40 text-xs"
                  />
                  {filteredUsers.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border border-border/40 bg-popover shadow-lg">
                      {filteredUsers.map((u) => (
                        <button key={u.id} type="button" className="w-full px-3 py-2 text-left text-xs hover:bg-secondary/30"
                          onClick={() => { setSubjectId(u.id); setUserSearch(u.email); }}>
                          {u.email}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Input value={subjectId} onChange={(e) => setSubjectId(e.target.value)} placeholder="Group ID" className="bg-secondary/20 border-border/40 text-xs" />
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Access level</label>
              <Select value={accessLevel} onValueChange={setAccessLevel}>
                <SelectTrigger className="w-28 bg-secondary/20 border-border/30 h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="read">Read</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
              </Select>
            </div>
            <Button type="submit" size="sm" disabled={addingPerm || !subjectId}>
              {addingPerm ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
            </Button>
          </form>

          {permissions.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <Shield className="mb-3 h-8 w-8 opacity-30" />
              <p className="text-sm">No permissions configured.</p>
            </div>
          ) : (
            <div>
              <p className="mb-3 text-xs text-muted-foreground">{permissions.length} permission(s)</p>
              <div className="space-y-2">
                {permissions.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border/30 bg-card/30 px-4 py-2.5">
                    <Badge variant="outline" className="text-[10px]">{p.subject_type}</Badge>
                    <span className="flex-1 text-xs font-mono text-muted-foreground">{p.subject_id}</span>
                    <Badge className={p.access_level === "admin" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-secondary text-secondary-foreground"}>{p.access_level}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Folder Picker Modal ── */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Selecionar pasta do Google Drive</DialogTitle>
          </DialogHeader>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1 flex-wrap text-xs text-muted-foreground mb-2">
            {pickerPath.map((crumb, i) => (
              <span key={crumb.id} className="flex items-center gap-1">
                {i === 0 ? (
                  <button
                    className="flex items-center gap-0.5 hover:text-foreground"
                    onClick={() => navigateToBreadcrumb(0)}
                  >
                    <Home className="h-3 w-3" />
                    {crumb.name}
                  </button>
                ) : (
                  <>
                    <ChevronRight className="h-3 w-3" />
                    <button
                      className={`hover:text-foreground ${i === pickerPath.length - 1 ? "text-foreground font-medium" : ""}`}
                      onClick={() => navigateToBreadcrumb(i)}
                    >
                      {crumb.name}
                    </button>
                  </>
                )}
              </span>
            ))}
          </div>

          {/* "Select this folder" button */}
          <Button
            size="sm"
            className="w-full mb-3 text-xs"
            onClick={selectCurrentFolder}
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Usar "{pickerPath[pickerPath.length - 1].name}"
          </Button>

          {/* Folder list */}
          <div className="max-h-64 overflow-y-auto rounded-lg border border-border/30 divide-y divide-border/20">
            {pickerLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : pickerFolders.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                Sem subpastas aqui
              </div>
            ) : (
              pickerFolders.map((folder) => (
                <button
                  key={folder.id}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-secondary/20 text-left"
                  onClick={() => navigateIntoFolder(folder)}
                >
                  <FolderOpen className="h-4 w-4 text-blue-400 shrink-0" />
                  <span className="flex-1 truncate">{folder.name}</span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
