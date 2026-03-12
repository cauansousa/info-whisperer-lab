"use client";

import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiUpload } from "@/lib/api/client";
import { useDocuments } from "@/hooks/use-documents";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Plug } from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatFileSize } from "@/lib/utils/format";
import type { Library, IngestResponse } from "@/types/api";
import PermissionsPage from "./permissions/page";

function statusColor(status: string) {
  switch (status) {
    case "ready":
      return "default";
    case "processing":
      return "secondary";
    case "error":
      return "destructive";
    default:
      return "outline";
  }
}

export default function LibraryDetailPage() {
  const params = useParams();
  const libraryId = params.libraryId as string;
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: library } = useQuery({
    queryKey: ["library", libraryId],
    queryFn: () => apiFetch<Library>(`/libraries/${libraryId}`),
  });

  const { data: documents, isLoading: loadingDocs } = useDocuments(libraryId);

  const hasProcessing = documents?.some((d) => d.status === "processing");

  // Poll while documents are processing
  useQuery({
    queryKey: ["documents-poll", libraryId],
    queryFn: () => apiFetch(`/documents?library_id=${libraryId}`),
    enabled: !!hasProcessing,
    refetchInterval: 3000,
  });

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("library_id", libraryId);
        formData.append("title", file.name);

        await apiUpload<IngestResponse>("/ingest/file", formData);
      }
      toast.success("Upload complete");
      queryClient.invalidateQueries({ queryKey: ["documents", libraryId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{library?.name ?? "Library"}</h1>
        {library?.description && (
          <p className="text-sm text-muted-foreground mt-1">
            {library.description}
          </p>
        )}
      </div>

      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4 mt-4">
          {/* Upload */}
          <div className="rounded-md border border-dashed p-6 text-center">
            <Upload className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              Upload documents to this library
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.xlsx,.csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Choose files"}
            </Button>
          </div>

          {/* Documents Table */}
          {loadingDocs ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading documents...
            </div>
          ) : !documents || documents.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No documents uploaded yet.
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="divide-y">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {doc.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {doc.mime_type} &middot;{" "}
                          {formatFileSize(doc.size_bytes)} &middot;{" "}
                          {formatDate(doc.created_at)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={statusColor(doc.status)}>
                      {doc.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="integrations" className="mt-4">
          <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-12 text-center">
            <Plug className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <h3 className="text-sm font-medium">No integrations configured</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Connect external data sources to this library. Integrations allow automatic syncing from tools like Google Drive, Notion, Confluence and more.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="mt-4">
          <PermissionsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
