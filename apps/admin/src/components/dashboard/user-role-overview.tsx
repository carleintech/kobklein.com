"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Props = {
  overview: Record<string, unknown> | null;
};

type RoleSegment = {
  label: string;
  key: string;
  color: string;
  barColor: string;
  href: string;
};

const SEGMENTS: RoleSegment[] = [
  { label: "Clients", key: "clients", color: "text-kob-gold", barColor: "bg-kob-gold", href: "/users?role=client" },
  { label: "Diaspora", key: "diaspora", color: "text-violet-400", barColor: "bg-violet-500", href: "/users?role=diaspora" },
  { label: "Merchants", key: "merchants", color: "text-sky-400", barColor: "bg-sky-500", href: "/users?role=merchant" },
  { label: "Distributors", key: "distributors", color: "text-emerald-400", barColor: "bg-emerald-500", href: "/distributors" },
];

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function UserRoleOverview({ overview }: Props) {
  const totalUsers = (overview?.growth as { totalUsers?: number })?.totalUsers ?? (overview?.totalUsers as number) ?? 0;
  const newToday = (overview?.growth as { newUsers?: { today?: number } })?.newUsers?.today ?? 0;
  const activeWallets = (overview?.activeUsers as number) ?? 0;
  const activeMerchants = (overview?.ops as { activeMerchants?: number })?.activeMerchants ?? 0;
  const activeDistributors = (overview?.activeAgents as number) ?? 0;

  // Approximate segment counts from available data
  const segments = SEGMENTS.map((seg) => {
    let count = 0;
    if (seg.key === "merchants") count = activeMerchants;
    else if (seg.key === "distributors") count = activeDistributors;
    else if (seg.key === "clients") count = Math.max(0, totalUsers - activeMerchants - activeDistributors);
    else if (seg.key === "diaspora") count = Math.round(totalUsers * 0.15); // estimated
    return { ...seg, count };
  });

  const maxCount = Math.max(...segments.map((s) => s.count), 1);

  return (
    <div className="rounded-2xl border border-white/8 bg-[#080E20] p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-kob-muted uppercase tracking-widest">Network Breakdown</p>
          <p className="text-lg font-bold text-kob-text mt-0.5">
            {fmt(totalUsers)} <span className="text-sm font-normal text-kob-muted">total users</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-kob-muted">Active Wallets</p>
          <p className="text-sm font-bold text-kob-gold">{fmt(activeWallets)}</p>
        </div>
      </div>

      {/* New users today */}
      {newToday > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-kob-gold/8 border border-kob-gold/15">
          <span className="h-1.5 w-1.5 rounded-full bg-kob-gold animate-pulse" />
          <span className="text-xs text-kob-gold font-medium">+{newToday} new users today</span>
        </div>
      )}

      {/* Role breakdown bars */}
      <div className="space-y-3">
        {segments.map((seg) => {
          const pct = maxCount > 0 ? (seg.count / maxCount) * 100 : 0;
          return (
            <Link key={seg.key} href={seg.href} className="group block">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-kob-muted group-hover:text-kob-text transition-colors">{seg.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-semibold tabular-nums ${seg.color}`}>{fmt(seg.count)}</span>
                  <ArrowRight className="h-3 w-3 text-kob-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${seg.barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Bottom stats row */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/6">
        <div className="rounded-lg bg-white/3 px-3 py-2.5">
          <p className="text-[10px] text-kob-muted mb-0.5">Pending KYC</p>
          <p className="text-sm font-bold text-kob-text">
            {fmt((overview?.ops as { pendingKyc?: number })?.pendingKyc ?? 0)}
          </p>
        </div>
        <div className="rounded-lg bg-white/3 px-3 py-2.5">
          <p className="text-[10px] text-kob-muted mb-0.5">Delinquent Subs</p>
          <p className="text-sm font-bold text-kob-text">
            {fmt((overview?.ops as { delinquentSubs?: number })?.delinquentSubs ?? 0)}
          </p>
        </div>
      </div>
    </div>
  );
}
