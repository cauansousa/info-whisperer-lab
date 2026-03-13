import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import type { Chat, Agent, ChatMessage, SourceItem } from "@/types";
import { Plus, Trash2, Send, Loader2, MessageSquare, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ChatViewProps {
  chatId?: string;
}

export default function ChatView({ chatId }: ChatViewProps) {
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sources, setSources] = useState<Record<string, SourceItem[]>>({});
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    api.getAgents()
      .then(setAgents)
      .catch(() => toast.error("Failed to load agents"));
    api.getChats()
      .then(setChats)
      .catch(() => { /* chats endpoint may not exist yet */ })
      .finally(() => setLoadingChats(false));
  }, []);

  useEffect(() => {
    if (!chatId) { setMessages([]); return; }
    setLoadingMessages(true);
    api.getChatMessages(chatId)
      .then(setMessages)
      .catch(() => toast.error("Failed to load messages"))
      .finally(() => setLoadingMessages(false));
  }, [chatId]);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const question = input.trim();
    setInput("");
    setSending(true);

    // Optimistic user message
    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      chat_id: chatId || "",
      tenant_id: "",
      sender_type: "user",
      content: question,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await api.query({
        question,
        agent_id: selectedAgent || undefined,
        chat_id: chatId || undefined,
      });

      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        chat_id: res.chat_id,
        tenant_id: "",
        sender_type: "agent",
        content: res.answer,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, agentMsg]);
      if (res.sources?.length) {
        setSources((prev) => ({ ...prev, [agentMsg.id]: res.sources }));
      }

      // Navigate to the chat if this was a new conversation
      if (!chatId) {
        navigate(`/app/chat/${res.chat_id}`, { replace: true });
        // Refresh chat list
        api.getChats().then(setChats);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const deleteChat = async (id: string) => {
    try {
      await api.deleteChat(id);
      setChats((prev) => prev.filter((c) => c.id !== id));
      if (chatId === id) navigate("/app", { replace: true });
      toast.success("Chat deleted");
    } catch { toast.error("Failed to delete chat"); }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Chat list sidebar */}
      <div className="hidden w-72 flex-shrink-0 flex-col border-r border-border/30 bg-card/20 md:flex">
        <div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">History</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate("/app")}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-2">
          {loadingChats ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : chats.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">No conversations yet.</p>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                className={`group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-secondary/40 ${chatId === chat.id ? "bg-secondary/50" : ""}`}
                onClick={() => navigate(`/app/chat/${chat.id}`)}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                  <span className="truncate">{chat.title}</span>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button onClick={(e) => e.stopPropagation()} className="hidden text-muted-foreground hover:text-destructive group-hover:block">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete chat?</AlertDialogTitle>
                      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteChat(chat.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex flex-1 flex-col">
        {/* Agent selector */}
        <div className="border-b border-border/30 px-4 py-2">
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="w-56 bg-secondary/20 border-border/30 h-8 text-xs">
              <SelectValue placeholder="Select an agent (optional)" />
            </SelectTrigger>
            <SelectContent>
              {agents.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {loadingMessages ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-3/4" />)}</div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
              <Bot className="mb-3 h-10 w-10 opacity-30" />
              <p className="text-sm">Ask anything...</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender_type === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] rounded-xl px-4 py-3 text-sm ${msg.sender_type === "user" ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-foreground"}`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {sources[msg.id] && (
                    <div className="mt-2 border-t border-border/20 pt-2">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Sources</p>
                      {sources[msg.id].map((s, i) => (
                        <p key={i} className="text-xs text-muted-foreground">📄 {s.document_title}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEnd} />
        </div>

        {/* Input */}
        <div className="border-t border-border/30 bg-card/20 p-4">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Type your question..."
              rows={1}
              className="flex-1 resize-none rounded-lg border border-border/40 bg-secondary/20 px-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:border-foreground/30 focus:outline-none"
            />
            <Button onClick={handleSend} disabled={sending || !input.trim()} size="icon" className="h-10 w-10">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
