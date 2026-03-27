/**
 * Local LLM (Ollama) integration for the Tauri desktop app.
 * Routes queries directly to localhost:11434, bypassing the cloud backend.
 */
import type { StreamCallbacks } from "./stream-query";

export const LOCAL_OLLAMA_MODEL_KEY = "knowledgeai:localOllamaModel";
export const USE_LOCAL_OLLAMA_KEY   = "knowledgeai:useLocalOllama";

export function getLocalOllamaModel(): string {
  return localStorage.getItem(LOCAL_OLLAMA_MODEL_KEY) ?? "";
}

/**
 * In the desktop app, local Ollama is ON by default when a model is configured.
 * The toggle in Settings lets the user explicitly force cloud if desired.
 * Returns false only when the user has explicitly set it to "false".
 */
export function isUsingLocalOllama(): boolean {
  const saved = localStorage.getItem(USE_LOCAL_OLLAMA_KEY);
  if (saved === null) return true;   // default ON (not yet set by user)
  return saved === "true";
}

export function setUseLocalOllama(value: boolean) {
  localStorage.setItem(USE_LOCAL_OLLAMA_KEY, String(value));
}

export function setLocalOllamaModel(model: string) {
  localStorage.setItem(LOCAL_OLLAMA_MODEL_KEY, model);
}

export async function listOllamaModels(): Promise<string[]> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<string[]>("list_ollama_models");
}

interface OllamaEvent {
  type: "token" | "done" | "error";
  content?: string;
  message?: string;
}

export interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Streams a response from local Ollama using Tauri IPC Channel.
 * Uses the same StreamCallbacks interface as streamQuery so Chat.tsx
 * can swap between cloud and local transparently.
 */
export async function streamQueryOllama(
  model: string,
  messages: OllamaMessage[],
  callbacks: StreamCallbacks,
  signal?: AbortSignal
) {
  const { invoke, Channel } = await import("@tauri-apps/api/core");

  const channel = new Channel<OllamaEvent>();
  let finished = false;

  channel.onmessage = (event) => {
    if (finished) return;

    if (event.type === "token" && event.content) {
      callbacks.onToken(event.content);
    } else if (event.type === "done") {
      finished = true;
      callbacks.onDone();
    } else if (event.type === "error") {
      finished = true;
      callbacks.onError(event.message ?? "Erro no Ollama local");
    }
  };

  signal?.addEventListener("abort", () => {
    finished = true;
  });

  try {
    await invoke("query_ollama", {
      model,
      messages,
      onEvent: channel,
    });
  } catch (e: unknown) {
    if (!finished) {
      const msg = e instanceof Error ? e.message : String(e);
      callbacks.onError(msg || "Erro ao invocar Ollama");
    }
  }
}
