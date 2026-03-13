import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import type { Library, Document as DocType } from "@/types";
import { FileText, ArrowLeft, Puzzle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function UserLibraryDetail() {
  const { libraryId } = useParams<{ libraryId: string }>();
  const navigate = useNavigate();
  const [library, setLibrary] = useState<Library | null>(null);
  const [documents, setDocuments] = useState<DocType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!libraryId) return;
    Promise.all([
      api.getLibrary(libraryId),
      api.getDocuments(libraryId),
    ])
      .then(([lib, docs]) => {
        setLibrary(lib);
        setDocuments(docs);
      })
      .catch(() => toast.error("Failed to load library"))
      .finally(() => setLoading(false));
  }, [libraryId]);

  // Poll processing docs
  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === "processing");
    if (!hasProcessing || !libraryId) return;
    const interval = setInterval(() => {
      api.getDocuments(libraryId).then(setDocuments);
    }, 3000);
    return () => clearInterval(interval);
  }, [documents, libraryId]);

  const statusBadge = (status: string) => {
    if (status === "ready")
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Ready</Badge>;
    if (status === "processing")
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
          <Loader2 className="h-3 w-3 animate-spin mr-1" />Processing
        </Badge>
      );
    return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Error</Badge>;
  };

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/app/libraries")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-display text-2xl font-bold">{library?.name || "Library"}</h1>
          {library?.description && (
            <p className="text-sm text-muted-foreground mt-0.5">{library.description}</p>
          )}
        </div>
      </div>

      <Tabs defaultValue="documents">
        <TabsList className="bg-secondary/30">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-6">
          {documents.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-muted-foreground">
              <FileText className="mb-3 h-10 w-10 opacity-30" />
              <p className="text-sm">No documents in this library yet.</p>
            </div>
          ) : (
            <div className="overflow-auto rounded-lg border border-border/30">
              <table className="w-full text-sm">
                <thead className="border-b border-border/30 bg-secondary/20">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Title</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Size</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-secondary/10">
                      <td className="px-4 py-2 font-medium">{doc.title}</td>
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
      </Tabs>
    </div>
  );
}
