import { createClient, type RedisClientType } from "redis";

const url = process.env.REDIS_URL;

export const redis: RedisClientType = createClient({ url }) as RedisClientType;

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

export async function initRedis() {
  if (!redis.isOpen) {
    await redis.connect();
    console.log("Redis connected");
  }
}
