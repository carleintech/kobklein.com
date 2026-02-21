"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Send,
  QrCode,
  Bell,
  MoreHorizontal,
} from "lucide-react";

const TABS = [
  { label: "Home",       href: "/dashboard",       icon: LayoutDashboard },
  { label: "Send",       href: "/send",             icon: Send },
  { label: "Scan",       href: "/pay",              icon: QrCode },
  { label: "Alerts",     href: "/notifications",    icon: Bell },
  { label: "More",       href: "/settings",         icon: MoreHorizontal },
];

export function MobileNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[#0D9E8A]/[0.20] safe-area-pb"
         style={{ background: "rgba(5,15,12,0.96)", backdropFilter: "blur(12px)" }}>
      <div className="flex justify-around items-center h-14">
        {TABS.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== "/dashboard" && pathname.startsWith(tab.href + "/"));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                isActive ? "text-[#C9A84C]" : "text-[#3A4558]"
              }`}
            >
              <tab.icon className={`h-5 w-5 ${isActive ? "text-[#C9A84C]" : ""}`} />

              {/* Notification badge on Alerts tab */}
              {tab.href === "/notifications" && unreadCount > 0 && (
                <span className="absolute -top-0.5 left-1/2 translate-x-1 flex items-center justify-center min-w-[14px] h-[14px] px-0.5 rounded-full bg-[#C9A84C] text-[#060D1F] text-[8px] font-bold leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}

              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
