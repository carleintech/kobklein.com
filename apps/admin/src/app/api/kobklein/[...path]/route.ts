import { NextResponse } from "next/server";
import { createAdminServerClient } from "@/lib/supabase-server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

async function handler(
  req: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  try {
    // Get Supabase access token for the current admin session
    let accessToken: string;
    try {
      const supabase = await createAdminServerClient();
      const { data: { session } } = await supabase.auth.getSession();
      accessToken = session?.access_token ?? "";
    } catch {
      accessToken = "";
    }

    if (!accessToken) {
      return NextResponse.json({ message: "Missing access token" }, { status: 401 });
    }

    const { path } = await ctx.params;
    const segments = (path || []).join("/");
    const url = new URL(segments, `${API_BASE}/`);

    // Forward query string from the original request
    const incoming = new URL(req.url);
    incoming.searchParams.forEach((v, k) => url.searchParams.set(k, v));

    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": req.headers.get("content-type") || "application/json",
    };

    // Forward idempotency key if present
    const idempotencyKey = req.headers.get("idempotency-key");
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

    const upstream = await fetch(url.toString(), {
      method: req.method,
      headers,
      body: req.method === "GET" || req.method === "HEAD" ? undefined : await req.text(),
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
    const msg = e instanceof Error ? e.message : String(e);
    const isDown = msg.includes("ECONNREFUSED") || msg.includes("fetch failed");

    if (isDown) {
      return NextResponse.json(
        { message: "API service is unavailable. The backend server is not running.", code: "API_UNAVAILABLE" },
        { status: 503 },
      );
    }

    console.error("[Proxy] Unexpected error:", msg);
    return NextResponse.json(
      { message: "Failed to reach the API service.", code: "PROXY_ERROR" },
      { status: 502 },
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
