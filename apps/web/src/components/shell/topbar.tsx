"use client";

import Link from "next/link";
import Image from "next/image";
import { useUser } from "@/context/user-context";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Bell } from "lucide-react";

export function Topbar({
  unreadCount  = 0,
  sidebarWidth = 240,
}: {
  unreadCount?: number;
  sidebarWidth?: number;
}) {
  const { user } = useUser();

  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-white/[0.05] bg-[#060D1F]/90 backdrop-blur-md
                 transition-[padding-left] duration-300 ease-in-out max-md:!pl-0"
      style={{ paddingLeft: sidebarWidth }}
    >
      <div className="flex items-center justify-between px-4 md:px-6 h-14">

        {/* Mobile: show logo (sidebar is hidden on mobile) */}
        <div className="md:hidden flex items-center">
          <Image
            src="/images/kobklein-logo.png"
            alt="KobKlein"
            width={110}
            height={28}
            className="object-contain max-h-7 w-auto"
            style={{ filter: "brightness(0) invert(1)" }}
            priority
            unoptimized
          />
        </div>

        {/* Desktop spacer */}
        <div className="hidden md:block" />

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          <LanguageSwitcher />

          {/* Bell with badge */}
          <Link
            href="/notifications"
            className="relative p-2 rounded-lg hover:bg-white/[0.04] transition-colors"
          >
            <Bell className="h-4 w-4 text-[#5A6478]" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[14px] h-[14px] px-0.5 rounded-full bg-[#C9A84C] text-[#060D1F] text-[8px] font-bold leading-none">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {/* Mobile avatar */}
          <div className="md:hidden">
            {user.picture ? (
              <img
                src={user.picture}
                alt=""
                className="w-7 h-7 rounded-full object-cover ring-1 ring-[#C9A84C]/20"
              />
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
