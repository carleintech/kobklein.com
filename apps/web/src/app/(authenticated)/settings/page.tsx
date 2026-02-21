"use client";

import Link from "next/link";
import { User, Shield, ChevronRight, ShieldCheck, Crown, Fingerprint } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function SettingsPage() {
  const { t } = useI18n();

  const sections = [
    {
      href: "/settings/profile",
      icon: User,
      title: t("settings.profile"),
      description: t("kyc.tier1"),
      color: "#3B82F6",
      bg: "rgba(59,130,246,0.10)",
      border: "rgba(59,130,246,0.18)",
    },
    {
      href: "/settings/security",
      icon: Shield,
      title: t("settings.security"),
      description: t("security.lockAccount"),
      color: "#EF4444",
      bg: "rgba(239,68,68,0.10)",
      border: "rgba(239,68,68,0.18)",
    },
    {
      href: "/settings/plan",
      icon: Crown,
      title: t("settings.plan"),
      description: t("kyc.tier2"),
      color: "#C9A84C",
      bg: "rgba(201,168,76,0.10)",
      border: "rgba(201,168,76,0.18)",
    },
    {
      href: "/verify",
      icon: ShieldCheck,
      title: t("settings.kyc"),
      description: t("kyc.startVerification"),
      color: "#10B981",
      bg: "rgba(16,185,129,0.10)",
      border: "rgba(16,185,129,0.18)",
    },
  ];

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6 p-4 md:p-0">

      {/* Header */}
      <div>
        <h1
          className="text-2xl font-black text-[#F0F1F5]"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {t("settings.title")}
        </h1>
        <p className="text-sm text-[#5A6B82] mt-1">{t("settings.about")}</p>
      </div>

      {/* Nav cards */}
      <div className="flex flex-col gap-3">
        {sections.map(({ href, icon: Icon, title, description, color, bg, border }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 rounded-2xl p-4 border border-white/[0.06] bg-[#0E1829]
                       transition-all group hover:-translate-y-0.5 hover:bg-[#111D33] hover:border-white/[0.12]"
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: bg, border: `1px solid ${border}` }}
            >
              <Icon className="h-5 w-5" style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#F0F1F5]">{title}</p>
              <p className="text-xs text-[#5A6B82] mt-0.5">{description}</p>
            </div>
            <ChevronRight
              className="h-4 w-4 text-[#3A4558] group-hover:text-[#C9A84C] transition-colors shrink-0"
            />
          </Link>
        ))}
      </div>

      {/* Language row */}
      <Link
        href="/settings/language"
        className="flex items-center gap-4 rounded-2xl p-4 border border-white/[0.06] bg-[#0E1829]
                   transition-all group hover:-translate-y-0.5 hover:bg-[#111D33] hover:border-white/[0.12]"
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(13,158,138,0.10)", border: "1px solid rgba(13,158,138,0.18)" }}
        >
          <svg className="h-5 w-5" style={{ color: "#0D9E8A" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#F0F1F5]">{t("settings.language")}</p>
          <p className="text-xs text-[#5A6B82] mt-0.5">English · Français · Kreyòl · Español</p>
        </div>
        <ChevronRight
          className="h-4 w-4 text-[#3A4558] group-hover:text-[#C9A84C] transition-colors shrink-0"
        />
      </Link>

      {/* App info */}
      <div className="rounded-2xl bg-[#0A1422] border border-white/[0.04] p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-[#3A4558] uppercase tracking-wider">{t("common.appName")}</p>
          <p className="text-[10px] text-[#2A3448] mt-0.5">{t("settings.version", { version: "1.0.0" })} · All rights reserved</p>
        </div>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.15)" }}
        >
          <Fingerprint className="h-4 w-4 text-[#C9A84C]/50" />
        </div>
      </div>
    </div>
  );
}
