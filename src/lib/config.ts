export function getApiBase(): string {
  return import.meta.env.VITE_API_URL || getDefaultApiBase();
}

export function getLocalInferenceUrl(): string {
  return import.meta.env.VITE_LOCAL_INFERENCE_URL || "http://localhost:11434";
}

export function getDefaultApiBase(): string {
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:8000";
  }
  return import.meta.env.VITE_API_URL || "http://localhost:8000";
}

export function isRunningInTauri(): boolean {
  return (
    typeof window !== "undefined" &&
    ("__TAURI_INTERNALS__" in window || "__TAURI__" in window)
  );
}
