import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "[KnowledgeAI] Missing Supabase environment variables. " +
    "Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env"
  );
}

export const authSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export async function getToken(): Promise<string> {
  const { data } = await authSupabase.auth.getSession();
  return data.session?.access_token ?? "";
}
