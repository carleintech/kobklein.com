"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/user-context";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Bell, LogOut } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase";

export function Topbar() {
  const { user } = useUser();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.04] bg-[#060D1F]/90 backdrop-blur-md md:pl-[240px]">
      <div className="flex items-center justify-between px-4 md:px-6 h-14">
        {/* Mobile logo — hidden on desktop (sidebar has logo) */}
        <div className="md:hidden flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-[#C9A84C] flex items-center justify-center text-white text-sm font-bold leading-none">
            K
          </span>
          <span
            className="text-sm font-semibold text-[#F0F1F5] tracking-wide"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            KobKlein
          </span>
        </div>

        {/* Desktop: page context (spacer) */}
        <div className="hidden md:block" />

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />

          <Link
            href="/notifications"
            className="relative p-2 rounded-lg hover:bg-white/[0.04] transition-colors"
          >
            <Bell className="h-4 w-4 text-[#7A8394]" />
          </Link>

          <button
            onClick={handleSignOut}
            className="p-2 rounded-lg hover:bg-white/[0.04] transition-colors"
            title="Sign out"
            type="button"
          >
            <LogOut className="h-4 w-4 text-[#7A8394]" />
          </button>

          {/* Mobile avatar */}
          <div className="md:hidden">
            {user.picture ? (
              <img src={user.picture} alt="" className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#C9A84C]/20 flex items-center justify-center text-xs font-bold text-[#C9A84C]">
                {(user.name || user.email || "?")[0].toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
