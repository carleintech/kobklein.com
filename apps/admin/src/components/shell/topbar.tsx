"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0";
import { Bell, ChevronDown, LogOut, Plus, Search, Shield, TrendingUp } from "lucide-react";
import { kkGet } from "@/lib/kobklein-api";

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

type OverviewSnap = { platformBalance?: number };

function BalanceBadge() {
  const [balance, setBalance] = useState<number | null>(null);
  useEffect(() => {
    kkGet<OverviewSnap>("v1/admin/overview")
      .then((d) => setBalance(d?.platformBalance ?? null))
      .catch(() => null);
  }, []);
  if (balance === null) return null;
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-kob-gold/10 border border-kob-gold/20">
      <TrendingUp className="h-3.5 w-3.5 text-kob-gold" />
      <span className="text-xs font-semibold text-kob-gold">{fmt(balance)} HTG</span>
      <button type="button" title="Add float" className="h-4 w-4 rounded bg-kob-gold/20 flex items-center justify-center hover:bg-kob-gold/40 transition-colors">
        <Plus className="h-2.5 w-2.5 text-kob-gold" />
      </button>
    </div>
  );
}

export function Topbar() {
  const { user } = useUser();
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "AD";

  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  return (
    <header className="topbar-fixed bg-kob-black border-b border-white/5 flex items-center px-4 gap-3">
      {/* Logo — same width as sidebar */}
      <Link href="/" className="flex items-center gap-2.5 shrink-0" style={{ width: "var(--sidebar-w)" }}>
        <div className="w-7 h-7 rounded-lg bg-kob-gold flex items-center justify-center text-xs font-bold text-kob-black shrink-0">K</div>
        <span className="font-bold text-sm tracking-tight text-kob-text">KobKlein</span>
      </Link>

      {/* Search */}
      <div className="flex-1 max-w-xs">
        {searchOpen ? (
          <input
            ref={searchRef}
            onBlur={() => setSearchOpen(false)}
            placeholder="Search users, transactions…"
            className="w-full h-8 px-3 rounded-lg bg-kob-panel border border-white/10 text-sm text-kob-text placeholder:text-kob-muted outline-none"
          />
        ) : (
          <button type="button" onClick={openSearch} className="flex items-center gap-2 h-8 px-3 rounded-lg bg-kob-panel/60 border border-white/5 text-sm text-kob-muted hover:text-kob-body transition-colors w-full">
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline text-xs">Search…</span>
          </button>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2 ml-auto">
        <BalanceBadge />

        <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
          <Shield className="h-3 w-3 text-emerald-400" />
          <span className="text-[10px] font-medium text-emerald-400">System Secure</span>
        </div>

        <button type="button" title="Notifications" className="relative h-8 w-8 rounded-lg bg-kob-panel border border-white/5 flex items-center justify-center hover:border-white/15 transition-colors">
          <Bell className="h-3.5 w-3.5 text-kob-muted" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-kob-gold" />
        </button>

        <span className="hidden sm:inline-flex text-[10px] font-semibold px-2 py-0.5 rounded bg-kob-gold/10 text-kob-gold border border-kob-gold/20 tracking-wide">ADMIN</span>

        {/* User menu */}
        <div className="relative group">
          <button type="button" className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-white/5 transition-colors">
            <div className="h-7 w-7 rounded-full bg-linear-to-br from-kob-gold to-kob-gold-dark flex items-center justify-center text-[10px] font-bold text-kob-black">
              {initials}
            </div>
            <span className="hidden md:block text-xs text-kob-body max-w-22.5 truncate">{user?.name ?? "Admin"}</span>
            <ChevronDown className="h-3 w-3 text-kob-muted" />
          </button>
          <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-kob-panel border border-white/10 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
            <div className="p-3 border-b border-white/5">
              <p className="text-xs font-medium text-kob-text truncate">{user?.name ?? "Admin"}</p>
              <p className="text-[10px] text-kob-muted truncate mt-0.5">{user?.email ?? ""}</p>
            </div>
            <div className="p-1">
              <a href="/auth/logout" className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-kob-body hover:text-kob-text hover:bg-white/5 transition-colors">
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
