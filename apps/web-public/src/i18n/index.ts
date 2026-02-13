import type enDict from "./dictionaries/en.json";

export type Dictionary = typeof enDict;
export type Locale = "en" | "fr" | "es" | "ht";

export const locales: Locale[] = ["en", "fr", "es", "ht"];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
  ht: "Kreyòl",
};

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import("./dictionaries/en.json").then((m) => m.default),
  fr: () => import("./dictionaries/fr.json").then((m) => m.default),
  es: () => import("./dictionaries/es.json").then((m) => m.default),
  ht: () => import("./dictionaries/ht.json").then((m) => m.default),
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  const loader = dictionaries[locale] || dictionaries.en;
  return loader();
}
