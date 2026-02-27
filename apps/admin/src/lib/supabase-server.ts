// ─────────────────────────────────────────────────────────────────────────────
// supabase-server.ts  —  SERVER-ONLY (uses next/headers)
//
// ✅ Use in: Server Components, Server Actions, Route Handlers
// ❌ NEVER import in Client Components ("use client") — will crash
//
// For Client Components use: @/lib/supabase  →  createAdminBrowserClient()
// ─────────────────────────────────────────────────────────────────────────────

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function createAdminServerClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Silently ignored in read-only Server Component contexts
        }
      },
    },
  });
}
