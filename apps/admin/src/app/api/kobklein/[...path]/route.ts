import { auth0 } from "@/lib/auth0";
import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

async function handler(
  req: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  try {
    // Auth0 v4: use the Auth0Client instance to get the access token
    const tokenRes = await auth0.getAccessToken();
    if (!tokenRes?.token) {
      return NextResponse.json({ message: "Missing access token" }, { status: 401 });
    }

    const { path } = await ctx.params;
    const segments = (path || []).join("/");
    const url = new URL(segments, `${API_BASE}/`);

    // Forward query string from the original request
    const incoming = new URL(req.url);
    incoming.searchParams.forEach((v, k) => url.searchParams.set(k, v));

    const headers: Record<string, string> = {
      Authorization: `Bearer ${tokenRes.token}`,
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
    const message = e instanceof Error ? e.message : "Proxy error";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
