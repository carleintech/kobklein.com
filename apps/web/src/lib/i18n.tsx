"use client";

/**
 * i18n Integration for KobKlein Web App
 *
 * Cookie-based locale with React context.
 * Uses @kobklein/i18n shared package for translations.
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  t as translate,
  dictionaries,
  LOCALES,
  LOCALE_NAMES,
  type Locale,
} from "@kobklein/i18n";

// ─── Context ─────────────────────────────────────────────────────────

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (path) => path,
});

// ─── Cookie helpers ──────────────────────────────────────────────────

function getLocaleCookie(): Locale {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|; )locale=(\w+)/);
  const val = match?.[1];
  if (val && LOCALES.includes(val as Locale)) return val as Locale;
  return "en";
}

function setLocaleCookie(locale: Locale) {
  document.cookie = `locale=${locale}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
}

// ─── Provider ────────────────────────────────────────────────────────

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getLocaleCookie);

  const setLocale = useCallback((next: Locale) => {
    setLocaleCookie(next);
    setLocaleState(next);
    // Update html lang attribute
    document.documentElement.lang = next;
  }, []);

  const t = useCallback(
    (path: string, vars?: Record<string, string | number>) =>
      translate(locale, path, vars),
    [locale],
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────

export function useI18n() {
  return useContext(I18nContext);
}

// Re-export for convenience
export { LOCALES, LOCALE_NAMES, type Locale };
