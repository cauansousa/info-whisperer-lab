"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { ChatMessage } from "@/types/api";

export function useChatMessages(chatId: string | null) {
  return useQuery({
    queryKey: ["chat-messages", chatId],
    queryFn: () => apiFetch<ChatMessage[]>(`/chats/${chatId}/messages`),
    enabled: !!chatId,
  });
}
