/**
 * Plausible Analytics — privacy-first event tracking.
 * No cookies, no cross-site tracking, GDPR-compliant.
 * Events only fire if NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set.
 */
declare global {
  interface Window {
    plausible?: (
      event: string,
      opts?: { props?: Record<string, string | number> },
    ) => void;
  }
}

export function trackEvent(
  name: string,
  props?: Record<string, string | number>,
) {
  if (typeof window !== "undefined") {
    window.plausible?.(name, props ? { props } : undefined);
  }
}
