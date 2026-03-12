"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatWindow } from "@/components/chat/chat-window";
import { ChatInput } from "@/components/chat/chat-input";
import { AgentSelector } from "@/components/chat/agent-selector";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

export default function NewChatPage() {
  const router = useRouter();
  const { selectedAgentId, setSelectedAgent, setIsLoading } = useChatStore();
  const { data: agents } = useAgents();
  const queryMutation = useQueryRAG();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);

  // Reset agent selection when entering new chat
  useEffect(() => {
    setSelectedAgent(null);
  }, [setSelectedAgent]);

  // Derive current agent info
  const currentAgent = useMemo(() => {
    if (!agents || !selectedAgentId) return null;
    return agents.find((a) => a.id === selectedAgentId) ?? null;
  }, [agents, selectedAgentId]);

  const handleSend = useCallback(
    async (question: string) => {
      const userMsg: DisplayMessage = {
        id: `user-${Date.now()}`,
        senderType: "user",
        content: question,
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const response = await queryMutation.mutateAsync({
          question,
          agent_id: selectedAgentId ?? undefined,
        });

        const agentMsg: DisplayMessage = {
          id: `agent-${Date.now()}`,
          senderType: "agent",
          content: response.answer,
          sources: response.sources,
        };
        setMessages((prev) => [...prev, agentMsg]);

        // Navigate to the new chat
        if (response.chat_id) {
          router.replace(`/app/chat/${response.chat_id}`);
        }
      } catch {
        const errorMsg: DisplayMessage = {
          id: `error-${Date.now()}`,
          senderType: "agent",
          content: "Sorry, something went wrong. Please try again.",
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedAgentId, queryMutation, router, setIsLoading]
  );

  return (
    <div className="flex h-full bg-background/60">
      <ChatSidebar />
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 bg-background/80 px-6 py-3">
          <div className="flex items-center gap-3 min-w-0">
            {currentAgent ? (
              <Avatar size="sm">
                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                  {currentAgent.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Avatar size="sm">
                <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-semibold">
                  AI
                </AvatarFallback>
              </Avatar>
            )}
            <div className="min-w-0">
              <h2 className="text-sm font-semibold truncate">
                New conversation
              </h2>
              {currentAgent && (
                <p className="text-xs text-muted-foreground truncate">
                  {currentAgent.name}
                </p>
              )}
            </div>
          </div>
          <AgentSelector />
        </div>

        <div className="flex flex-1 flex-col">
          <ChatWindow
            messages={messages}
            isLoading={queryMutation.isPending}
            agentName={currentAgent?.name}
          />
          <ChatInput onSend={handleSend} />
        </div>
      </div>
    </div>
  );
}
