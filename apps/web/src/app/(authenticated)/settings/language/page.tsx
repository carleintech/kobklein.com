"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import { useI18n, LOCALES, LOCALE_NAMES, type Locale } from "@/lib/i18n";

const FLAG: Record<Locale, string> = {
  en: "🇺🇸",
  fr: "🇫🇷",
  ht: "🇭🇹",
  es: "🇪🇸",
};

const NATIVE: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  ht: "Kreyòl Ayisyen",
  es: "Español",
};

export default function LanguagePage() {
  const router = useRouter();
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6 p-4 md:p-0">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-[#0D2018] hover:bg-[#122A1E] text-[#7A8394] hover:text-[#E0E4EE] transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-[#F0F1F5]">{t("settings.language")}</h1>
          <p className="text-xs text-[#5A6B82] mt-0.5">Choose your preferred language</p>
        </div>
      </motion.div>

      {/* Language options */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-col gap-2"
      >
        {LOCALES.map((loc) => (
          <button
            key={loc}
            type="button"
            onClick={() => setLocale(loc)}
            className="flex items-center gap-4 rounded-2xl p-4 border transition-all text-left"
            style={{
              background: locale === loc ? "rgba(201,168,76,0.08)" : "#091C14",
              borderColor: locale === loc ? "rgba(201,168,76,0.30)" : "rgba(255,255,255,0.06)",
            }}
          >
            <span className="text-3xl leading-none">{FLAG[loc]}</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-[#F0F1F5]">{NATIVE[loc]}</p>
              <p className="text-xs text-[#5A6B82] mt-0.5">{LOCALE_NAMES[loc]}</p>
            </div>
            {locale === loc && (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "rgba(201,168,76,0.20)", border: "1px solid rgba(201,168,76,0.40)" }}
              >
                <Check className="h-3.5 w-3.5 text-[#C9A84C]" />
              </div>
            )}
          </button>
        ))}
      </motion.div>

      {/* Note */}
      <p className="text-xs text-[#3A4558] text-center leading-relaxed">
        Language preference is saved to your browser and applies instantly.
      </p>
    </div>
  );
}
