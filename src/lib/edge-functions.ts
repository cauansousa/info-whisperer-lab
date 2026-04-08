const FUNCTIONS_BASE = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1`;

export async function invokeEdgeFunction(name: string, options: {
  token: string;
  body?: Record<string, unknown>;
}): Promise<{ data: any; error: Error | null }> {
  try {
    const res = await fetch(`${FUNCTIONS_BASE}/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${options.token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) return { data: null, error: new Error(data.error || `HTTP ${res.status}`) };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}
