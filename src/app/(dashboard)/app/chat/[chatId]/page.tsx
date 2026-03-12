"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatWindow } from "@/components/chat/chat-window";
import { ChatInput } from "@/components/chat/chat-input";
import { AgentSelector } from "@/components/chat/agent-selector";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useChat } from "@/hooks/use-chat";
import { useChatMessages } from "@/hooks/use-chat-messages";
import { useQueryRAG } from "@/hooks/use-query-rag";
import { useAgents } from "@/hooks/use-agents";
import { useChatStore } from "@/stores/chat-store";
import type { SourceItem } from "@/types/api";

interface DisplayMessage {
  id: string;
  senderType: "user" | "agent";
  content: string;
  sources?: SourceItem[];
}

export default function ExistingChatPage() {
  const params = useParams();
  const chatId = params.chatId as string;
  const { selectedAgentId, setSelectedAgent, setIsLoading } = useChatStore();
  const { data: chat } = useChat(chatId);
  const { data: dbMessages, isLoading: loadingMessages } = useChatMessages(chatId);
  const { data: agents } = useAgents();
  const queryMutation = useQueryRAG();

  const [localMessages, setLocalMessages] = useState<DisplayMessage[]>([]);

  // Restore agent from chat record
  useEffect(() => {
    if (chat?.agent_id) {
      setSelectedAgent(chat.agent_id);
    }
  }, [chat?.agent_id, setSelectedAgent]);

  // Derive current agent info
  const currentAgent = useMemo(() => {
    if (!agents || !selectedAgentId) return null;
    return agents.find((a) => a.id === selectedAgentId) ?? null;
  }, [agents, selectedAgentId]);

  // Convert DB messages to display format
  const historyMessages: DisplayMessage[] = useMemo(() => {
    if (!dbMessages) return [];
    return dbMessages.map((msg) => ({
      id: msg.id,
      senderType: msg.sender_type,
      content: msg.content,
      sources: msg.metadata?.sources as SourceItem[] | undefined,
    }));
  }, [dbMessages]);

  // Reset local messages when switching chats
  useEffect(() => {
    setLocalMessages([]);
  }, [chatId]);

  const allMessages = useMemo(
    () => [...historyMessages, ...localMessages],
    [historyMessages, localMessages]
  );

  const handleSend = useCallback(
    async (question: string) => {
      const userMsg: DisplayMessage = {
        id: `user-${Date.now()}`,
        senderType: "user",
        content: question,
      };
      setLocalMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const response = await queryMutation.mutateAsync({
          question,
          chat_id: chatId,
          agent_id: selectedAgentId ?? undefined,
        });

        const agentMsg: DisplayMessage = {
          id: `agent-${Date.now()}`,
          senderType: "agent",
          content: response.answer,
          sources: response.sources,
        };
        setLocalMessages((prev) => [...prev, agentMsg]);
      } catch {
        const errorMsg: DisplayMessage = {
          id: `error-${Date.now()}`,
          senderType: "agent",
          content: "Sorry, something went wrong. Please try again.",
        };
        setLocalMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [chatId, selectedAgentId, queryMutation, setIsLoading]
  );

  return (
    <div className="flex h-full">
      <ChatSidebar />
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            {currentAgent && (
              <Avatar size="sm">
                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                  {currentAgent.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="min-w-0">
              <h2 className="text-sm font-semibold truncate">
                {chat?.title ?? "Chat"}
              </h2>
              {currentAgent && (
                <p className="text-xs text-muted-foreground truncate">
                  {currentAgent.name}
                </p>
              )}
            </div>
          </div>
          <AgentSelector disabled={!!chat?.agent_id} />
        </div>

        <ChatWindow
          messages={allMessages}
          isLoading={loadingMessages || queryMutation.isPending}
          agentName={currentAgent?.name}
        />
        <ChatInput onSend={handleSend} disabled={loadingMessages} />
      </div>
    </div>
  );
}
