import { createClient } from "@supabase/supabase-js";

/**
 * Supabase admin client — uses the service role key (bypasses RLS).
 * Used for server-side operations like KYC document uploads to private buckets.
 */
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
