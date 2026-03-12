import { createServerClient } from "@/lib/supabase/server";
import type { MeResponse } from "@/types/api";

const AUTH_API_URL = process.env.AUTH_API_URL || "http://localhost:8001";

export async function getAuthContext() {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  try {
    const res = await fetch(`${AUTH_API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) return null;

    const profile = (await res.json()) as MeResponse;
    return { session, profile };
  } catch {
    return null;
  }
}
