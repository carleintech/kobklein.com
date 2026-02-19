"use client";

import { useState, useCallback, useEffect } from "react";
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
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

// ─── Nav definition ───────────────────────────────────────────────────────────

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
};

const NAV_SECTIONS: { title?: string; items: NavItem[] }[] = [
  {
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Wallet",    href: "/wallet",    icon: Wallet },
    ],
  },
  {
    title: "Payments",
    items: [
      { label: "Send Money", href: "/send",             icon: Send },
      { label: "Pay",        href: "/pay",              icon: Receipt },
      { label: "Recurring",  href: "/recurring",        icon: Repeat },
      { label: "Requesting", href: "/recurring/create", icon: MessageSquarePlus },
    ],
  },
  {
    title: "Merchant",
    items: [
      { label: "Merchant Hub", href: "/merchant",          icon: Store,       roles: ["merchant"] },
      { label: "POS Terminal", href: "/merchant/pos",      icon: QrCode,      roles: ["merchant"] },
      { label: "QR Payments",  href: "/merchant/qr",       icon: QrCode,      roles: ["merchant"] },
      { label: "Withdraw",     href: "/merchant/withdraw", icon: ArrowDownUp, roles: ["merchant"] },
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

// ─── Tooltip wrapper for collapsed mode ──────────────────────────────────────

function NavTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="group relative flex">
      {children}
      <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50
                      opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap">
        <div className="bg-[#1A2540] border border-white/[0.08] text-[#E0E4EE] text-xs font-medium
                        px-2.5 py-1.5 rounded-lg shadow-xl">
          {label}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#1A2540]" />
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

export function Sidebar({
  unreadCount = 0,
  onCollapsedChange,
}: {
  unreadCount?: number;
  onCollapsedChange?: (collapsed: boolean) => void;
}) {
  const pathname = usePathname();
  const { user } = useUser();
  const router   = useRouter();
  const userRole = user.role || "client";
  const initials = (user.name || user.email || "U")[0].toUpperCase();

  const [collapsed, setCollapsed] = useState(false);

  const toggle = useCallback(() => {
    setCollapsed((c) => !c);
  }, []);

  // Notify parent after every collapsed change — safe, runs after render
  useEffect(() => {
    onCollapsedChange?.(collapsed);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapsed]);

  async function handleSignOut() {
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const W = collapsed ? "w-[64px]" : "w-[240px]";

  return (
    <aside
      className={`hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-30
                  bg-[#070E1F] border-r border-white/[0.05]
                  transition-[width] duration-300 ease-in-out overflow-hidden
                  ${W}`}
    >
      {/* ── Logo area ─────────────────────────────────────────────────────── */}
      <div
        className={`flex items-center border-b border-white/[0.05] shrink-0 h-16
                    ${collapsed ? "justify-center px-0" : "px-4"}`}
      >
        {collapsed ? (
          /* Collapsed: K icon only */
          <Image
            src="/images/logos/logo.png"
            alt="KobKlein"
            width={36}
            height={36}
            className="object-contain rounded-lg shrink-0"
            priority
            unoptimized
          />
        ) : (
          /* Expanded: full logo (gold+teal on transparent — shows on dark bg) */
          <div className="flex items-center gap-2.5 min-w-0">
            <Image
              src="/images/logos/logo.png"
              alt="KobKlein"
              width={32}
              height={32}
              className="object-contain rounded-lg shrink-0"
              priority
              unoptimized
            />
            <span
              className="text-sm font-bold text-[#F0F1F5] tracking-wide whitespace-nowrap"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              KobKlein
            </span>
          </div>
        )}
      </div>

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-1 scrollbar-none">
        {NAV_SECTIONS.map((section, sIdx) => {
          const visibleItems = section.items.filter(
            (item) => !item.roles || item.roles.includes(userRole)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={sIdx} className={collapsed ? "px-2" : "px-3"}>
              {/* Section title — hidden when collapsed */}
              {!collapsed && section.title && (
                <p className="text-[9px] uppercase tracking-[0.15em] text-[#2A3448] font-bold px-2 pt-3 pb-1.5">
                  {section.title}
                </p>
              )}
              {/* Divider line when collapsed and there's a title */}
              {collapsed && section.title && (
                <div className="border-t border-white/[0.04] my-2 mx-1" />
              )}

              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
                  const hasAlert = item.href === "/notifications" && unreadCount > 0;

                  const linkContent = (
                    <Link
                      href={item.href}
                      className={`
                        relative flex items-center rounded-lg transition-all duration-150
                        ${collapsed
                          ? "justify-center w-10 h-10 mx-auto"
                          : "gap-3 px-3 py-2 w-full"
                        }
                        ${isActive
                          ? collapsed
                            ? "bg-[#C9A84C]/15"
                            : "bg-[#C9A84C]/10 text-[#C9A84C] font-semibold border-l-2 border-[#C9A84C] -ml-px pl-[11px]"
                          : "text-[#4A5A72] hover:bg-white/[0.04] hover:text-[#B0BBCC]"
                        }
                      `}
                    >
                      {/* Icon */}
                      <div className="relative shrink-0">
                        <item.icon className={`h-[18px] w-[18px] ${isActive ? "text-[#C9A84C]" : ""}`} />
                        {/* Badge dot in collapsed mode */}
                        {hasAlert && collapsed && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#C9A84C] border border-[#070E1F]" />
                        )}
                      </div>

                      {/* Label — only in expanded mode */}
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-sm truncate">{item.label}</span>
                          {hasAlert && (
                            <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#C9A84C] text-[#060D1F] text-[10px] font-bold shrink-0">
                              {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  );

                  return (
                    <li key={item.href}>
                      {collapsed
                        ? <NavTooltip label={item.label}>{linkContent}</NavTooltip>
                        : linkContent
                      }
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* ── User footer ───────────────────────────────────────────────────── */}
      <div className="border-t border-white/[0.05] shrink-0">
        {/* User info row */}
        <div className={`flex items-center py-3 ${collapsed ? "justify-center px-2" : "px-4 gap-3"}`}>
          {/* Avatar */}
          <div className="shrink-0">
            {user.picture ? (
              <img
                src={user.picture}
                alt=""
                className="w-8 h-8 rounded-full object-cover ring-1 ring-[#C9A84C]/30"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C9A84C]/40 to-[#C9A84C]/10 flex items-center justify-center text-xs font-black text-[#C9A84C] ring-1 ring-[#C9A84C]/20">
                {initials}
              </div>
            )}
          </div>

          {/* Name + role — expanded only */}
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#E0E4EE] truncate">
                  {user.name || user.email || "User"}
                </p>
                <p className="text-[10px] text-[#2A3448] capitalize">{userRole}</p>
              </div>
              {/* Unread count badge */}
              {unreadCount > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full bg-[#C9A84C] text-[#060D1F] text-[10px] font-bold shrink-0">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
              {/* Sign out */}
              <button
                type="button"
                title="Sign out"
                onClick={handleSignOut}
                className="p-1.5 rounded-lg hover:bg-white/[0.04] text-[#2A3448] hover:text-[#7A8394] transition-colors shrink-0"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>

        {/* ── Collapse toggle button ─────────────────────────────────────── */}
        <button
          type="button"
          onClick={toggle}
          className={`
            w-full flex items-center py-2.5 border-t border-white/[0.04]
            text-[#2A3448] hover:text-[#C9A84C] hover:bg-white/[0.03]
            transition-all duration-150 group
            ${collapsed ? "justify-center px-2" : "gap-2 px-4"}
          `}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 group-hover:text-[#C9A84C] transition-colors" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 shrink-0 group-hover:text-[#C9A84C] transition-colors" />
              <span className="text-[11px] font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
