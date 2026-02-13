/**
 * Sentry Monitoring — KobKlein API
 *
 * Initializes Sentry error tracking and performance monitoring.
 * Must be imported BEFORE all other imports in main.ts.
 */
import * as Sentry from "@sentry/node";

const dsn = process.env.SENTRY_DSN;

export function initSentry() {
  if (!dsn) {
    console.log("Sentry DSN not configured — error monitoring disabled");
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",
    release: `kobklein-api@${process.env.npm_package_version ?? "0.0.1"}`,

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

    // Filter sensitive data
    beforeSend(event) {
      // Strip authorization headers
      if (event.request?.headers) {
        delete event.request.headers["authorization"];
        delete event.request.headers["cookie"];
      }
      return event;
    },

    // Ignore noisy errors
    ignoreErrors: [
      "ECONNRESET",
      "EPIPE",
      "ETIMEDOUT",
      "ERR_STREAM_PREMATURE_CLOSE",
    ],
  });

  console.log(`Sentry initialized (env: ${process.env.NODE_ENV})`);
}

/**
 * Capture an exception with optional context.
 */
export function captureException(
  error: Error | unknown,
  context?: Record<string, unknown>,
) {
  if (!dsn) return;

  if (context) {
    Sentry.withScope((scope) => {
      for (const [key, value] of Object.entries(context)) {
        scope.setExtra(key, value);
      }
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

/**
 * Capture a custom message (info, warning, etc.)
 */
export function captureMessage(
  message: string,
  level: "info" | "warning" | "error" = "info",
) {
  if (!dsn) return;
  Sentry.captureMessage(message, level);
}

/**
 * Set user context for Sentry events.
 */
export function setUser(user: { id: string; role?: string; kId?: string }) {
  Sentry.setUser(user);
}
