"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost } from "@/lib/api/client";
import type { QueryRequest, QueryResponse } from "@/types/api";

export function useQueryRAG() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: QueryRequest) =>
      apiPost<QueryResponse>("/query", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
}
