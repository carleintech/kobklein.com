import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client — used in Client Components.
 * Safe to call multiple times; the SDK deduplicates internally.
 */
export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
