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
      color: "#D4AF37",
      bg: "rgba(212,175,55,0.10)",
      border: "rgba(212,175,55,0.18)",
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
      color: "#16C784",
      bg: "rgba(22,199,132,0.10)",
      border: "rgba(22,199,132,0.18)",
    },
  ];

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6 p-4 md:p-0">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[#F0F1F5] [font-family:var(--font-playfair)]">
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
            className="flex items-center gap-4 rounded-2xl p-4 transition-all group hover:-translate-y-0.5 hover:bg-[#2A1050]"
            style={{ background: "var(--dash-shell-bg, #1C0A35)", border: "1px solid var(--dash-shell-border, rgba(165,150,201,0.22))" }}
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
        className="flex items-center gap-4 rounded-2xl p-4 transition-all group hover:-translate-y-0.5 hover:bg-[#2A1050]"
        style={{ background: "var(--dash-shell-bg, #1C0A35)", border: "1px solid var(--dash-shell-border, rgba(165,150,201,0.22))" }}
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(165,150,201,0.10)", border: "1px solid rgba(165,150,201,0.18)" }}
        >
          <svg className="h-5 w-5" style={{ color: "#A596C9" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
      <div className="rounded-2xl p-4 flex items-center justify-between" style={{ background: "var(--dash-shell-bg, #1C0A35)", border: "1px solid rgba(165,150,201,0.12)" }}>
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
