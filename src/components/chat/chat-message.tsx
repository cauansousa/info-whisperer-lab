"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { SourceItem } from "@/types/api";
import { ChatSources } from "./chat-sources";

interface ChatMessageProps {
  senderType: "user" | "agent";
  content: string;
  sources?: SourceItem[];
  agentName?: string;
}

export function ChatMessage({
  senderType,
  content,
  sources,
  agentName,
}: ChatMessageProps) {
  const isUser = senderType === "user";
  const initials = isUser
    ? "You"
    : agentName?.slice(0, 2).toUpperCase() ?? "AI";

  return (
    <div
      className={cn(
        "flex w-full gap-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Agent avatar left */}
      {!isUser && (
        <Avatar size="sm" className="mt-5 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "min-w-0 max-w-[70%] md:max-w-[60%]",
          isUser ? "text-right" : "text-left"
        )}
      >
        <p className="mb-1 px-1 text-[11px] font-medium text-muted-foreground">
          {isUser ? "You" : agentName ?? "Assistant"}
        </p>
        <div
          className={cn(
            "inline-block rounded-2xl px-4 py-2.5 text-left text-sm leading-relaxed shadow-sm",
            isUser
              ? "rounded-br-sm bg-primary text-primary-foreground"
              : "rounded-bl-sm bg-muted/90 text-foreground"
          )}
        >
          {content.split("\n").map((line, i) => (
            <p key={i} className={i > 0 ? "mt-1.5" : ""}>
              {line || "\u00A0"}
            </p>
          ))}
        </div>
        {!isUser && sources && sources.length > 0 && (
          <div className="mt-1.5">
            <ChatSources sources={sources} />
          </div>
        )}
      </div>

      {/* User avatar right */}
      {isUser && (
        <Avatar size="sm" className="mt-5 shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-semibold">
            You
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
