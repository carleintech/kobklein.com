import { createClient, type RedisClientType } from "redis";

let _redis: RedisClientType | null = null;
let _initialized = false;

function getOrCreateClient(): RedisClientType | null {
  if (!_initialized) {
    _initialized = true;
    const url = process.env.REDIS_URL;
    if (!url) return null;
    _redis = createClient({ url }) as RedisClientType;
    _redis.on("error", (err) => {
      console.error("Redis error:", err.message ?? err);
    });
  }
  return _redis;
}

/** Lazy export — only creates the client on first access */
export const redis = new Proxy({} as RedisClientType, {
  get(_target, prop) {
    const client = getOrCreateClient();
    if (!client) {
      // No REDIS_URL — return safe defaults
      if (prop === "isOpen") return false;
      if (prop === "ping") return () => Promise.reject(new Error("Redis not configured"));
      if (prop === "connect") return () => Promise.reject(new Error("Redis not configured"));
      return undefined;
    }
    return (client as any)[prop];
  },
});

export async function initRedis() {
  const url = process.env.REDIS_URL;
  if (!url) {
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
