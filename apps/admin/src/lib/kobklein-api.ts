/**
 * Client-side API helpers that call through the authenticated proxy.
 *
 * Usage (in client components):
 *   const data = await kkGet<MyType>("admin/audit/logs?take=10");
 *   const result = await kkPost<RunResult>("admin/recon/run", {}, `recon-${Date.now()}`);
 *
 * The proxy at /api/kobklein/[...path] injects the Admin Bearer token automatically.
 */

export async function kkGet<T>(path: string): Promise<T> {
  const res = await fetch(`/api/kobklein/${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function kkPost<T>(
  path: string,
  body?: unknown,
  idempotencyKey?: string,
): Promise<T> {
  const res = await fetch(`/api/kobklein/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: body ? JSON.stringify(body) : "{}",
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function kkPatch<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/kobklein/${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : "{}",
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function kkDelete<T>(path: string): Promise<T> {
  const res = await fetch(`/api/kobklein/${path}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}
