/**
 * Sentry Monitoring — KobKlein API
 *
 * Convenience helpers re-exported for use across the codebase.
 * Sentry is initialized in src/instrument.ts (loaded first in main.ts).
 */
import * as Sentry from "@sentry/nestjs";

/**
 * Capture an exception with optional context.
 */
export function captureException(
  error: Error | unknown,
  context?: Record<string, unknown>,
) {
  if (!process.env.SENTRY_DSN) return;

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
  if (!process.env.SENTRY_DSN) return;
  Sentry.captureMessage(message, level);
}

/**
 * Set user context for Sentry events.
 */
export function setUser(user: { id: string; role?: string; kId?: string }) {
  Sentry.setUser(user);
}
