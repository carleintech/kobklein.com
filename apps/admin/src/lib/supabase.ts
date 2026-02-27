// ─────────────────────────────────────────────────────────────────────────────
// supabase.ts  —  CLIENT-SAFE exports only (no next/headers)
//
// ✅ Safe to import in Client Components, middleware, anywhere
// ❌ DO NOT add `import { cookies } from "next/headers"` here
//
// For Server Components / Server Actions use: @/lib/supabase-server
// ─────────────────────────────────────────────────────────────────────────────

import { createBrowserClient } from "@supabase/ssr";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ─── Browser Client ───────────────────────────────────────────────────────────
// Use in: Client Components ("use client")
export function createAdminBrowserClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ─── Middleware Client ────────────────────────────────────────────────────────
// Use in: middleware.ts only — reads from req, writes to res
export function createMiddlewareClient(req: NextRequest, res: NextResponse) {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) =>
          res.cookies.set(name, value, options ?? {}),
        );
      },
    },
  });
}
