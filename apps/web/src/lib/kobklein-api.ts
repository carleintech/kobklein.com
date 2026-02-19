/**
 * Client-side API helpers that call through the authenticated proxy.
 *
 * Architecture (Production-Grade, same as Stripe / Linear / Vercel):
 *
 *   Browser fetch → /api/kobklein/[path] (Next.js proxy)
 *                        ↓ reads auth cookies server-side
 *                        ↓ injects Bearer token
 *                   NestJS API (port 3001)
 *
 * The proxy at /api/kobklein/[...path]/route.ts handles ALL token injection
 * using server-side cookies — the client never needs to touch the session.
 *
 * Usage:
 *   const data = await kkGet<MyType>("v1/users/me");
 *   const result = await kkPost<T>("v1/transfers/attempt", payload, idempotencyKey);
 */

/* ------------------------------------------------------------------ */
/*  Structured error class                                             */
/* ------------------------------------------------------------------ */

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }

  /** True when the NestJS backend is unreachable (503 from proxy). */
  get isApiUnavailable(): boolean {
    return this.status === 503 || this.code === "API_UNAVAILABLE";
  }
}

/* ------------------------------------------------------------------ */
/*  Internal helper                                                    */
/* ------------------------------------------------------------------ */

async function parseError(res: Response): Promise<ApiError> {
  let body: { message?: string; code?: string } = {};
  try {
    body = await res.json();
  } catch {
    body = { message: await res.text().catch(() => `API ${res.status}`) };
  }
  return new ApiError(res.status, body.message || `API ${res.status}`, body.code);
}

/* ------------------------------------------------------------------ */
/*  Public helpers — the proxy injects the Bearer token automatically  */
/* ------------------------------------------------------------------ */

export async function kkGet<T>(path: string): Promise<T> {
  const res = await fetch(`/api/kobklein/${path}`, {
    cache: "no-store",
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function kkPost<T>(
  path: string,
  body?: unknown,
  idempotencyKey?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
  };
  const res = await fetch(`/api/kobklein/${path}`, {
    method: "POST",
    headers,
    body: body ? JSON.stringify(body) : "{}",
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function kkPatch<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/kobklein/${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : "{}",
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function kkDelete<T>(path: string): Promise<T> {
  const res = await fetch(`/api/kobklein/${path}`, {
    method: "DELETE",
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

/* Aliases so legacy imports from "@/lib/api" still resolve */
export const apiGet = kkGet;
export const apiPost = kkPost;
