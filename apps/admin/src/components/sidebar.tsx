"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Activity,
  Users,
  ShieldAlert,
  FileText,
  Landmark,
  Settings,
  BarChart3,
  FileCheck,
} from "lucide-react";

const nav = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Operations", href: "/operations", icon: Activity },
  { label: "Agents", href: "/agents", icon: Users },
  { label: "Risk", href: "/risk", icon: ShieldAlert },
  { label: "Cases", href: "/cases", icon: FileText },
  { label: "Audit", href: "/audit", icon: FileCheck },
  { label: "Settlements", href: "/settlements", icon: Landmark },
  { label: "System", href: "/system", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed top-0 left-0 h-screen flex flex-col border-r border-[var(--border)] bg-[var(--bg)]"
      style={{ width: "var(--sidebar-w)" }}>
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 h-14 border-b border-[var(--border)]">
        <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center text-xs font-bold text-white">
          K
        </div>
        <span className="font-semibold text-sm tracking-tight">KobKlein</span>
        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border)]">
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
        {nav.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-[var(--accent)] text-white font-medium"
                  : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elevated)]",
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[var(--border)] text-[11px] text-[var(--text-muted)]">
        KobKlein v1.0
      </div>
    </aside>
  );
}
