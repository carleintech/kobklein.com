"use client";

/**
 * Language Switcher — KobKlein Web App
 *
 * Compact pill-style switcher showing 4 locale options.
 * Follows Sovereign Luxury design (gold active state).
 */
import { useI18n, LOCALES, LOCALE_NAMES, type Locale } from "@/lib/i18n";
import { Globe } from "lucide-react";

const SHORT_LABELS: Record<Locale, string> = {
  en: "EN",
  fr: "FR",
  ht: "HT",
  es: "ES",
};

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex items-center gap-1.5">
      <Globe size={14} className="text-kob-muted" />
      {LOCALES.map((loc) => (
        <button
          key={loc}
          onClick={() => setLocale(loc)}
          title={LOCALE_NAMES[loc]}
          className={`
            px-2 py-0.5 rounded text-xs font-medium transition-colors
            ${
              locale === loc
                ? "bg-kob-gold/20 text-kob-gold"
                : "text-kob-muted hover:text-kob-body"
            }
          `}
        >
          {SHORT_LABELS[loc]}
        </button>
      ))}
    </div>
  );
}
