import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _serviceClient: SupabaseClient<any> | null = null;

/**
 * Returns a Supabase client using the SERVICE_ROLE_KEY.
 * This client bypasses Row Level Security — use only in BFF API routes.
 * Typed as `SupabaseClient<any>` because we don't generate database types;
 * once `supabase gen types` is wired in, replace `any` with the generated `Database` type.
 */
export function getServiceClient() {
  if (!_serviceClient) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }
    _serviceClient = createClient<any>(url, key);
  }
  return _serviceClient;
}
