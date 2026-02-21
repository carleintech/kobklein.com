import { auth0 } from "./auth0";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

/**
 * Server-side fetch that automatically attaches the Auth0 access token.
 * Use in Server Components, Route Handlers, and Server Actions.
 */
export async function apiFetch<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  let token = "";
  try {
    const { token: accessToken } = await auth0.getAccessToken();
    token = accessToken ?? "";
  } catch {
    // No session / token — caller handles empty data gracefully
  }

  // Normalize: ensure every path is under /v1 regardless of how callers wrote it
  const normalizedPath = path.startsWith("/v1") ? path : `/v1${path.startsWith("/") ? "" : "/"}${path.replace(/^\//, "")}`;
  const res = await fetch(`${API}${normalizedPath}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text}`);
  }

  return res.json();
}

/**
 * Convenience GET that swallows errors and returns a fallback.
 */
export async function apiGet<T = unknown>(path: string, fallback: T): Promise<T> {
  try {
    return await apiFetch<T>(path);
  } catch {
    return fallback;
  }
}

/**
 * Convenience POST that sends JSON data.
 */
export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
