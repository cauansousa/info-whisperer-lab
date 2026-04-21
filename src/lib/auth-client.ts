import { createClient } from '@supabase/supabase-js';

// Vars dedicadas ao auth — não injetadas pelo Lovable, com fallback hardcoded.
const SUPABASE_URL =
  import.meta.env.VITE_AUTH_SUPABASE_URL ??
  "https://rgnvrzhzarpzzwbdhfxf.supabase.co";

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_AUTH_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnbnZyemh6YXJwenp3YmRoZnhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwOTE4MDgsImV4cCI6MjA4ODY2NzgwOH0.CCEmQqNmth6OoJbJOaS_BCdNHHqz1xZBWv-eWVGjVMU";

export const authSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
