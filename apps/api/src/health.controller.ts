import { Controller, Get } from "@nestjs/common";
import { prisma } from "./db/prisma";
import { redis } from "./services/redis.client";

@Controller("health")
export class HealthController {
  /** Zero-cost keep-alive endpoint — configure Railway uptime monitor to hit this every 4 min */
  @Get("ping")
  ping() {
    return { ok: true };
  }

  @Get()
  async check() {
    const checks: Record<string, string> = {};

    // Database check
    try {
      await prisma.$queryRawUnsafe("SELECT 1");
      checks.database = "ok";
    } catch {
      checks.database = "down";
    }

    // Redis check
    try {
      if (redis.isOpen) {
        await redis.ping();
        checks.redis = "ok";
      } else {
        checks.redis = "disconnected";
      }
    } catch {
      checks.redis = "down";
    }

    const allOk = Object.values(checks).every((v) => v === "ok");

    return {
      status: allOk ? "ok" : "degraded",
      service: "kobklein-api",
      uptime: Math.floor(process.uptime()),
      checks,
      timestamp: new Date().toISOString(),
    };
  }
}
