import { authSupabase } from "@/lib/auth-client";
import type { QueryRequest, SourceItem } from "@/types";

const MODEL_BASE =
  (import.meta.env.VITE_MODEL_BASE_URL as string | undefined) ??
  "https://api.knowledge.cauansousa.com/model";

async function getToken(): Promise<string> {
  const { data } = await authSupabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not authenticated");
  return token;
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onSources?: (sources: SourceItem[]) => void;
  onChatId?: (chatId: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
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

  const res = await fetch(`${MODEL_BASE}/query`, {
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
    callbacks.onError(errBody.detail || errBody.message || errBody.error || `API error ${res.status}`);
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
  }
}
