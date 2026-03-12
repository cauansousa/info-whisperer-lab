"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChats } from "@/hooks/use-chats";
import { useAgents } from "@/hooks/use-agents";
import { timeAgo } from "@/lib/utils/format";

export function ChatSidebar() {
  const pathname = usePathname();
  const { data: chats, isLoading } = useChats();
  const { data: agents } = useAgents();

  const agentMap = useMemo(() => {
    if (!agents) return new Map<string, string>();
    return new Map(agents.map((a) => [a.id, a.name]));
  }, [agents]);

  return (
    <div className="flex h-full w-64 flex-col border-r border-border/60 bg-muted/15">
      <div className="flex items-center justify-between border-b border-border/60 p-3">
        <h3 className="text-sm font-semibold">Chats</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          nativeButton={false}
          render={<Link href="/app/chat" />}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {isLoading && (
            <div className="space-y-2 p-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-md bg-muted"
                />
              ))}
            </div>
          )}

          {!isLoading && (!chats || chats.length === 0) && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No chats yet. Start a new conversation.
            </div>
          )}

          {chats?.map((chat) => {
            const isActive = pathname === `/app/chat/${chat.id}`;
            const agentName = chat.agent_id
              ? agentMap.get(chat.agent_id)
              : undefined;
            return (
              <Link
                key={chat.id}
                href={`/app/chat/${chat.id}`}
                className={cn(
                  "flex items-start gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{chat.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs opacity-60">
                      {timeAgo(chat.created_at)}
                    </span>
                    {agentName && (
                      <Badge
                        variant="secondary"
                        className="h-4 max-w-[100px] truncate px-1.5 text-[10px] leading-none"
                      >
                        {agentName}
                      </Badge>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
