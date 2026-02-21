"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRightLeft,
  Building2,
  ClipboardCheck,
  FileText,
  Landmark,
  LayoutDashboard,
  MessageSquare,
  Package,
  Receipt,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Store,
  UserCheck,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";

type NavItem = { label: string; href: string; icon: LucideIcon };
type NavSection = { heading?: string; items: NavItem[] };

const sections: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Risk", href: "/risk", icon: ShieldAlert },
      { label: "Review Queue", href: "/review", icon: ClipboardCheck },
      { label: "Cases", href: "/cases", icon: FileText },
    ],
  },
  {
    heading: "Finance",
    items: [
      { label: "Treasury", href: "/treasury", icon: Wallet },
      { label: "FX Control", href: "/fx", icon: ArrowRightLeft },
      { label: "POS Analytics", href: "/pos", icon: Receipt },
    ],
  },
  {
    heading: "Configure",
    items: [
      { label: "Limits", href: "/limits", icon: Shield },
      { label: "Merchant Fees", href: "/merchant-fees", icon: Store },
      { label: "K-Pay Catalog", href: "/kpay", icon: Package },
    ],
  },
  {
    heading: "Compliance",
    items: [
      { label: "Compliance", href: "/compliance", icon: ShieldCheck },
      { label: "KYC Review", href: "/compliance/kyc", icon: UserCheck },
    ],
  },
  {
    heading: "Network",
    items: [
      { label: "Users", href: "/users", icon: UserCog },
      { label: "Agents", href: "/agents", icon: Users },
      { label: "Distributors", href: "/distributors", icon: Building2 },
      { label: "Notifications", href: "/notifications", icon: MessageSquare },
      { label: "Audit Trail", href: "/audit", icon: FileText },
    ],
  },
  {
    heading: "More",
    items: [
      { label: "Analytics", href: "/analytics", icon: Activity },
      { label: "Settlements", href: "/settlements", icon: Landmark },
      { label: "System", href: "/system", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col border-r border-white/5 bg-[#0A1628] sidebar-fixed overflow-y-auto">
      <nav className="flex-1 p-2 space-y-0.5">
        {sections.map((section) => (
          <div key={section.heading ?? "__root"}>
            {section.heading && (
              <p className="px-3 pt-4 pb-1 text-[10px] font-semibold text-kob-muted/60 uppercase tracking-widest">
                {section.heading}
              </p>
            )}
            {section.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150 ${
                    isActive
                      ? "bg-kob-gold/10 text-kob-gold font-medium"
                      : "text-kob-muted hover:text-kob-text hover:bg-white/4"
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-0.75 rounded-full bg-kob-gold" />
                  )}
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/5 space-y-0.5">
        <p className="text-[11px] text-kob-muted">
          Env: <span className="text-kob-gold">Dev</span>
        </p>
        <p className="text-[11px] text-kob-muted truncate">
          {process.env.NEXT_PUBLIC_API_BASE_URL}
        </p>
      </div>
    </aside>
  );
}
