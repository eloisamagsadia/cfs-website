import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * Admin client using the service role key.
 * Bypasses RLS — use ONLY in server-side API routes (webhooks, admin actions).
 * NEVER expose this client or the service role key to the browser.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
