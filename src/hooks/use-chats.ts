"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { Chat } from "@/types/api";

export function useChats() {
  return useQuery({
    queryKey: ["chats"],
    queryFn: () => apiFetch<Chat[]>("/chats"),
  });
}
