import { authSupabase } from "@/lib/auth-client";
import { getApiBase } from "@/lib/config";
import type { QueryRequest, SourceItem } from "@/types";
import type { OllamaMessage } from "@/lib/local-llm";

function getModelBase(): string {
  return `${getApiBase()}/model`;
}

async function getToken(): Promise<string> {
  const { data } = await authSupabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not authenticated");
  return token;
}

export const LOCAL_PROVIDER_REQUIRED = "__local_provider_required__";

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onSources?: (sources: SourceItem[]) => void;
  onChatId?: (chatId: string) => void;
  onDone: () => void;
  /** error === LOCAL_PROVIDER_REQUIRED means the agent needs local Ollama */
  onError: (error: string, meta?: { localModel?: string }) => void;
}

/**
 * Streams a query response from the backend via SSE.
 * Sends `stream: true` in the request body.
 * Falls back to non-streaming if the backend doesn't support SSE.
 */
export async function streamQuery(
  body: QueryRequest,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
) {
  const token = await getToken();

  const res = await fetch(`${getModelBase()}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({ ...body, stream: true }),
    signal,
  });

  if (res.status === 401) {
    window.location.href = "/login";
    callbacks.onError("Unauthorized");
    return;
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const detail = errBody.detail || errBody.message || errBody.error || `API error ${res.status}`;
    if (detail === "local_provider_required") {
      const localModel = res.headers.get("x-local-model") ?? undefined;
      callbacks.onError(LOCAL_PROVIDER_REQUIRED, { localModel });
      return;
    }
    callbacks.onError(detail);
    return;
  }

  const contentType = res.headers.get("content-type") || "";

  // If backend returns JSON (no streaming support), handle as fallback
  if (contentType.includes("application/json")) {
    const data = await res.json();
    if (data.chat_id) callbacks.onChatId?.(data.chat_id);
    if (data.answer) callbacks.onToken(data.answer);
    if (data.sources?.length) callbacks.onSources?.(data.sources);
    callbacks.onDone();
    return;
  }

  // SSE streaming
  if (!res.body) {
    callbacks.onError("No response body");
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          callbacks.onDone();
          return;
        }

        try {
          const parsed = JSON.parse(jsonStr);

          // Handle different SSE event formats
          // Format 1: OpenAI-compatible delta
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) callbacks.onToken(delta);

          // Format 2: Custom event with type field
          if (parsed.type === "token" && parsed.content) {
            callbacks.onToken(parsed.content);
          }
          if (parsed.type === "sources" && parsed.sources) {
            callbacks.onSources?.(parsed.sources);
          }
          if (parsed.type === "metadata" && parsed.chat_id) {
            callbacks.onChatId?.(parsed.chat_id);
          }
          if (parsed.type === "done") {
            if (parsed.chat_id) callbacks.onChatId?.(parsed.chat_id);
            if (parsed.sources?.length) callbacks.onSources?.(parsed.sources);
            callbacks.onDone();
            return;
          }
          if (parsed.type === "error") {
            callbacks.onError(parsed.detail || "Stream error");
            return;
          }

          // Format 3: Direct fields
          if (parsed.token) callbacks.onToken(parsed.token);
          if (parsed.chat_id && !parsed.type) callbacks.onChatId?.(parsed.chat_id);
          if (parsed.sources && !parsed.type) callbacks.onSources?.(parsed.sources);
        } catch {
          // Incomplete JSON, put back and wait
          buffer = line + "\n" + buffer;
          break;
        }
      }
    }

    // Flush remaining buffer
    if (buffer.trim()) {
      for (let raw of buffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) callbacks.onToken(delta);
          if (parsed.token) callbacks.onToken(parsed.token);
          if (parsed.sources) callbacks.onSources?.(parsed.sources);
        } catch { /* ignore partial */ }
      }
    }

    callbacks.onDone();
  } catch (err: any) {
    if (err.name === "AbortError") return;
    callbacks.onError(err.message || "Stream error");
  } finally {
    try { reader.cancel(); } catch { /* ignore */ }
  }
}

// ─── Local inference helpers ──────────────────────────────────────────────────

export interface PrepareContextResult {
  chat_id: string;
  agent_id?: string | null;
  messages: OllamaMessage[];
  sources: SourceItem[];
  local_model?: string | null;
}

/**
 * Calls /model/prepare_context to run the full RAG pipeline on the backend.
 * Returns the augmented messages array ready to pass to local Ollama.
 * Also creates the chat record and persists the user message.
 */
export async function prepareContext(params: {
  question: string;
  agent_id?: string | null;
  library_ids?: string[];
  chat_id?: string | null;
}): Promise<PrepareContextResult> {
  const token = await getToken();

  const res = await fetch(`${getModelBase()}/prepare_context`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(30000),
  });

  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.detail || errBody.message || `API error ${res.status}`);
  }

  return res.json();
}

/**
 * Calls /model/chats/{chat_id}/persist_local to save the answer from local Ollama.
 * Should be called after streaming completes.
 */
export async function persistLocalResponse(
  chat_id: string,
  question: string,
  answer: string,
  sources: SourceItem[],
): Promise<void> {
  const token = await getToken();

  await fetch(`${getModelBase()}/chats/${chat_id}/persist_local`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question, answer, sources }),
  }).catch(() => {
    // Non-critical — don't break the UX if persistence fails
    console.warn("[KnowledgeAI] persist_local failed — answer not saved to history");
  });
}
