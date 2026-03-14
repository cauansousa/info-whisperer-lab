import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/lib/api";
import type { Library, Document as DocType, Permission, Profile } from "@/types";
import { Upload, FileText, Loader2, Shield, Puzzle, Settings, Save } from "lucide-react";
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
  const [library, setLibrary] = useState<Library | null>(null);
  const [documents, setDocuments] = useState<DocType[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
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

  useEffect(() => {
    if (!libraryId) return;
    Promise.all([
      api.getLibrary(libraryId),
      api.getDocuments(libraryId),
      api.getLibraryPermissions(libraryId),
      api.getUsers(),
    ])
      .then(([lib, docs, perms, u]) => {
        setLibrary(lib);
        setSystemPrompt(lib.system_prompt || "");
        setDocuments(docs);
        setPermissions(perms);
        setUsers(u);
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

      <Tabs defaultValue="documents">
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {["Google Drive", "Notion", "Confluence", "SharePoint"].map((name) => (
              <div key={name} className="rounded-xl border border-border/30 bg-card/50 p-5 text-center">
                <Puzzle className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm font-medium">{name}</p>
                <Badge variant="outline" className="mt-2 text-[10px]">Coming soon</Badge>
              </div>
            ))}
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
    </div>
  );
}
