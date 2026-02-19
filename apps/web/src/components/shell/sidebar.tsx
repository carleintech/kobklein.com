"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/context/user-context";
import {
  LayoutDashboard,
  Wallet,
  Send,
  CreditCard,
  QrCode,
  Store,
  Users,
  Settings,
  Bell,
  Receipt,
  ArrowDownUp,
  Globe,
  ShieldCheck,
  Repeat,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[]; // if set, only shown for these roles
};

const NAV_SECTIONS: { title?: string; items: NavItem[] }[] = [
  {
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Wallet", href: "/wallet", icon: Wallet },
    ],
  },
  {
    title: "Payments",
    items: [
      { label: "Send Money", href: "/send", icon: Send },
      { label: "Pay", href: "/pay", icon: Receipt },
      { label: "Recurring", href: "/recurring", icon: Repeat },
      { label: "K-Card", href: "/card", icon: CreditCard },
    ],
  },
  {
    title: "Merchant",
    items: [
      { label: "Merchant Hub", href: "/merchant", icon: Store, roles: ["merchant"] },
      { label: "POS Terminal", href: "/merchant/pos", icon: QrCode, roles: ["merchant"] },
      { label: "QR Payments", href: "/merchant/qr", icon: QrCode, roles: ["merchant"] },
      { label: "Withdraw", href: "/merchant/withdraw", icon: ArrowDownUp, roles: ["merchant"] },
    ],
  },
  {
    title: "Agent",
    items: [
      { label: "Cash In", href: "/distributor/cash-in", icon: ArrowDownUp, roles: ["distributor"] },
      { label: "Cash Out", href: "/distributor/cash-out", icon: ArrowDownUp, roles: ["distributor"] },
      { label: "Transfer", href: "/distributor/transfer", icon: Send, roles: ["distributor"] },
    ],
  },
  {
    title: "Diaspora",
    items: [
      { label: "International", href: "/send", icon: Globe, roles: ["diaspora"] },
    ],
  },
  {
    title: "More",
    items: [
      { label: "Notifications", href: "/notifications", icon: Bell },
      { label: "Verify Identity", href: "/verify", icon: ShieldCheck },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const userRole = user.role || "client";

  return (
    <aside className="hidden md:flex flex-col w-[240px] fixed left-0 top-0 bottom-0 bg-[#0A1223] border-r border-white/[0.04] z-30">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/[0.04]">
        <span className="w-8 h-8 rounded-lg bg-[#C9A84C] flex items-center justify-center text-white text-sm font-bold leading-none">
          K
        </span>
        <span
          className="text-sm font-semibold text-[#F0F1F5] tracking-wide"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          KobKlein
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {NAV_SECTIONS.map((section, sIdx) => {
          const visibleItems = section.items.filter(
            (item) => !item.roles || item.roles.includes(userRole)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={sIdx}>
              {section.title && (
                <p className="text-[10px] uppercase tracking-widest text-[#4A5568] font-medium px-2 mb-2">
                  {section.title}
                </p>
              )}
              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                          isActive
                            ? "bg-[#C9A84C]/10 text-[#C9A84C] font-medium border-l-[3px] border-[#C9A84C] -ml-px"
                            : "text-[#7A8394] hover:bg-white/[0.03] hover:text-[#B8BCC8]"
                        }`}
                      >
                        <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-[#C9A84C]" : ""}`} />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* User profile footer */}
      <div className="border-t border-white/[0.04] px-4 py-3">
        <div className="flex items-center gap-3">
          {user.picture ? (
            <img
              src={user.picture}
              alt=""
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#C9A84C]/20 flex items-center justify-center text-xs font-bold text-[#C9A84C]">
              {(user.name || user.email || "?")[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[#F0F1F5] truncate">
              {user.name || user.email || "User"}
            </p>
            <p className="text-[10px] text-[#4A5568] capitalize">{userRole}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
