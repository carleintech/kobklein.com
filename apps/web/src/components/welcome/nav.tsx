"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

export function WelcomeNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-[#060D1F]/80 backdrop-blur-xl border-b border-white/[0.06] shadow-2xl shadow-black/30"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16 lg:h-20">
          <Link href="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ scale: 1.18, rotate: 2 }}
              transition={{ scale: { type: "spring", stiffness: 300, damping: 18 }, rotate: { type: "spring", stiffness: 300, damping: 18 } }}
              className="inline-block"
            >
              <Image
                src="/images/kobklein-logo.png"
                alt="KobKlein"
                width={260}
                height={90}
                className="h-24 w-auto transition-transform duration-300"
                priority
              />
            </motion.div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { label: "Features", href: "#features" },
              { label: "How It Works", href: "#how-it-works" },
              { label: "Security", href: "#security" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm text-[#B8BCC8] hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/[0.04]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2.5 text-sm font-medium text-[#B8BCC8] hover:text-white transition-colors duration-200"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="group relative px-6 py-2.5 rounded-xl text-sm font-semibold text-[#060D1F] overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#C9A84C]/25"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#C9A84C] to-[#E2CA6E]" />
              <span className="absolute inset-0 bg-gradient-to-r from-[#E2CA6E] to-[#C9A84C] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative">Get Started</span>
            </Link>
          </div>

          {/* Mobile Menu */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-[#B8BCC8] hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </motion.header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 bg-[#060D1F]/95 backdrop-blur-2xl border-b border-white/[0.06] md:hidden"
          >
            <div className="flex flex-col p-6 gap-2">
              {[
                { label: "Features", href: "#features" },
                { label: "How It Works", href: "#how-it-works" },
                { label: "Security", href: "#security" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 text-[#B8BCC8] hover:text-white text-base rounded-lg hover:bg-white/[0.04] transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <hr className="border-white/[0.06] my-2" />
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 text-[#B8BCC8] hover:text-white text-base rounded-lg hover:bg-white/[0.04] transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileOpen(false)}
                className="mt-2 text-center py-3 rounded-xl text-sm font-semibold text-[#060D1F] bg-gradient-to-r from-[#C9A84C] to-[#E2CA6E]"
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
