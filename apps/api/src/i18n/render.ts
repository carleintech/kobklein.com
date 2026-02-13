import { templates, type Lang } from "./templates";

/**
 * Render a notification template in the specified language.
 *
 * Falls back to English if the requested language is missing.
 * Falls back to raw templateKey if the template is not found.
 */
export function renderTemplate(
  templateKey: string,
  lang: Lang,
  params: Record<string, any>,
): { title: string; body: string } {
  const template = templates[templateKey];

  if (!template) {
    // Unknown template — return the key as-is
    return { title: templateKey, body: "" };
  }

  const fn = template[lang] || template.en;
  if (!fn) {
    return { title: templateKey, body: "" };
  }

  try {
    return fn(params || {});
  } catch {
    // If rendering fails (e.g. missing param), fall back gracefully
    return { title: templateKey, body: "" };
  }
}

/**
 * Validate a language code. Returns a valid Lang or defaults to "en".
 */
export function toLang(input?: string | null): Lang {
  const valid: Lang[] = ["en", "fr", "ht", "es"];
  const normalized = (input || "en").toLowerCase() as Lang;
  return valid.includes(normalized) ? normalized : "en";
}
