import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import {
  streamQuery,
  LOCAL_PROVIDER_REQUIRED,
  prepareContext,
  persistLocalResponse,
} from "@/lib/stream-query";
import {
  isUsingLocalOllama, getLocalOllamaModel, setLocalOllamaModel,
  listOllamaModels, streamQueryOllama,
} from "@/lib/local-llm";
import { isRunningInTauri } from "@/lib/config";
import type { Chat, Agent, ChatMessage, SourceItem } from "@/types";
import type { CanvasDocument } from "@/components/chat/CanvasPanel";
import { Plus, Trash2, Send, Loader2, MessageSquare, Bot, PanelRightOpen, Square, Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import CanvasPanel from "@/components/chat/CanvasPanel";
import ChatMarkdown from "@/components/chat/ChatMarkdown";
import { parseCanvasContent } from "@/lib/canvas-parser";

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
  const [canvasDoc, setCanvasDoc] = useState<CanvasDocument | null>(null);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const streamContentRef = useRef("");
  const isMountedRef = useRef(true);
  useEffect(() => () => { isMountedRef.current = false; }, []);

  const scrollToBottom = useCallback(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    api.getAgents()
      .then(setAgents)
      .catch(() => toast.error("Failed to load agents"));
    api.getChats()
      .then(setChats)
      .catch(() => {})
      .finally(() => setLoadingChats(false));

    // Desktop: auto-detect Ollama model on startup if none saved yet
    if (isRunningInTauri() && !getLocalOllamaModel()) {
      listOllamaModels()
        .then((models) => {
          if (models.length > 0) setLocalOllamaModel(models[0]);
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!chatId) { setMessages([]); setSelectedAgent("__none__"); return; }
    setLoadingMessages(true);
    Promise.all([
      api.getChatMessages(chatId),
      api.getChat(chatId),
    ])
      .then(([msgs, chat]) => {
        setMessages(msgs);
        setSelectedAgent(chat.agent_id ?? "__none__");
      })
      .catch((err) => {
        const status = err?.status ?? err?.response?.status;
        if (status === 404) {
          // Chat was deleted — remove from list and go to new chat
          setChats((prev) => prev.filter((c) => c.id !== chatId));
          navigate("/app", { replace: true });
        } else {
          toast.error("Failed to load messages");
        }
      })
      .finally(() => setLoadingMessages(false));
  }, [chatId, navigate]);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const openInCanvas = (msgId: string, content: string) => {
    const doc = parseCanvasContent(msgId, content);
    if (doc) setCanvasDoc(doc);
  };

  const handleStop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setSending(false);
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const question = input.trim();
    setInput("");
    setSending(true);
    streamContentRef.current = "";

    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      chat_id: chatId || "",
      tenant_id: "",
      sender_type: "user",
      content: question,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    const agentMsgId = `agent-${Date.now()}`;
    let receivedChatId = chatId || "";

    // Add empty agent message that will be filled by streaming
    const agentMsg: ChatMessage = {
      id: agentMsgId,
      chat_id: receivedChatId,
      tenant_id: "",
      sender_type: "agent",
      content: "",
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, agentMsg]);

    const controller = new AbortController();
    abortRef.current = controller;

    // Route to local Ollama if enabled in Settings
    const useLocal = isRunningInTauri() && isUsingLocalOllama();
    let localModel = getLocalOllamaModel();

    // If local mode is ON but no model saved yet, try to detect on-demand
    if (useLocal && !localModel) {
      try {
        const models = await listOllamaModels();
        if (models.length > 0) {
          setLocalOllamaModel(models[0]);
          localModel = models[0];
        } else {
          localModel = "llama3.2";
        }
      } catch {
        // Ollama may still be reachable — use hardcoded fallback and let streamQueryOllama fail if not
        localModel = "llama3.2";
      }
    }

    if (useLocal && localModel) {
      try {
        // 1. Run full RAG pipeline on backend — returns messages with document context
        const ctx = await prepareContext({
          question,
          agent_id: (selectedAgent && selectedAgent !== "__none__") ? selectedAgent : null,
          chat_id: chatId || null,
        });

        // Navigate to newly created chat
        if (!chatId) {
          navigate(`/app/chat/${ctx.chat_id}`, { replace: true });
          api.getChats().then(setChats);
        }

        // Show sources immediately
        if (ctx.sources?.length) {
          setSources((prev) => ({ ...prev, [agentMsgId]: ctx.sources }));
        }

        // 2. Stream inference locally via Ollama (with RAG context in messages)
        await streamQueryOllama(
          ctx.local_model || localModel,
          ctx.messages,
          {
            onToken: (token) => {
              if (!isMountedRef.current) return;
              streamContentRef.current += token;
              const currentContent = streamContentRef.current;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === agentMsgId ? { ...m, content: currentContent } : m
                )
              );
            },
            onDone: async () => {
              if (!isMountedRef.current) return;
              setSending(false);
              abortRef.current = null;
              const finalContent = streamContentRef.current;
              if (finalContent) {
                const doc = parseCanvasContent(agentMsgId, finalContent);
                if (doc) setCanvasDoc(doc);
                // 3. Persist agent answer to backend (non-blocking)
                persistLocalResponse(ctx.chat_id, question, finalContent, ctx.sources);
              }
            },
            onError: (err) => {
              if (!isMountedRef.current) return;
              toast.error(`Ollama: ${err}`);
              setSending(false);
              abortRef.current = null;
              if (!streamContentRef.current)
                setMessages((prev) => prev.filter((m) => m.id !== agentMsgId));
            },
          },
          controller.signal
        );
      } catch {
        // prepareContext failed (backend error, network, etc.)
        // Degrade gracefully: call Ollama without RAG context so the user can still chat
        if (!isMountedRef.current) return;
        await streamQueryOllama(
          localModel,
          [{ role: "user", content: question }],
          {
            onToken: (token) => {
              if (!isMountedRef.current) return;
              streamContentRef.current += token;
              const c = streamContentRef.current;
              setMessages((prev) =>
                prev.map((m) => (m.id === agentMsgId ? { ...m, content: c } : m))
              );
            },
            onDone: () => {
              if (!isMountedRef.current) return;
              setSending(false);
              abortRef.current = null;
              const final = streamContentRef.current;
              if (final) {
                const doc = parseCanvasContent(agentMsgId, final);
                if (doc) setCanvasDoc(doc);
              }
            },
            onError: (ollamaErr) => {
              if (!isMountedRef.current) return;
              toast.error(`Ollama: ${ollamaErr}`);
              setSending(false);
              abortRef.current = null;
              if (!streamContentRef.current)
                setMessages((prev) => prev.filter((m) => m.id !== agentMsgId));
            },
          },
          controller.signal
        );
      }
      return;
    }

    await streamQuery(
      {
        question,
        agent_id: (selectedAgent && selectedAgent !== "__none__") ? selectedAgent : undefined,
        chat_id: chatId || undefined,
      },
      {
        onToken: (token) => {
          streamContentRef.current += token;
          const currentContent = streamContentRef.current;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === agentMsgId ? { ...m, content: currentContent } : m
            )
          );
        },
        onChatId: (id) => {
          receivedChatId = id;
          if (!chatId) {
            navigate(`/app/chat/${id}`, { replace: true });
            api.getChats().then(setChats);
          }
        },
        onSources: (srcs) => {
          if (srcs?.length) {
            setSources((prev) => ({ ...prev, [agentMsgId]: srcs }));
          }
        },
        onDone: () => {
          setSending(false);
          abortRef.current = null;
          // Auto-open canvas if response contains structured content
          const finalContent = streamContentRef.current;
          if (finalContent) {
            const doc = parseCanvasContent(agentMsgId, finalContent);
            if (doc) setCanvasDoc(doc);
          }
        },
        onError: async (err, meta) => {
          // Agent is configured with a local provider (Ollama on user's machine).
          // If running in the desktop app, transparently retry via local Ollama.
          if (err === LOCAL_PROVIDER_REQUIRED && isRunningInTauri()) {
            const model = meta?.localModel || getLocalOllamaModel() || "llama3.1:8b";
            streamContentRef.current = "";
            try {
              // Run full RAG pipeline on backend before calling local Ollama
              const ctx = await prepareContext({
                question,
                agent_id: (selectedAgent && selectedAgent !== "__none__") ? selectedAgent : null,
                chat_id: chatId || null,
              });
              if (!chatId) {
                navigate(`/app/chat/${ctx.chat_id}`, { replace: true });
                api.getChats().then(setChats);
              }
              if (ctx.sources?.length) {
                setSources((prev) => ({ ...prev, [agentMsgId]: ctx.sources }));
              }
              await streamQueryOllama(
                ctx.local_model || model,
                ctx.messages,
                {
                  onToken: (token) => {
                    if (!isMountedRef.current) return;
                    streamContentRef.current += token;
                    const c = streamContentRef.current;
                    setMessages((prev) =>
                      prev.map((m) => (m.id === agentMsgId ? { ...m, content: c } : m))
                    );
                  },
                  onDone: async () => {
                    if (!isMountedRef.current) return;
                    setSending(false);
                    abortRef.current = null;
                    const final = streamContentRef.current;
                    if (final) {
                      const doc = parseCanvasContent(agentMsgId, final);
                      if (doc) setCanvasDoc(doc);
                      persistLocalResponse(ctx.chat_id, question, final, ctx.sources);
                    }
                  },
                  onError: (localErr) => {
                    if (!isMountedRef.current) return;
                    toast.error(`Ollama local: ${localErr}`);
                    setSending(false);
                    abortRef.current = null;
                    if (!streamContentRef.current)
                      setMessages((prev) => prev.filter((m) => m.id !== agentMsgId));
                  },
                },
                controller.signal
              );
            } catch (ragErr: any) {
              if (!isMountedRef.current) return;
              toast.error(ragErr?.message || "Erro ao preparar contexto RAG");
              setSending(false);
              abortRef.current = null;
              setMessages((prev) => prev.filter((m) => m.id !== agentMsgId));
            }
            return;
          }

          // On web app: show a clear message when agent requires desktop
          if (err === LOCAL_PROVIDER_REQUIRED) {
            toast.error("Este agente usa um modelo local. Abra o app desktop para usá-lo.");
            setSending(false);
            abortRef.current = null;
            setMessages((prev) => prev.filter((m) => m.id !== agentMsgId));
            return;
          }

          toast.error(err || "Failed to send message");
          setSending(false);
          abortRef.current = null;
          if (!streamContentRef.current) {
            setMessages((prev) => prev.filter((m) => m.id !== agentMsgId));
          }
        },
      },
      controller.signal
    );
  };

  const deleteChat = async (id: string) => {
    try {
      await api.deleteChat(id);
      setChats((prev) => prev.filter((c) => c.id !== id));
      if (chatId === id) navigate("/app", { replace: true });
      toast.success("Chat deleted");
    } catch { toast.error("Failed to delete chat"); }
  };

  const hasCanvasContent = (content: string) => parseCanvasContent("test", content) !== null;

  // ── Chat suggestions ──
  const suggestions = [
    "Resuma os últimos relatórios adicionados",
    "Quais documentos tenho disponíveis?",
    "Compare os dados do último trimestre",
    "Faça uma análise dos principais indicadores",
  ];

  const handleSuggestion = (text: string) => {
    setInput(text);
  };

  // ── History grouping ──
  const [historySearch, setHistorySearch] = useState("");

  const filteredChats = chats.filter((c) =>
    historySearch.length === 0 || c.title.toLowerCase().includes(historySearch.toLowerCase())
  );

  const groupChats = (list: Chat[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const weekAgo = new Date(today.getTime() - 7 * 86400000);

    const groups: { label: string; chats: Chat[] }[] = [
      { label: "Hoje", chats: [] },
      { label: "Ontem", chats: [] },
      { label: "Esta semana", chats: [] },
      { label: "Anteriores", chats: [] },
    ];

    list.forEach((c) => {
      const d = new Date(c.created_at);
      if (d >= today) groups[0].chats.push(c);
      else if (d >= yesterday) groups[1].chats.push(c);
      else if (d >= weekAgo) groups[2].chats.push(c);
      else groups[3].chats.push(c);
    });

    return groups.filter((g) => g.chats.length > 0);
  };

  const chatGroups = groupChats(filteredChats);

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Chat list sidebar */}
      <div className="hidden w-72 flex-shrink-0 flex-col border-r border-border/30 bg-card/20 md:flex">
        <div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Histórico</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate("/app")}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        {/* Search */}
        <div className="px-3 pt-3 pb-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground/50" />
            <Input
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Buscar conversas..."
              className="h-8 pl-8 text-xs bg-secondary/20 border-border/30"
            />
          </div>
        </div>
        <div className="flex-1 overflow-auto p-2">
          {loadingChats ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : filteredChats.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              {historySearch ? "Nenhum resultado encontrado." : "Nenhuma conversa ainda."}
            </p>
          ) : (
            chatGroups.map((group) => (
              <div key={group.label} className="mb-3">
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">{group.label}</p>
                {group.chats.map((chat) => (
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
                          <AlertDialogTitle>Excluir conversa?</AlertDialogTitle>
                          <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteChat(chat.id)}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
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
              <SelectValue placeholder="Selecione um agente (opcional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Todas as bibliotecas (sem agente)</SelectItem>
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
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground max-w-md mx-auto">
              <Sparkles className="mb-4 h-12 w-12 opacity-20" />
              <h2 className="text-lg font-semibold text-foreground mb-1">Olá! Como posso ajudar?</h2>
              <p className="text-sm text-center mb-6">Faça uma pergunta sobre seus documentos ou escolha uma sugestão abaixo.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSuggestion(s)}
                    className="rounded-lg border border-border/30 bg-secondary/20 px-3 py-2.5 text-xs text-left text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender_type === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] rounded-xl px-4 py-3 text-sm ${msg.sender_type === "user" ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-foreground"}`}>
                  {/* Show streaming cursor for empty agent messages */}
                  {msg.sender_type === "agent" && msg.content === "" && sending ? (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse" />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse [animation-delay:0.2s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse [animation-delay:0.4s]" />
                    </span>
                  ) : msg.sender_type === "agent" ? (
                    <ChatMarkdown content={msg.content} />
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                  {/* Blinking cursor while streaming */}
                  {msg.sender_type === "agent" && sending && msg.content !== "" && msg.id.startsWith("agent-") && (
                    <span className="inline-block w-0.5 h-4 bg-foreground/60 animate-pulse ml-0.5 align-text-bottom" />
                  )}
                  {sources[msg.id] && (
                    <div className="mt-2 border-t border-border/20 pt-2">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Fontes</p>
                      {sources[msg.id].map((s, i) => (
                        <p key={i} className="text-xs text-muted-foreground">📄 {s.document_title}</p>
                      ))}
                    </div>
                  )}
                  {msg.sender_type === "agent" && !sending && hasCanvasContent(msg.content) && (
                    <button
                      onClick={() => openInCanvas(msg.id, msg.content)}
                      className="mt-2 flex items-center gap-1.5 rounded-md border border-border/30 bg-secondary/30 px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
                    >
                       <PanelRightOpen className="h-3 w-3" />
                       Abrir no Canvas
                    </button>
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
              placeholder="Digite sua pergunta..."
              rows={1}
              className="flex-1 resize-none rounded-lg border border-border/40 bg-secondary/20 px-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
            />
            {sending ? (
              <Button onClick={handleStop} variant="destructive" size="icon" className="h-10 w-10">
                <Square className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button onClick={handleSend} disabled={!input.trim()} size="icon" className="h-10 w-10">
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Canvas Panel */}
      {canvasDoc && (
        <CanvasPanel document={canvasDoc} onClose={() => setCanvasDoc(null)} />
      )}
    </div>
  );
}
