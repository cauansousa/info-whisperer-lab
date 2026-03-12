"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { Document } from "@/types/api";

export function useDocuments(libraryId?: string) {
  const path = libraryId ? `/documents?library_id=${libraryId}` : "/documents";
  return useQuery({
    queryKey: ["documents", libraryId],
    queryFn: () => apiFetch<Document[]>(path),
  });
}
