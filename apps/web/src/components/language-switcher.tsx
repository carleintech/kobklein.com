"use client";

/**
 * Language Switcher — KobKlein Web App
 * Compact globe icon → dropdown, no inline pills.
 */
import { useState, useRef, useEffect } from "react";
import { useI18n, LOCALES, LOCALE_NAMES, type Locale } from "@/lib/i18n";
import { Globe, Check, ChevronDown } from "lucide-react";

const SHORT_LABELS: Record<Locale, string> = {
  en: "EN",
  fr: "FR",
  ht: "HT",
  es: "ES",
};

const FLAG_EMOJI: Record<Locale, string> = {
  en: "🇺🇸",
  fr: "🇫🇷",
  ht: "🇭🇹",
  es: "🇪🇸",
};

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen]       = useState(false);
  const ref                   = useRef<HTMLDivElement>(null);

  /* Close on outside click */
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl
                   bg-white/[0.03] border border-white/[0.06]
                   hover:bg-white/[0.06] hover:border-white/[0.10]
                   transition-all duration-150 group"
      >
        <Globe className="h-3.5 w-3.5 text-[#4A5A72] group-hover:text-[#C9A84C] transition-colors shrink-0" />
        <span className="text-xs font-semibold text-[#7A8394] group-hover:text-[#C9A84C] transition-colors">
          {SHORT_LABELS[locale]}
        </span>
        <ChevronDown
          className={`h-3 w-3 text-[#3A4558] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-44 z-50
                     bg-[#081A12] border border-[#0D9E8A]/[0.20] rounded-xl
                     shadow-2xl shadow-black/60 overflow-hidden py-1"
        >
          {LOCALES.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => { setLocale(loc); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors
                ${locale === loc
                  ? "bg-[#C9A84C]/10 text-[#C9A84C]"
                  : "text-[#7A8394] hover:bg-white/[0.04] hover:text-[#E0E4EE]"
                }`}
            >
              <span className="text-base leading-none">{FLAG_EMOJI[loc]}</span>
              <span className="flex-1 text-left font-medium">{LOCALE_NAMES[loc]}</span>
              <span className="text-[10px] font-bold opacity-50">{SHORT_LABELS[loc]}</span>
              {locale === loc && (
                <Check className="h-3 w-3 shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
