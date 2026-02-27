"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  BookOpen,
  Building2,
  ClipboardCheck,
  FileText,
  Globe,
  HeadphonesIcon,
  Landmark,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Package,
  Receipt,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Store,
  TrendingUp,
  UserCheck,
  UserCog,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { canAccess, ROLE_LABELS, type AdminRole } from "@/lib/admin-role";
import { useAdminRole } from "@/lib/admin-role-context";

type NavItem = { label: string; href: string; icon: LucideIcon };
type NavSection = { heading?: string; items: NavItem[] };

// Tailwind arbitrary-value classes per role (avoids inline styles)
const ROLE_BADGE_CLASS: Record<AdminRole, string> = {
  super_admin:        "bg-[rgba(201,168,76,0.15)]  text-[#C9A84C]  border border-[rgba(201,168,76,0.30)]",
  admin:              "bg-[rgba(201,168,76,0.10)]  text-[#C9A84C]  border border-[rgba(201,168,76,0.20)]",
  regional_manager:   "bg-[rgba(59,130,246,0.12)]  text-[#60A5FA]  border border-[rgba(59,130,246,0.25)]",
  support_agent:      "bg-[rgba(139,92,246,0.12)]  text-[#A78BFA]  border border-[rgba(139,92,246,0.25)]",
  compliance_officer: "bg-[rgba(239,68,68,0.12)]   text-[#F87171]  border border-[rgba(239,68,68,0.25)]",
  treasury_officer:   "bg-[rgba(34,197,94,0.12)]   text-[#4ADE80]  border border-[rgba(34,197,94,0.25)]",
  hr_manager:         "bg-[rgba(251,191,36,0.12)]  text-[#FBB724]  border border-[rgba(251,191,36,0.25)]",
  investor:           "bg-[rgba(52,211,153,0.12)]  text-[#34D399]  border border-[rgba(52,211,153,0.25)]",
  auditor:            "bg-[rgba(249,115,22,0.12)]  text-[#FB923C]  border border-[rgba(249,115,22,0.25)]",
  broadcaster:        "bg-[rgba(168,85,247,0.12)]  text-[#C084FC]  border border-[rgba(168,85,247,0.25)]",
};

const ROLE_DOT_CLASS: Record<AdminRole, string> = {
  super_admin:        "bg-[#C9A84C]",
  admin:              "bg-[#C9A84C]",
  regional_manager:   "bg-[#60A5FA]",
  support_agent:      "bg-[#A78BFA]",
  compliance_officer: "bg-[#F87171]",
  treasury_officer:   "bg-[#4ADE80]",
  hr_manager:         "bg-[#FBB724]",
  investor:           "bg-[#34D399]",
  auditor:            "bg-[#FB923C]",
  broadcaster:        "bg-[#C084FC]",
};

const sections: NavSection[] = [
  {
    // Root — visible to almost all roles
    items: [
      { label: "Dashboard",    href: "/",       icon: LayoutDashboard },
      { label: "Risk",         href: "/risk",   icon: ShieldAlert },
      { label: "Review Queue", href: "/review", icon: ClipboardCheck },
      { label: "Cases",        href: "/cases",  icon: FileText },
    ],
  },
  {
    heading: "Governance",
    items: [
      // super_admin only — controlled by canAccess ACL
      { label: "Emergency Controls", href: "/emergency", icon: Zap },
      { label: "System Config",      href: "/system",    icon: Settings },
    ],
  },
  {
    heading: "Finance",
    items: [
      { label: "Treasury",      href: "/treasury",      icon: Wallet },
      { label: "FX Control",    href: "/fx",            icon: ArrowRightLeft },
      { label: "Settlements",   href: "/settlements",   icon: Landmark },
      { label: "Float",         href: "/float",         icon: Wallet },
      { label: "Merchant Fees", href: "/merchant-fees", icon: Store },
      { label: "Limits",        href: "/limits",        icon: Shield },
      { label: "POS Analytics", href: "/pos",           icon: Receipt },
    ],
  },
  {
    heading: "Compliance",
    items: [
      { label: "Compliance",    href: "/compliance",     icon: ShieldCheck },
      { label: "KYC Review",    href: "/compliance/kyc", icon: UserCheck },
      { label: "Audit Trail",   href: "/audit",          icon: FileText },
    ],
  },
  {
    heading: "Network",
    items: [
      { label: "Users",         href: "/users",         icon: UserCog },
      { label: "Clients",       href: "/clients",       icon: Users },
      { label: "Diaspora",      href: "/diaspora",      icon: Globe },
      { label: "Agents",        href: "/agents",        icon: Building2 },
      { label: "Distributors",  href: "/distributors",  icon: Building2 },
      { label: "Merchants",     href: "/merchants",     icon: Store },
      { label: "Support",       href: "/support",       icon: HeadphonesIcon },
    ],
  },
  {
    heading: "Operations",
    items: [
      { label: "Notifications", href: "/notifications", icon: MessageSquare },
      { label: "K-Pay Catalog", href: "/kpay",          icon: Package },
      { label: "Operations",    href: "/operations",    icon: Activity },
    ],
  },
  {
    heading: "People",
    items: [
      { label: "HR & Staff",   href: "/hr",       icon: AlertTriangle },
      { label: "Training Hub", href: "/training", icon: BookOpen },
    ],
  },
  {
    heading: "Insights",
    items: [
      { label: "Analytics",    href: "/analytics", icon: Activity },
      { label: "Investor View", href: "/investor",  icon: TrendingUp },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const role = useAdminRole();

  return (
    <aside className="hidden md:flex md:flex-col border-r border-white/5 bg-[#0A1628] sidebar-fixed overflow-y-auto">
      <nav className="flex-1 p-2 space-y-0.5">
        {sections.map((section) => {
          const visibleItems = section.items.filter((item) =>
            canAccess(role, item.href),
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.heading ?? "__root"}>
              {section.heading && (
                <p className="px-3 pt-4 pb-1 text-[10px] font-semibold text-kob-muted/60 uppercase tracking-widest">
                  {section.heading}
                </p>
              )}
              {visibleItems.map((item) => {
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
          );
        })}
      </nav>

      {/* Footer — role badge + env */}
      <div className="p-3 border-t border-white/5 space-y-2">
        <div
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold ${ROLE_BADGE_CLASS[role]}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${ROLE_DOT_CLASS[role]}`} />
          {ROLE_LABELS[role]}
        </div>
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
