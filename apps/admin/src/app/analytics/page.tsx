"use client";

import {
  AlertTriangle,
  ArrowRight,
  BarChart2,
  DollarSign,
  RefreshCw,
  Shield,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { kkGet } from "@/lib/kobklein-api";

// ── Types ─────────────────────────────────────────────────────────────────────

type Overview = {
  transferVolume: number;
  transferCount: number;
  merchantVolume: number;
  withdrawalVolume: number;
  withdrawalCount: number;
  depositVolume: number;
  revenue: number;
};

type UserGrowth = {
  total: number;
  newThisPeriod: number;
  byRole: Record<string, number>;
  kycFunnel: Record<string, number>;
  amlFlags: { open: number; critical: number };
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtHtg(n: number) {
  return `${n.toLocaleString("fr-HT")} HTG`;
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  gold,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  gold?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${gold ? "border-kob-gold/30 bg-kob-gold/5" : "border-white/8 bg-[#080E20]"}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-kob-muted uppercase tracking-wider">
          {label}
        </span>
        <Icon size={14} className={gold ? "text-kob-gold" : "text-kob-muted"} />
      </div>
      <div
        className={`text-2xl font-semibold font-mono ${gold ? "text-kob-gold" : "text-kob-text"}`}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-kob-muted mt-1">{sub}</div>}
    </div>
  );
}

// ── Nav tile ──────────────────────────────────────────────────────────────────

function NavTile({
  href,
  icon: Icon,
  label,
  description,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <div className="group flex items-center justify-between rounded-xl border border-white/8 bg-[#080E20] p-5 hover:border-white/15 hover:bg-white/[0.03] transition-all cursor-pointer">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-kob-gold/10 border border-kob-gold/20">
            <Icon size={20} className="text-kob-gold" />
          </div>
          <div>
            <div className="font-medium text-kob-text">{label}</div>
            <div className="text-sm text-kob-muted">{description}</div>
          </div>
        </div>
        <ArrowRight
          size={16}
          className="text-kob-muted group-hover:text-kob-gold group-hover:translate-x-0.5 transition-all"
        />
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const DAY_OPTIONS = [7, 30, 90] as const;
type Days = (typeof DAY_OPTIONS)[number];

export default function AnalyticsPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<Days>(30);

  const [userData, setUserData] = useState<UserGrowth | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  const load = useCallback(async (d: Days) => {
    setLoading(true);
    setError(null);
    try {
      const res = await kkGet<Overview>(`admin/analytics/overview?days=${d}`);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async (d: Days) => {
    setUserLoading(true);
    try {
      const res = await kkGet<UserGrowth>(`admin/analytics/users?days=${d}`);
      setUserData(res);
    } catch {
      // silently fail — user section is non-critical
    } finally {
      setUserLoading(false);
    }
  }, []);

  useEffect(() => {
    load(days);
    loadUsers(days);
  }, [load, loadUsers, days]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-kob-text flex items-center gap-2">
            <BarChart2 size={20} className="text-kob-gold" />
            Network Analytics
          </h1>
          <p className="text-sm text-kob-muted mt-0.5">
            Transaction volume and revenue metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Days selector */}
          <div className="flex items-center rounded-lg border border-white/8 bg-[#080E20] p-0.5">
            {DAY_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  days === d
                    ? "bg-kob-gold text-[#080B14]"
                    : "text-kob-muted hover:text-kob-text"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => load(days)}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-[#080E20] px-3 py-1.5 text-xs text-kob-muted hover:text-kob-text hover:border-white/15 transition-colors disabled:opacity-40"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          label="Transfer Volume"
          value={loading ? "…" : fmtHtg(data?.transferVolume ?? 0)}
          sub={`${data?.transferCount ?? 0} transactions`}
          icon={ArrowRight}
        />
        <KpiCard
          label="Merchant Volume"
          value={loading ? "…" : fmtHtg(data?.merchantVolume ?? 0)}
          icon={TrendingUp}
        />
        <KpiCard
          label="Deposit Volume"
          value={loading ? "…" : fmtHtg(data?.depositVolume ?? 0)}
          icon={Wallet}
        />
        <KpiCard
          label="Withdrawal Volume"
          value={loading ? "…" : fmtHtg(data?.withdrawalVolume ?? 0)}
          sub={`${data?.withdrawalCount ?? 0} withdrawals`}
          icon={TrendingDown}
        />
        <KpiCard
          label="Fee Revenue"
          value={loading ? "…" : fmtHtg(data?.revenue ?? 0)}
          sub={`Last ${days} days`}
          icon={DollarSign}
          gold
        />
        <KpiCard
          label="Avg Transfer"
          value={
            loading
              ? "…"
              : data && data.transferCount > 0
                ? fmtHtg(Math.round(data.transferVolume / data.transferCount))
                : "—"
          }
          sub="per transaction"
          icon={BarChart2}
        />
      </div>

      {/* User Insights */}
      <div>
        <h2 className="text-sm font-medium text-kob-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <Users size={14} className="text-kob-gold" />
          User Insights
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <KpiCard
            label="Total Users"
            value={userLoading ? "…" : String(userData?.total ?? 0)}
            sub={`+${userData?.newThisPeriod ?? 0} in ${days}d`}
            icon={Users}
          />
          <KpiCard
            label="KYC Verified"
            value={userLoading ? "…" : String(userData?.kycFunnel?.tier2 ?? 0)}
            sub={`tier0: ${userData?.kycFunnel?.tier0 ?? 0} · tier1: ${userData?.kycFunnel?.tier1 ?? 0}`}
            icon={UserCheck}
            gold
          />
          <KpiCard
            label="Open AML Flags"
            value={userLoading ? "…" : String(userData?.amlFlags?.open ?? 0)}
            sub={
              (userData?.amlFlags?.critical ?? 0) > 0
                ? `${userData?.amlFlags?.critical} critical`
                : "none critical"
            }
            icon={AlertTriangle}
          />
          <KpiCard
            label="Compliance"
            value={
              userLoading || !userData
                ? "…"
                : userData.total > 0
                  ? `${Math.round(((userData.kycFunnel?.tier2 ?? 0) / userData.total) * 100)}%`
                  : "0%"
            }
            sub="KYC tier-2 rate"
            icon={Shield}
          />
        </div>

        {/* Role breakdown */}
        {!userLoading && userData && (
          <div className="grid grid-cols-4 gap-3">
            {(["client", "merchant", "distributor", "diaspora"] as const).map(
              (role) => (
                <div
                  key={role}
                  className="rounded-lg border border-white/8 bg-[#080E20] px-3 py-2 text-center"
                >
                  <div className="text-lg font-semibold font-mono text-kob-text">
                    {userData.byRole[role] ?? 0}
                  </div>
                  <div className="text-xs text-kob-muted capitalize">{role}</div>
                </div>
              ),
            )}
          </div>
        )}
      </div>

      {/* Nav tiles */}
      <div className="grid gap-4 md:grid-cols-2">
        <NavTile
          href="/analytics/volume"
          icon={TrendingUp}
          label="Daily Volume"
          description="Transaction trends over time"
        />
        <NavTile
          href="/analytics/revenue"
          icon={DollarSign}
          label="Daily Revenue"
          description="Fee earnings over time"
        />
      </div>
    </div>
  );
}
