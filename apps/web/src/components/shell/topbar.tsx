"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/user-context";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Bell, LogOut } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase";

export function Topbar({ unreadCount = 0 }: { unreadCount?: number }) {
  const { user } = useUser();
  const router   = useRouter();

  async function handleSignOut() {
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.05] bg-[#060D1F]/90 backdrop-blur-md md:pl-[240px]">
      <div className="flex items-center justify-between px-4 md:px-6 h-14">

        {/* Mobile logo — hidden on desktop (sidebar has it) */}
        <div className="md:hidden flex items-center">
          <Image
            src="/images/kobklein-logo.png"
            alt="KobKlein"
            width={100}
            height={26}
            className="object-contain"
            priority
          />
        </div>

        {/* Desktop spacer */}
        <div className="hidden md:block" />

        {/* Right actions */}
        <div className="flex items-center gap-1">
          <LanguageSwitcher />

          {/* Notifications bell with badge */}
          <Link
            href="/notifications"
            className="relative p-2 rounded-lg hover:bg-white/[0.04] transition-colors"
          >
            <Bell className="h-4 w-4 text-[#7A8394]" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[14px] h-[14px] px-0.5 rounded-full bg-[#C9A84C] text-[#060D1F] text-[8px] font-bold leading-none">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
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
          <div className="md:hidden ml-1">
            {user.picture ? (
              <img src={user.picture} alt="" className="w-7 h-7 rounded-full object-cover ring-1 ring-[#C9A84C]/20" />
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
