"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/user-context";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  Bell, Search, ChevronDown, LogOut,
  Settings, User, Shield,
} from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase";

// Role display config
const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  client:      { label: "Client",      color: "#C9A84C", bg: "rgba(201,168,76,0.12)" },
  merchant:    { label: "Merchant",    color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  distributor: { label: "K-Agent",     color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  diaspora:    { label: "Diaspora",    color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
  admin:       { label: "Admin",       color: "#EF4444", bg: "rgba(239,68,68,0.12)"  },
};

export function Topbar({
  unreadCount  = 0,
  sidebarWidth = 240,
}: {
  unreadCount?: number;
  sidebarWidth?: number;
}) {
  const { user }         = useUser();
  const router           = useRouter();
  const [search, setSearch] = useState("");
  const [dropOpen, setDropOpen] = useState(false);

  const role       = user.role || "client";
  const roleCfg    = ROLE_CONFIG[role] ?? ROLE_CONFIG.client;
  const displayName = user.name || user.email?.split("@")[0] || "User";
  const initials   = displayName.slice(0, 2).toUpperCase();

  async function handleSignOut() {
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) router.push(`/wallet?q=${encodeURIComponent(search.trim())}`);
  }

  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-white/[0.05]
                 bg-[#060D1F]/95 backdrop-blur-xl
                 transition-[padding-left] duration-300 ease-in-out
                 max-md:!pl-0"
      style={{ paddingLeft: sidebarWidth }}
    >
      <div className="flex items-center gap-3 px-4 md:px-5 h-14">

        {/* ── Mobile logo ──────────────────────────────────────────────── */}
        <div className="md:hidden flex items-center gap-2 shrink-0">
          <Image
            src="/images/logos/logo.png"
            alt="KobKlein"
            width={28}
            height={28}
            className="object-contain rounded-lg"
            priority
            unoptimized
          />
          <span
            className="text-sm font-bold text-[#F0F1F5] tracking-wide"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            KobKlein
          </span>
        </div>

        {/* ── Search bar ───────────────────────────────────────────────── */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 max-w-md items-center gap-2
                     bg-white/[0.04] border border-white/[0.07] rounded-xl
                     px-3 h-9 group focus-within:border-[#C9A84C]/40
                     focus-within:bg-white/[0.06] transition-all"
        >
          <Search className="h-3.5 w-3.5 text-[#3A4558] group-focus-within:text-[#C9A84C] transition-colors shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${role === "client" ? "transactions, contacts…" : role === "merchant" ? "payments, reports…" : "activity…"}`}
            className="flex-1 bg-transparent text-sm text-[#E0E4EE] placeholder-[#2A3448]
                       outline-none border-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-[#3A4558] hover:text-[#7A8394] text-xs"
            >
              ✕
            </button>
          )}
        </form>

        {/* ── Spacer pushes right section ─────────────────────────────── */}
        <div className="flex-1 md:flex-none" />

        {/* ── Right section ────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 md:gap-1.5">

          {/* Language switcher */}
          <div className="hidden md:flex">
            <LanguageSwitcher />
          </div>

          {/* Notification bell */}
          <Link
            href="/notifications"
            className="relative p-2 rounded-xl hover:bg-white/[0.05] transition-colors group"
          >
            <Bell className="h-[18px] w-[18px] text-[#4A5A72] group-hover:text-[#C9A84C] transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center
                               min-w-[16px] h-[16px] px-0.5 rounded-full
                               bg-[#C9A84C] text-[#060D1F] text-[8px] font-black leading-none
                               shadow-lg shadow-[#C9A84C]/30">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {/* ── User avatar + dropdown ────────────────────────────────── */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropOpen((v) => !v)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl
                         hover:bg-white/[0.05] transition-colors"
            >
              {/* Avatar */}
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-[#C9A84C]/30"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C9A84C]/50 to-[#9F7F2C]/30
                                flex items-center justify-center text-xs font-black text-[#C9A84C]
                                ring-2 ring-[#C9A84C]/20 shrink-0">
                  {initials}
                </div>
              )}

              {/* Name + role — hidden on small screens */}
              <div className="hidden md:flex flex-col items-start min-w-0">
                <span className="text-xs font-semibold text-[#E0E4EE] truncate max-w-[100px] leading-tight">
                  {displayName}
                </span>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-0.5"
                  style={{ color: roleCfg.color, background: roleCfg.bg }}
                >
                  {roleCfg.label}
                </span>
              </div>

              <ChevronDown
                className={`hidden md:block h-3 w-3 text-[#3A4558] transition-transform duration-200 ${dropOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown menu */}
            {dropOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-52 z-50
                                bg-[#0D1525] border border-white/[0.08] rounded-2xl
                                shadow-2xl shadow-black/50 overflow-hidden">
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-white/[0.06]">
                    <p className="text-xs font-bold text-[#F0F1F5] truncate">{displayName}</p>
                    <p className="text-[10px] text-[#3A4558] truncate">{user.email}</p>
                    <span
                      className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mt-1.5"
                      style={{ color: roleCfg.color, background: roleCfg.bg }}
                    >
                      {roleCfg.label}
                    </span>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    {[
                      { icon: User,     label: "My Profile",  href: "/settings/profile" },
                      { icon: Shield,   label: "Security",    href: "/settings/security" },
                      { icon: Settings, label: "Settings",    href: "/settings" },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setDropOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#7A8394]
                                   hover:bg-white/[0.04] hover:text-[#E0E4EE] transition-colors"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </Link>
                    ))}
                  </div>

                  {/* Sign out */}
                  <div className="border-t border-white/[0.06] py-1">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm
                                 text-red-400 hover:bg-red-500/[0.06] transition-colors"
                    >
                      <LogOut className="h-4 w-4 shrink-0" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
