"use client";

import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, CheckCircle, RefreshCw, Repeat } from "lucide-react";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}
function fmtUsd(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n / 376.62);
}

type Props = { overview: Record<string, unknown> | null };

const actions = [
  { label: "Cash In", icon: ArrowDownLeft, href: "/float/refill", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { label: "Cash Out", icon: ArrowUpRight, href: "/operations", color: "text-red-400 bg-red-500/10 border-red-500/20" },
  { label: "Transfer Float", icon: Repeat, href: "/treasury", color: "text-kob-gold bg-kob-gold/10 border-kob-gold/20" },
];

export function LiveSystemOverview({ overview }: Props) {
  const balance = (overview?.platformBalance as number) ?? 0;
  const todayVolume = (overview?.todayVolume as number) ?? 0;
  const cashIn = (overview?.todayCashIn as number) ?? 0;
  const cashOut = (overview?.todayCashOut as number) ?? 0;
  const activeUsers = (overview?.activeUsers as number) ?? 0;
  const merchants = (overview?.ops as Record<string, number>)?.activeMerchants ?? 0;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/8 bg-[#080E20]">
      {/* Background glow — Haiti-inspired */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-kob-gold/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[200px] rounded-full bg-emerald-500/5 blur-3xl" />
        {/* Haiti silhouette dots */}
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice">
          <ellipse cx="380" cy="160" rx="200" ry="70" fill="none" stroke="#C9A84C" strokeWidth="0.5" />
          <ellipse cx="500" cy="175" rx="80" ry="45" fill="none" stroke="#C9A84C" strokeWidth="0.5" />
          {Array.from({ length: 40 }).map((_, i) => (
            <circle
              key={`dot-${i}`}
              cx={280 + Math.sin(i * 0.9) * 160 + (i % 7) * 20}
              cy={150 + Math.cos(i * 0.7) * 50 + (i % 5) * 8}
              r={1 + (i % 3) * 0.5}
              fill="#C9A84C"
              opacity={0.3 + (i % 4) * 0.15}
            />
          ))}
        </svg>
      </div>

      <div className="relative z-10 p-6">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-medium text-kob-muted uppercase tracking-widest mb-1">Live System Overview</p>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-kob-text tabular-nums">{fmt(balance)}</span>
              <span className="text-lg font-semibold text-kob-gold">HTG</span>
            </div>
            <p className="text-xs text-kob-muted mt-1">≈ {fmtUsd(balance)} USD</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] text-emerald-400">
              <CheckCircle className="h-3 w-3" />
              All Systems Operational
            </span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 mb-6">
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.href}
                href={a.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-medium transition-all hover:scale-[1.02] ${a.color}`}
              >
                <Icon className="h-3.5 w-3.5" />
                {a.label}
              </Link>
            );
          })}
          <Link href="/system" className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/8 text-xs font-medium text-kob-muted hover:text-kob-text hover:border-white/15 transition-all">
            <RefreshCw className="h-3.5 w-3.5" />
            Recon
          </Link>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-4 gap-3 pt-4 border-t border-white/6">
          {[
            { label: "Today Volume", value: fmt(todayVolume), sub: "HTG" },
            { label: "Cash In", value: fmt(cashIn), sub: "Today" },
            { label: "Cash Out", value: fmt(cashOut), sub: "Today" },
            { label: "Active Users", value: fmt(activeUsers), sub: "30d wallets" },
          ].map((k) => (
            <div key={k.label}>
              <p className="text-[10px] text-kob-muted uppercase tracking-wide mb-0.5">{k.label}</p>
              <p className="text-base font-bold text-kob-text tabular-nums">{k.value}</p>
              <p className="text-[10px] text-kob-muted">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Bottom status row */}
        <div className="flex items-center gap-6 mt-4 pt-3 border-t border-white/6 text-[11px] text-kob-muted">
          <span><span className="text-kob-text font-medium">{fmt(merchants)}</span> Merchants Online</span>
          <span><span className="text-kob-text font-medium">{(overview?.activeAgents as number) ?? 0}</span> Active Agents</span>
          <span><span className="text-kob-text font-medium">{(overview?.pendingWithdrawals as number) ?? 0}</span> Pending Withdrawals</span>
          <span className="ml-auto flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>
      </div>
    </div>
  );
}
