import { createClient, type RedisClientType } from "redis";

let _redis: RedisClientType | null = null;
let _initialized = false;

function getOrCreateClient(): RedisClientType | null {
  if (!_initialized) {
    _initialized = true;
    const url = process.env.REDIS_URL;
    if (!url || url.includes("localhost") || url.includes("127.0.0.1")) return null;
    _redis = createClient({ url }) as RedisClientType;
    _redis.on("error", (err) => {
      console.error("Redis error:", err.message ?? err);
    });
  }
  return _redis;
}

/** Lazy export — only creates the client on first access.
 *  When Redis is unavailable, all method calls return safe no-op values
 *  so callers don't need to guard every redis.xxx() call. */
export const redis = new Proxy({} as RedisClientType, {
  get(_target, prop) {
    const client = getOrCreateClient();
    if (!client) {
      // No REDIS_URL — return safe no-op defaults
      if (prop === "isOpen") return false;
      if (prop === "isReady") return false;
      // All Redis commands return a no-op promise resolving to null
      if (typeof prop === "string") {
        return (..._args: any[]) => Promise.resolve(null);
      }
      return undefined;
    }
    return (client as any)[prop];
  },
});

export async function initRedis() {
  const url = process.env.REDIS_URL;
  if (!url || url.includes("localhost") || url.includes("127.0.0.1")) {
    console.warn("⚠ REDIS_URL not set — Redis features disabled");
    return;
  }
  try {
    const client = getOrCreateClient();
    if (client && !client.isOpen) {
      await client.connect();
      console.log("Redis connected");
    }
  } catch (err) {
    console.warn(
      "⚠ Redis connection failed — features requiring Redis will be degraded:",
      err instanceof Error ? err.message : err,
    );
  }
}
