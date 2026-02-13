import { Injectable, NestMiddleware } from "@nestjs/common";

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const start = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - start;

      const log = {
        ts: new Date().toISOString(),
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs: duration,
        ip: req.ip || req.headers["x-forwarded-for"],
        userId: req.localUser?.id,
        auth0Id:
          req.user?.["https://kobklein.com/user_id"] || req.user?.sub,
      };

      // For now console → later ship to ELK / Datadog
      console.log(JSON.stringify(log));
    });

    next();
  }
}
