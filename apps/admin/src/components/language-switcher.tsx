"use client";

/**
 * Language Switcher — KobKlein Admin
 *
 * Compact switcher for admin topbar.
 * Gold active indicator following Command Center design.
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
    <div className="flex items-center gap-1">
      <Globe size={14} className="text-neutral-500" />
      {LOCALES.map((loc) => (
        <button
          key={loc}
          onClick={() => setLocale(loc)}
          title={LOCALE_NAMES[loc]}
          className={`
            px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors
            ${
              locale === loc
                ? "bg-[#C6A756]/20 text-[#C6A756]"
                : "text-neutral-500 hover:text-neutral-300"
            }
          `}
        >
          {SHORT_LABELS[loc]}
        </button>
      ))}
    </div>
  );
}
