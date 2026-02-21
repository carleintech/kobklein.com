import { Redis as UpstashRedis } from "@upstash/redis";

// ─── Client factory ────────────────────────────────────────────
// Uses Upstash REST API (HTTPS port 443) instead of the raw Redis
// protocol (port 6379), which is frequently blocked by firewalls.

let _client: UpstashRedis | null = null;

function getClient(): UpstashRedis | null {
  if (_client) return _client;
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  _client = new UpstashRedis({ url, token });
  return _client;
}

// ─── Compatibility shim ────────────────────────────────────────
// Exposes the same surface as the previous node-redis proxy so no
// callers need to change.  SET options are normalised from the
// node-redis uppercase form ({ EX, PX, NX, XX }) to the Upstash
// lowercase form ({ ex, px, nx, xx }).

export const redis = {
  get isOpen(): boolean {
    return !!getClient();
  },
  get isReady(): boolean {
    return !!getClient();
  },
  async ping(): Promise<string | null> {
    const c = getClient();
    if (!c) return null;
    return c.ping();
  },
  async get(key: string): Promise<string | null> {
    const c = getClient();
    if (!c) return null;
    return c.get<string>(key);
  },
  async set(
    key: string,
    value: string,
    opts?: { EX?: number; PX?: number; NX?: boolean; XX?: boolean },
  ): Promise<string | null> {
    const c = getClient();
    if (!c) return null;
    const upstash: Record<string, any> = {};
    if (opts?.EX) upstash.ex = opts.EX;
    if (opts?.PX) upstash.px = opts.PX;
    if (opts?.NX) upstash.nx = true;
    if (opts?.XX) upstash.xx = true;
    return c.set(key, value, upstash) as Promise<string | null>;
  },
  async del(...keys: string[]): Promise<number | null> {
    const c = getClient();
    if (!c) return null;
    return c.del(...keys);
  },
  async incr(key: string): Promise<number | null> {
    const c = getClient();
    if (!c) return null;
    return c.incr(key);
  },
  async expire(key: string, seconds: number): Promise<number | null> {
    const c = getClient();
    if (!c) return null;
    return c.expire(key, seconds);
  },
};

// ─── Init (called once in AppModule.onModuleInit) ──────────────
// REST is stateless — no persistent connection to establish.
// We do a single PING to confirm credentials are valid.

export async function initRedis(): Promise<void> {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.warn("⚠ UPSTASH_REDIS_REST_URL/TOKEN not set — Redis features disabled");
    return;
  }
  try {
    const c = getClient();
    if (c) {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Upstash REST ping timed out after 5s")), 5000),
      );
      await Promise.race([c.ping(), timeout]);
      console.log("Redis (Upstash REST) connected");
    }
  } catch (err) {
    console.warn(
      "⚠ Redis (Upstash REST) ping failed — Redis features will be degraded:",
      err instanceof Error ? err.message : err,
    );
  }
}
