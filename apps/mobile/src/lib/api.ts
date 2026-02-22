/**
 * KobKlein Mobile API Client
 *
 * Mirrors kkGet / kkPost / kkPatch / kkDelete from apps/web
 * but uses Bearer token auth instead of cookies.
 */
import * as SecureStore from "expo-secure-store";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3001";
const TOKEN_KEY = "kobklein_auth_token";

/* ------------------------------------------------------------------ */
/*  Token management                                                   */
/* ------------------------------------------------------------------ */

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

/* ------------------------------------------------------------------ */
/*  Core fetch wrapper                                                 */
/* ------------------------------------------------------------------ */

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>,
): Promise<T> {
  const token = await getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${BASE_URL}${normalizedPath}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // Try to parse NestJS error response for a better message
    try {
      const json = JSON.parse(text);
      throw new Error(json.message ?? text);
    } catch {
      throw new Error(`API ${res.status}: ${text}`);
    }
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

/* ------------------------------------------------------------------ */
/*  Public helpers                                                     */
/* ------------------------------------------------------------------ */

export function kkGet<T>(path: string): Promise<T> {
  return request<T>("GET", path);
}

export function kkPost<T>(
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>,
): Promise<T> {
  return request<T>("POST", path, body, extraHeaders);
}

export function kkPatch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("PATCH", path, body);
}

export function kkDelete<T>(path: string): Promise<T> {
  return request<T>("DELETE", path);
}
