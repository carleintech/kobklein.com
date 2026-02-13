/**
 * @kobklein/i18n — Shared Translation Package
 *
 * Usage (Next.js server component):
 *   import { t, type Locale } from "@kobklein/i18n";
 *   const label = t("en", "common.appName"); // "KobKlein"
 *
 * Usage (React client / Expo):
 *   import { dictionaries } from "@kobklein/i18n";
 *   const dict = dictionaries["fr"];
 *   // use dict.common.appName etc.
 */
import en, { type TranslationKeys } from "./locales/en";
import fr from "./locales/fr";
import ht from "./locales/ht";
import es from "./locales/es";

export type Locale = "en" | "fr" | "ht" | "es";

export const LOCALES: Locale[] = ["en", "fr", "ht", "es"];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  ht: "Kreyòl Ayisyen",
  es: "Español",
};

export const dictionaries: Record<Locale, TranslationKeys> = {
  en,
  fr: fr as unknown as TranslationKeys,
  ht: ht as unknown as TranslationKeys,
  es: es as unknown as TranslationKeys,
};

/**
 * Get a translation by dot-path.
 * Falls back to English if key not found in target locale.
 *
 * Supports {{variable}} interpolation:
 *   t("en", "dashboard.greeting", { name: "Jean" })
 *   // → "Hello, Jean"
 */
export function t(
  locale: Locale,
  path: string,
  vars?: Record<string, string | number>,
): string {
  const dict = dictionaries[locale] ?? dictionaries.en;
  let result = resolvePath(dict, path);

  // Fallback to English
  if (result === undefined && locale !== "en") {
    result = resolvePath(dictionaries.en, path);
  }

  // If still not found, return the path as-is
  if (typeof result !== "string") return path;

  // Interpolation
  if (vars) {
    return result.replace(/\{\{(\w+)\}\}/g, (_, key) =>
      vars[key] !== undefined ? String(vars[key]) : `{{${key}}}`,
    );
  }

  return result;
}

/**
 * Resolve a dot-separated path on a nested object.
 */
function resolvePath(obj: any, path: string): string | undefined {
  const parts = path.split(".");
  let cur = obj;

  for (const p of parts) {
    if (cur === null || cur === undefined) return undefined;
    cur = cur[p];
  }

  return typeof cur === "string" ? cur : undefined;
}

// Re-export types
export type { TranslationKeys };
