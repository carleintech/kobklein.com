/**
 * i18n — KobKlein Mobile
 *
 * 4 locales: en, fr, es, ht (Haitian Creole)
 * Uses i18n-js with expo-localization for device language detection.
 */
import { I18n } from "i18n-js";
import { getLocales } from "expo-localization";
import en from "./locales/en";
import fr from "./locales/fr";
import es from "./locales/es";
import ht from "./locales/ht";

const i18n = new I18n({ en, fr, es, ht });

// Detect device locale, fallback to English
const deviceLocale = getLocales()[0]?.languageCode ?? "en";
i18n.locale = ["en", "fr", "es", "ht"].includes(deviceLocale)
  ? deviceLocale
  : "en";

i18n.enableFallback = true;
i18n.defaultLocale = "en";

export default i18n;
export type TranslationKeys = keyof typeof en;
