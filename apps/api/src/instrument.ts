/**
 * Sentry Instrumentation — KobKlein API
 *
 * Imported as the FIRST side-effect in main.ts (after dotenv.config()).
 * Uses @sentry/nestjs for full NestJS request tracing + error capture.
 *
 * FINTECH settings:
 *  - sendDefaultPii: false  → never auto-attach IP / user agent
 *  - beforeSend strips Authorization + Cookie headers
 *  - Transient network errors are ignored (not actionable)
 */
import * as Sentry from "@sentry/nestjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV ?? "development",
  release: `kobklein-api@${process.env.npm_package_version ?? "0.0.1"}`,

  // Lower sample rate in production to keep quota manageable
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // FINTECH: never send PII automatically
  sendDefaultPii: false,

  // Strip auth headers before any event leaves the server
  beforeSend(event) {
    if (event.request?.headers) {
      delete event.request.headers["authorization"];
      delete event.request.headers["cookie"];
    }
    return event;
  },

  // Transient network errors — not actionable, skip them
  ignoreErrors: [
    "ECONNRESET",
    "EPIPE",
    "ETIMEDOUT",
    "ERR_STREAM_PREMATURE_CLOSE",
  ],
});
