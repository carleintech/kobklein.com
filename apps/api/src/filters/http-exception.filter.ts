import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response } from "express";
import { captureException } from "../monitoring/sentry";

/**
 * Global HTTP exception filter.
 * - Catches ALL exceptions (not just HttpException)
 * - Returns consistent JSON error shapes
 * - Logs unexpected (non-HTTP) errors with stack trace
 * - Reports to Sentry for monitoring
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = "Internal server error";
    let error = "Internal Server Error";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === "string") {
        message = body;
        error = body;
      } else if (typeof body === "object" && body !== null) {
        const obj = body as Record<string, unknown>;
        message = (obj.message as string | string[]) ?? message;
        error = (obj.error as string) ?? error;
      }
    } else {
      // Unexpected error — log full stack and report to Sentry
      console.error(
        `[UNHANDLED] ${req.method} ${req.url}`,
        exception instanceof Error ? exception.stack : exception,
      );
      captureException(exception, {
        method: req.method,
        url: req.url,
        userId: (req as any).user?.sub,
      });
    }

    res.status(status).json({
      statusCode: status,
      error,
      message,
      path: req.url,
      timestamp: new Date().toISOString(),
    });
  }
}
