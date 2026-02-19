"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useUser } from "@/context/user-context";
import {
  LayoutDashboard,
  Wallet,
  Send,
  Receipt,
  Repeat,
  MessageSquarePlus,
  Bell,
  ShieldCheck,
  Settings,
  Store,
  QrCode,
  ArrowDownUp,
  Globe,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
};

const NAV_SECTIONS: { title?: string; items: NavItem[] }[] = [
  {
    items: [
      { label: "Dashboard",  href: "/dashboard",     icon: LayoutDashboard },
      { label: "Wallet",     href: "/wallet",         icon: Wallet },
    ],
  },
  {
    title: "Payments",
    items: [
      { label: "Send Money",  href: "/send",      icon: Send },
      { label: "Pay",         href: "/pay",       icon: Receipt },
      { label: "Recurring",   href: "/recurring", icon: Repeat },
      { label: "Requesting",  href: "/recurring/create", icon: MessageSquarePlus },
    ],
  },
  {
    title: "Merchant",
    items: [
      { label: "Merchant Hub",   href: "/merchant",         icon: Store,       roles: ["merchant"] },
      { label: "POS Terminal",   href: "/merchant/pos",     icon: QrCode,      roles: ["merchant"] },
      { label: "QR Payments",    href: "/merchant/qr",      icon: QrCode,      roles: ["merchant"] },
      { label: "Withdraw",       href: "/merchant/withdraw",icon: ArrowDownUp, roles: ["merchant"] },
    ],
  },
  {
    title: "Agent",
    items: [
      { label: "Cash In",  href: "/distributor/cash-in",   icon: ArrowDownUp, roles: ["distributor"] },
      { label: "Cash Out", href: "/distributor/cash-out",  icon: ArrowDownUp, roles: ["distributor"] },
      { label: "Transfer", href: "/distributor/transfer",  icon: Send,        roles: ["distributor"] },
    ],
  },
  {
    title: "Diaspora",
    items: [
      { label: "International", href: "/send", icon: Globe, roles: ["diaspora"] },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Notifications",   href: "/notifications", icon: Bell },
      { label: "Verify Identity", href: "/verify",        icon: ShieldCheck },
      { label: "Settings",        href: "/settings",      icon: Settings },
    ],
  },
];

export function Sidebar({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname  = usePathname();
  const { user }  = useUser();
  const userRole  = user.role || "client";
  const initials  = (user.name || user.email || "U")[0].toUpperCase();

  return (
    <aside className="hidden md:flex flex-col w-[240px] fixed left-0 top-0 bottom-0 bg-[#070E1F] border-r border-white/[0.05] z-30">

      {/* ── Logo ── */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/[0.05] shrink-0">
        <Image
          src="/images/kobklein-logo.png"
          alt="KobKlein"
          width={120}
          height={32}
          className="object-contain"
          priority
        />
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 scrollbar-thin">
        {NAV_SECTIONS.map((section, sIdx) => {
          const visibleItems = section.items.filter(
            (item) => !item.roles || item.roles.includes(userRole)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={sIdx}>
              {section.title && (
                <p className="text-[10px] uppercase tracking-widest text-[#3A4558] font-semibold px-2 mb-2">
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
                        className={`
                          relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150
                          ${isActive
                            ? "bg-[#C9A84C]/10 text-[#C9A84C] font-semibold border-l-2 border-[#C9A84C] -ml-px pl-[13px]"
                            : "text-[#5A6478] hover:bg-white/[0.03] hover:text-[#A8B0C0]"
                          }
                        `}
                      >
                        <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-[#C9A84C]" : ""}`} />
                        <span className="flex-1">{item.label}</span>

                        {/* Notification badge on Notifications item */}
                        {item.href === "/notifications" && unreadCount > 0 && (
                          <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#C9A84C] text-[#060D1F] text-[10px] font-bold">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* ── User footer ── */}
      <div className="border-t border-white/[0.05] px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          {user.picture ? (
            <img
              src={user.picture}
              alt=""
              className="w-8 h-8 rounded-full object-cover ring-1 ring-[#C9A84C]/30"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C9A84C]/30 to-[#C9A84C]/10 flex items-center justify-center text-xs font-bold text-[#C9A84C] ring-1 ring-[#C9A84C]/20">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#F0F1F5] truncate">
              {user.name || user.email || "User"}
            </p>
            <p className="text-[10px] text-[#3A4558] capitalize">{userRole}</p>
          </div>
          {/* Alert dot */}
          {unreadCount > 0 && (
            <span className="flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full bg-[#C9A84C] text-[#060D1F] text-[10px] font-bold shrink-0">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
