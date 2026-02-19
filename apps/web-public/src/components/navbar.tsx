"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeNames, locales, type Dictionary, type Locale } from "@/i18n";
import { Menu, X, Globe, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!langOpen) return;
    const close = () => setLangOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [langOpen]);

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
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "glass-nav"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 sm:h-16 lg:h-18 items-center justify-between">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="KobKlein"
              width={500}
              height={160}
              className="h-10 sm:h-12 md:h-14 lg:h-16 w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-7">
            {links.map((l) => {
              const isActive = pathname === l.href || pathname === l.href + "/";
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`relative text-sm font-medium transition-colors duration-200 group py-1 ${
                    isActive ? "text-kob-gold" : "text-kob-muted hover:text-kob-text"
                  }`}
                >
                  {l.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-gradient-to-r from-kob-teal via-kob-gold to-kob-teal rounded-full"
                    />
                  )}
                  <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-kob-gold/40 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-full" />
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Language Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLangOpen(!langOpen);
                }}
                aria-expanded={langOpen}
                aria-haspopup="listbox"
                aria-label="Select language"
                className="flex items-center gap-1.5 text-sm text-kob-muted hover:text-kob-text px-3 py-1.5 rounded-lg border border-white/6 hover:border-kob-gold/30 transition-all duration-200"
              >
                <Globe className="h-4 w-4" />
                {localeNames[locale]}
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${langOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    role="listbox"
                    aria-label="Language options"
                    className="absolute right-0 mt-2 w-44 rounded-xl border border-white/8 bg-kob-navy/95 backdrop-blur-xl shadow-2xl shadow-black/50 py-1.5 overflow-hidden"
                  >
                    {locales.map((l) => (
                      <Link
                        key={l}
                        href={`/${l}`}
                        onClick={() => setLangOpen(false)}
                        className={`block px-4 py-2.5 text-sm transition-all duration-200 ${
                          l === locale
                            ? "text-kob-gold font-medium bg-kob-gold/10"
                            : "text-kob-body hover:text-kob-text hover:bg-white/[0.04] hover:pl-5"
                        }`}
                      >
                        {localeNames[l]}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link
              href={`/${locale}/app`}
              className="btn-gold px-5 py-2 text-sm tracking-wide"
            >
              {dict.nav.download}
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="lg:hidden p-2 text-kob-muted hover:text-kob-gold transition-colors"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label="Toggle navigation menu"
            aria-controls="mobile-menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              id="mobile-menu"
              aria-label="Mobile navigation"
              className="lg:hidden overflow-hidden"
            >
              <nav className="border-t border-white/4 py-4 space-y-1">
                {links.map((l) => {
                  const isActive = pathname === l.href;
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className={`block px-3 py-2.5 text-sm font-medium transition-colors rounded-lg ${
                        isActive
                          ? "text-kob-gold bg-kob-gold/5"
                          : "text-kob-muted hover:text-kob-gold hover:bg-white/[0.02]"
                      }`}
                    >
                      {l.label}
                    </Link>
                  );
                })}

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
                        className={`px-3 py-1.5 text-xs rounded-full border transition-all duration-200 ${
                          l === locale
                            ? "bg-kob-gold text-kob-black border-kob-gold font-medium"
                            : "border-white/8 text-kob-muted hover:border-kob-gold/30"
                        }`}
                      >
                        {localeNames[l]}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="px-3 pt-3">
                  <Link
                    href={`/${locale}/app`}
                    onClick={() => setOpen(false)}
                    className="block text-center btn-gold px-4 py-2.5 text-sm"
                  >
                    {dict.nav.download}
                  </Link>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
