"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Send,
  QrCode,
  CreditCard,
  MoreHorizontal,
} from "lucide-react";

const TABS = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Send", href: "/send", icon: Send },
  { label: "Scan", href: "/pay", icon: QrCode },
  { label: "Card", href: "/card", icon: CreditCard },
  { label: "More", href: "/settings", icon: MoreHorizontal },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.04] bg-[#060D1F]/95 backdrop-blur-md safe-area-pb">
      <div className="flex justify-around items-center h-14">
        {TABS.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== "/dashboard" && pathname.startsWith(tab.href + "/"));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                isActive ? "text-[#C9A84C]" : "text-[#4A5568]"
              }`}
            >
              <tab.icon className={`h-5 w-5 ${isActive ? "text-[#C9A84C]" : ""}`} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
