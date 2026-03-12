"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { Chat } from "@/types/api";

export function useChat(chatId: string | null) {
  return useQuery({
    queryKey: ["chat", chatId],
    queryFn: () => apiFetch<Chat>(`/chats/${chatId}`),
    enabled: !!chatId,
  });
}
