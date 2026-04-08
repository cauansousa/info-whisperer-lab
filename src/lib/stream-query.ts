import { authSupabase } from "@/lib/auth-client";
import { getApiBase } from "@/lib/config";
import type { QueryRequest, SourceItem } from "@/types";
import type { OllamaMessage } from "@/lib/local-llm";

function getModelBase(): string {
  return `${getApiBase()}/model`;
}

async function getToken(): Promise<string> {
  const { data } = await authSupabase.auth.getSession();
  return data.session?.access_token ?? "";
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onChatId: (chatId: string) => void;
  onSources: (sources: SourceItem[]) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}

/**
 * Cloud streaming — streams from the Model-Router-API.
 */
export async function streamQuery(
  params: QueryRequest,
  callbacks: StreamCallbacks,
  abortSignal?: AbortSignal,
) {
  const token = await getToken();

  const res = await fetch(`${getModelBase()}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
    signal: abortSignal,
  });

  if (res.status === 401) {
    callbacks.onError("Session expired. Please log in again.");
    return;
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    callbacks.onError(`API error ${res.status}: ${text}`);
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    callbacks.onError("No response stream");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const payload = trimmed.slice(6);
        if (payload === "[DONE]") {
          callbacks.onDone();
          return;
        }

        try {
          const parsed = JSON.parse(payload);

          if (parsed.chat_id) {
            callbacks.onChatId(parsed.chat_id);
          }

          if (parsed.sources) {
            callbacks.onSources(parsed.sources);
          }

          if (parsed.choices?.[0]?.delta?.content) {
            callbacks.onToken(parsed.choices[0].delta.content);
          }

          if (parsed.token) {
            callbacks.onToken(parsed.token);
          }

          if (parsed.error) {
            callbacks.onError(parsed.error);
            return;
          }
        } catch {
          // skip malformed JSON lines
        }
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

/**
 * Local streaming — uses Ollama (or compatible local API) directly from
 * the browser. The prepare_context endpoint is still called on the
 * cloud/local Model-Router-API so RAG retrieval works.
 */
export async function streamLocalQuery(
  messages: OllamaMessage[],
  model: string,
  baseUrl: string,
  callbacks: StreamCallbacks,
  abortSignal?: AbortSignal,
) {
  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: true }),
    signal: abortSignal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    callbacks.onError(`Local LLM error ${res.status}: ${text}`);
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    callbacks.onError("No response stream from local LLM");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed.done) {
            callbacks.onDone();
            return;
          }
          if (parsed.message?.content) {
            callbacks.onToken(parsed.message.content);
          }
        } catch {
          // skip
        }
      }
    }
    callbacks.onDone();
  } catch (err: any) {
    if (err.name === "AbortError") return;
    callbacks.onError(err.message || "Local stream error");
  } finally {
    try { reader.cancel(); } catch { /* ignore */ }
  }
}

/* ---------- prepare_context ---------- */

export interface PrepareContextResult {
  chat_id: string;
  system_prompt: string;
  context_messages: OllamaMessage[];
  sources: SourceItem[];
}

export async function prepareContext(params: {
  knowledge_base_ids: string[];
  agent_id?: string;
  question: string;
  chat_id?: string;
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
    throw new Error("Session expired. Please log in again.");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`prepare_context error ${res.status}: ${text}`);
  }

  return res.json();
}

/* ---------- persist local response ---------- */

export async function persistLocalResponse(
  chat_id: string,
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
    body: JSON.stringify({ answer, sources }),
  });
}
