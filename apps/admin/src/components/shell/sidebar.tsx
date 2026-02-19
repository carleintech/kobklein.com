"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
import { Separator } from "@/components/ui/separator";

type NavSection = { heading?: string; items: { label: string; href: string; icon: any }[] };

const sections: NavSection[] = [
  {
    items: [
      { label: "Overview", href: "/", icon: LayoutDashboard },
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
      { label: "Cases", href: "/compliance", icon: ShieldCheck },
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
    <aside
      className="hidden md:flex md:flex-col border-r border-white/5 bg-[#0A1628] fixed top-0 left-0 h-screen"
      style={{ width: "var(--sidebar-w)" }}
    >
      {/* Branding */}
      <div className="h-16 px-4 flex items-center gap-2.5 border-b border-white/5">
        <div className="w-7 h-7 rounded-lg bg-[#C9A84C] flex items-center justify-center text-xs font-bold text-[#060D1F]">
          K
        </div>
        <span className="font-semibold text-sm tracking-tight text-[#F0F1F5]">KobKlein</span>
        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-[#0F1D35] text-[#6B7489] border border-white/5">
          Admin
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {sections.map((section, si) => (
          <div key={si}>
            {section.heading && (
              <div className="px-3 pt-4 pb-1 text-[10px] font-semibold text-[#6B7489]/60 uppercase tracking-widest">
                {section.heading}
              </div>
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
                  className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-200 ${
                    isActive
                      ? "bg-[#C9A84C]/10 text-[#C9A84C] font-medium"
                      : "text-[#6B7489] hover:text-[#F0F1F5] hover:bg-white/3"
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-[#C9A84C]" />
                  )}
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/5">
        <Separator className="mb-3 bg-white/4" />
        <div className="text-[11px] text-[#6B7489] space-y-1">
          <div>Env: <span className="text-[#C9A84C]">Dev</span></div>
          <div className="truncate">API: {process.env.NEXT_PUBLIC_API_BASE_URL}</div>
        </div>
      </div>
    </aside>
  );
}
