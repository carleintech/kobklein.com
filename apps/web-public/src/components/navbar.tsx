"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { localeNames, locales, type Dictionary, type Locale } from "@/i18n";
import { Menu, X, Globe, ChevronDown } from "lucide-react";

export function Navbar({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const links = [
    { href: `/${locale}`, label: dict.nav.home },
    { href: `/${locale}/about`, label: dict.nav.about },
    { href: `/${locale}/how-it-works`, label: dict.nav.howItWorks },
    { href: `/${locale}/card`, label: dict.nav.kcard },
    { href: `/${locale}/diaspora`, label: "Diaspora" },
    { href: `/${locale}/compliance`, label: dict.nav.compliance },
    { href: `/${locale}/distributor`, label: dict.nav.distributor },
  ];

  return (
    <header className="sticky top-0 z-50 bg-kob-black/80 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2.5 overflow-hidden">
            <Image
              src="/logo.png"
              alt="KobKlein"
              width={360}
              height={100}
              className="h-28 w-auto object-contain scale-125"
              priority
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-kob-muted hover:text-kob-gold transition-colors duration-200"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 text-sm text-kob-muted hover:text-kob-text px-3 py-1.5 rounded-lg border border-white/6 hover:border-kob-gold/30 transition-all duration-200"
              >
                <Globe className="h-4 w-4" />
                {localeNames[locale]}
                <ChevronDown className="h-3 w-3" />
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-xl border border-white/6 bg-kob-navy shadow-2xl shadow-black/50 py-1">
                  {locales.map((l) => (
                    <Link
                      key={l}
                      href={`/${l}`}
                      onClick={() => setLangOpen(false)}
                      className={`block px-4 py-2.5 text-sm transition-colors duration-200 ${l === locale ? "text-kob-gold font-medium" : "text-kob-body hover:text-kob-text hover:bg-white/3"}`}
                    >
                      {localeNames[l]}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="#download"
              className="bg-kob-gold text-kob-black rounded-xl px-5 py-2 text-sm font-medium hover:bg-kob-goldLight transition duration-200"
            >
              {dict.nav.download}
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden p-2 text-kob-muted hover:text-kob-gold transition-colors"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-white/4 py-4 space-y-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium text-kob-muted hover:text-kob-gold transition-colors"
              >
                {l.label}
              </Link>
            ))}

            {/* Mobile language links */}
            <div className="border-t border-white/4 pt-4 mt-3 px-3">
              <div className="text-xs text-kob-muted mb-3 uppercase tracking-widest flex items-center gap-1.5">
                <Globe className="h-3 w-3" /> Language
              </div>
              <div className="flex gap-2">
                {locales.map((l) => (
                  <Link
                    key={l}
                    href={`/${l}`}
                    onClick={() => setOpen(false)}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-all duration-200 ${l === locale ? "bg-kob-gold text-kob-black border-kob-gold font-medium" : "border-white/8 text-kob-muted hover:border-kob-gold/30"}`}
                  >
                    {localeNames[l]}
                  </Link>
                ))}
              </div>
            </div>

            <div className="px-3 pt-3">
              <Link
                href="#download"
                onClick={() => setOpen(false)}
                className="block text-center bg-kob-gold text-kob-black rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-kob-goldLight transition duration-200"
              >
                {dict.nav.download}
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
