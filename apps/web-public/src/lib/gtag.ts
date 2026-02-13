export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

declare global {
  interface Window {
    gtag: (
      command: string,
      action: string,
      params?: Record<string, unknown>
    ) => void;
  }
}

/**
 * Track a custom GA4 event.
 *
 * @param action  - Event name (e.g. "waitlist_signup", "fx_calculation")
 * @param category - Event category (e.g. "engagement", "cta", "page")
 * @param label   - Optional label for extra context
 * @param value   - Optional numeric value
 */
export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number,
): void {
  if (typeof window === "undefined" || !window.gtag) return;

  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value,
  });
}
