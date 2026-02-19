
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

/**
 * KobKlein API Proxy
 *
 * This is the AUTHORITATIVE token injector. It reads the Supabase session
 * from server-side cookies (set by middleware on every request) and injects
 * the Bearer token before forwarding to the NestJS backend.
 *
 * This pattern is production-grade (same as Stripe, Linear, Vercel):
 *   Browser → Next.js proxy (reads cookies → injects Bearer) → NestJS API
 *
 * The client never needs to manually pass tokens — the server does it from
 * the cookie store, which is always up-to-date after middleware refresh.
 */
async function handler(
  req: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await ctx.params;
    const segments = (path || []).join("/");
    const url = new URL(segments, `${API_BASE}/`);

    // Forward query string from the original request
    const incoming = new URL(req.url);
    incoming.searchParams.forEach((v, k) => url.searchParams.set(k, v));

    // ── Read the session from server-side cookies (SSR-safe, always fresh) ──
    // Must use getAll/setAll to support chunked cookies (Supabase splits large
    // auth tokens across sb-...-auth-token.0, .1, .2 etc.)
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {}, // read-only in proxy route
        },
      },
    );

    // getSession() reads the session from cookies (chunked cookie support via getAll).
    // This is the recommended approach for Route Handlers — getUser() would make
    // an extra network call to Supabase on every proxied request.
    const { data: { session } } = await supabase.auth.getSession();
    const serverToken = session?.access_token;

    // Prefer the server-derived token; fall back to whatever the client sent
    // (covers edge cases like server action calls that already have a token)
    const clientToken = req.headers.get("authorization")?.replace("Bearer ", "");
    const bearerToken = serverToken || clientToken || "";

    const headers: Record<string, string> = {
      "Content-Type": req.headers.get("content-type") || "application/json",
    };

    if (bearerToken) {
      headers["Authorization"] = `Bearer ${bearerToken}`;
    }

    // Forward idempotency key if present
    const idempotencyKey = req.headers.get("idempotency-key");
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

    const upstream = await fetch(url.toString(), {
      method: req.method,
      headers,
      body: req.method === "GET" || req.method === "HEAD"
        ? undefined
        : await req.text(),
      cache: "no-store",
    });

    const text = await upstream.text();

    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "application/json",
      },
    });
  } catch (e: unknown) {
    console.error("[Proxy] Unexpected error:", e);
    return NextResponse.json(
      { message: "API service is unavailable.", code: "API_UNAVAILABLE" },
      { status: 503 },
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
