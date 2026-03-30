const DEFAULT_API_BASE = "https://api.knowledge.cauansousa.com";
const STORAGE_KEY = "knowledgeai:apiBase";

export function getApiBase(): string {
  return localStorage.getItem(STORAGE_KEY) ?? import.meta.env.VITE_API_BASE ?? DEFAULT_API_BASE;
}

export function setApiBase(url: string): void {
  localStorage.setItem(STORAGE_KEY, url.replace(/\/$/, ""));
}

export function resetApiBase(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getDefaultApiBase(): string {
  return DEFAULT_API_BASE;
}

export function isRunningInTauri(): boolean {
  return (
    typeof window !== "undefined" &&
    ("__TAURI_INTERNALS__" in window || "__TAURI__" in window)
  );
}
