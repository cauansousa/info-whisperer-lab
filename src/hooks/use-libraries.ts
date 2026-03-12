"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { Library } from "@/types/api";

export function useLibraries() {
  return useQuery({
    queryKey: ["libraries"],
    queryFn: () => apiFetch<Library[]>("/libraries"),
  });
}
