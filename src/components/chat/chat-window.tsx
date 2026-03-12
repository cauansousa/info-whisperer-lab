"use client";

import { useEffect, useRef } from "react";
import { MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChatMessage } from "./chat-message";
import type { SourceItem } from "@/types/api";

interface DisplayMessage {
  id: string;
  senderType: "user" | "agent";
  content: string;
  sources?: SourceItem[];
}

interface ChatWindowProps {
  messages: DisplayMessage[];
  isLoading?: boolean;
  agentName?: string;
}

export function ChatWindow({ messages, isLoading, agentName }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-muted/60">
            <MessageSquare className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">Start a conversation</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask a question about your organization&apos;s knowledge base
          </p>
        </div>
      </div>
    );
  }

  const agentInitials = agentName?.slice(0, 2).toUpperCase() ?? "AI";

  return (
    <ScrollArea className="flex-1">
      <div className="mx-auto max-w-4xl px-6 py-5 space-y-6">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            senderType={msg.senderType}
            content={msg.content}
            sources={msg.sources}
            agentName={agentName}
          />
        ))}
        {isLoading && (
          <div className="flex justify-start gap-3">
            <Avatar size="sm" className="mt-5 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                {agentInitials}
              </AvatarFallback>
            </Avatar>
            <div className="max-w-[70%] md:max-w-[60%]">
              <p className="mb-1 px-1 text-[11px] font-medium text-muted-foreground">
                {agentName ?? "Assistant"}
              </p>
              <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-muted/90 px-4 py-3 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
      </div>
      <div ref={bottomRef} />
    </ScrollArea>
  );
}
