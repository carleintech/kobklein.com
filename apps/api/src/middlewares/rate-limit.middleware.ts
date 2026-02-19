import { Injectable, NestMiddleware } from "@nestjs/common";
import { redis } from "../services/redis.client";

function key(ip: string) {
  return `ratelimit:ip:${ip}`;
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  async use(req: any, res: any, next: () => void) {
    // Skip rate limiting if Redis is not available
    if (!redis.isOpen) {
      next();
      return;
    }

    const ip =
      req.ip || req.headers["x-forwarded-for"]?.toString() || "unknown";

    const k = key(ip);

    try {
      const count = await redis.incr(k);

      if (count === 1) {
        await redis.expire(k, 60); // 1 minute window
      }

      const MAX = 120; // 120 req/min

      if (count > MAX) {
        res.status(429).json({
          message: "Too many requests",
          requestId: req.requestId,
        });
        return;
      }
    } catch {
      // Redis unavailable — allow request through
    }

    next();
  }
}
