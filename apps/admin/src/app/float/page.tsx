"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Loader2,
  PlusCircle,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { kkGet } from "@/lib/kobklein-api";

// ── Types ─────────────────────────────────────────────────────────────────────

type DistributorFloat = {
  id: string;
  kId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  country?: string;
  htgBalance: number;
  usdBalance: number;
  isFrozen: boolean;
};

type FloatStats = {
  totalDistributors: number;
  totalHtgFloat: number;
  totalUsdFloat: number;
  lowFloatCount: number;
};

// ── Low float threshold (HTG) ─────────────────────────────────────────────────
const LOW_FLOAT_THRESHOLD_HTG = 5_000;

// ── Utility ───────────────────────────────────────────────────────────────────
function fmt(n: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function initials(d: DistributorFloat): string {
  return ((d.firstName?.[0] ?? "") + (d.lastName?.[0] ?? "")).toUpperCase() || "K";
}

// ── Distributor Float Row ─────────────────────────────────────────────────────
function DistributorRow({ dist }: { dist: DistributorFloat }) {
  const isLow = dist.htgBalance < LOW_FLOAT_THRESHOLD_HTG;
  const pct   = Math.min(100, (dist.htgBalance / 50_000) * 100); // relative to 50k HTG max

  return (
    <div className={`flex items-center gap-4 px-5 py-4 rounded-2xl border bg-[#080E20] transition-colors ${
      isLow ? "border-red-500/25" : "border-white/8 hover:border-white/12"
    }`}>
      {/* Avatar */}
      <div className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 ${
        isLow ? "bg-red-500/10 border-red-500/25" : "bg-orange-500/10 border-orange-500/25"
      }`}>
        <span className={`text-sm font-bold ${isLow ? "text-red-400" : "text-orange-400"}`}>
          {initials(dist)}
        </span>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold text-kob-text">
            {dist.firstName} {dist.lastName}
          </p>
          {dist.kId && (
            <span className="px-2 py-0.5 rounded-md border border-kob-gold/30 bg-kob-gold/8 text-[10px] font-mono font-semibold text-kob-gold">
              {dist.kId}
            </span>
          )}
          {dist.isFrozen && (
            <span className="px-2 py-0.5 rounded-md border border-red-500/30 bg-red-500/10 text-[10px] font-semibold text-red-400">
              Frozen
            </span>
          )}
          {isLow && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-yellow-500/30 bg-yellow-500/10 text-[10px] font-semibold text-yellow-400">
              <AlertTriangle className="h-3 w-3" /> Low Float
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-kob-muted">
          {dist.phone && <span>{dist.phone}</span>}
          {dist.country && <span>{dist.country}</span>}
        </div>

        {/* Float bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 max-w-48 h-1.5 rounded-full bg-white/5">
            <div
              className={`h-full rounded-full transition-all ${
                pct < 10 ? "bg-red-500" : pct < 30 ? "bg-yellow-500" : "bg-emerald-500"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={`text-[11px] font-mono font-bold ${
            isLow ? "text-red-400" : "text-emerald-400"
          }`}>
            {fmt(dist.htgBalance, "HTG")}
          </span>
          {dist.usdBalance > 0 && (
            <span className="text-[11px] font-mono text-kob-muted">
              / {fmt(dist.usdBalance, "USD")}
            </span>
          )}
        </div>
      </div>

      {/* Refill link */}
      <Link
        href={`/float/refill?id=${dist.id}`}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-kob-gold/10 border border-kob-gold/25 text-[11px] font-bold text-kob-gold hover:bg-kob-gold/20 transition-all shrink-0"
      >
        <PlusCircle className="h-3.5 w-3.5" />
        Add Float
      </Link>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FloatPage() {
  const [distributors, setDistributors] = useState<DistributorFloat[]>([]);
  const [stats,        setStats]        = useState<FloatStats | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      // Fetch distributors from the users list endpoint
      const data = await kkGet<{
        users: Array<{
          id: string; kId?: string; firstName?: string; lastName?: string;
          phone?: string; email?: string; country?: string; isFrozen: boolean;
        }>;
        total: number;
      }>("v1/admin/users/list?role=distributor&limit=100&sort=name");

      const users = data?.users ?? [];

      // Fetch wallets for each distributor in parallel (batched)
      const withBalances = await Promise.allSettled(
        users.map(async (u) => {
          try {
            const walletData = await kkGet<{
              wallets: Array<{ currency: string; balance: number }>;
            }>(`v1/admin/users/${u.id}/wallets`);

            const htgWallet = walletData?.wallets?.find((w) => w.currency === "HTG");
            const usdWallet = walletData?.wallets?.find((w) => w.currency === "USD");

            return {
              ...u,
              htgBalance: htgWallet?.balance ?? 0,
              usdBalance: usdWallet?.balance ?? 0,
            } satisfies DistributorFloat;
          } catch {
            return {
              ...u,
              htgBalance: 0,
              usdBalance: 0,
            } satisfies DistributorFloat;
          }
        }),
      );

      const resolved = withBalances
        .filter((r): r is PromiseFulfilledResult<DistributorFloat> => r.status === "fulfilled")
        .map((r) => r.value)
        .sort((a, b) => a.htgBalance - b.htgBalance); // lowest float first

      setDistributors(resolved);

      // Compute stats
      const totalHtg  = resolved.reduce((sum, d) => sum + d.htgBalance, 0);
      const totalUsd  = resolved.reduce((sum, d) => sum + d.usdBalance, 0);
      const lowCount  = resolved.filter((d) => d.htgBalance < LOW_FLOAT_THRESHOLD_HTG).length;

      setStats({
        totalDistributors: resolved.length,
        totalHtgFloat:     totalHtg,
        totalUsdFloat:     totalUsd,
        lowFloatCount:     lowCount,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load float data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const lowFloatDists  = distributors.filter((d) => d.htgBalance < LOW_FLOAT_THRESHOLD_HTG);
  const normalDists    = distributors.filter((d) => d.htgBalance >= LOW_FLOAT_THRESHOLD_HTG);

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-kob-text tracking-tight">
            Float Management
          </h1>
          <p className="text-xs text-kob-muted mt-0.5">
            Monitor and refill K-Agent distributor float balances
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/float/refill"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-kob-gold text-kob-black text-[11px] font-bold hover:bg-kob-gold-light transition-all"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Refill Float
          </Link>
          <button
            type="button"
            disabled={loading}
            onClick={load}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-[11px] font-semibold text-kob-muted hover:text-kob-text hover:border-white/20 transition-all disabled:opacity-40"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/25 bg-red-500/8">
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
          <p className="text-xs text-red-400 font-medium">{error}</p>
        </div>
      )}

      {/* ── Stats cards ────────────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-kob-gold/15 bg-[#080E20] px-4 py-3 space-y-1">
            <p className="text-[10px] text-kob-muted uppercase tracking-widest font-semibold">K-Agents</p>
            <p className="text-2xl font-bold text-kob-gold tabular-nums">{stats.totalDistributors}</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/15 bg-[#080E20] px-4 py-3 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-kob-muted uppercase tracking-widest font-semibold">Total HTG Float</p>
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <p className="text-xl font-bold text-emerald-400 tabular-nums">
              {fmt(stats.totalHtgFloat, "HTG")}
            </p>
          </div>
          <div className="rounded-2xl border border-sky-500/15 bg-[#080E20] px-4 py-3 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-kob-muted uppercase tracking-widest font-semibold">Total USD Float</p>
              <Wallet className="h-3.5 w-3.5 text-sky-400" />
            </div>
            <p className="text-xl font-bold text-sky-400 tabular-nums">
              {fmt(stats.totalUsdFloat, "USD")}
            </p>
          </div>
          <div className={`rounded-2xl border bg-[#080E20] px-4 py-3 space-y-1 ${
            stats.lowFloatCount > 0 ? "border-red-500/25" : "border-white/8"
          }`}>
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-kob-muted uppercase tracking-widest font-semibold">Low Float</p>
              <TrendingDown className={`h-3.5 w-3.5 ${stats.lowFloatCount > 0 ? "text-red-400" : "text-kob-muted"}`} />
            </div>
            <p className={`text-2xl font-bold tabular-nums ${
              stats.lowFloatCount > 0 ? "text-red-400" : "text-kob-muted"
            }`}>
              {stats.lowFloatCount}
            </p>
            <p className="text-[9px] text-kob-muted">under G5,000 HTG</p>
          </div>
        </div>
      )}

      {/* ── Loading ────────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 text-kob-gold animate-spin" />
          <p className="text-sm text-kob-muted">Loading float balances…</p>
        </div>
      )}

      {/* ── Low float alerts ────────────────────────────────────────────── */}
      {!loading && lowFloatDists.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <p className="text-sm font-bold text-yellow-400">
              {lowFloatDists.length} Agent{lowFloatDists.length !== 1 ? "s" : ""} Need Refill
            </p>
            <span className="text-[10px] text-kob-muted uppercase tracking-widest">
              — below G{LOW_FLOAT_THRESHOLD_HTG.toLocaleString()} HTG
            </span>
          </div>
          {lowFloatDists.map((d) => (
            <DistributorRow key={d.id} dist={d} />
          ))}
        </div>
      )}

      {/* ── All agents ──────────────────────────────────────────────────── */}
      {!loading && normalDists.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-kob-muted/60" />
            <p className="text-[10px] text-kob-muted uppercase tracking-widest font-semibold">
              All K-Agents — {normalDists.length} active
            </p>
          </div>
          {normalDists.map((d) => (
            <DistributorRow key={d.id} dist={d} />
          ))}
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────── */}
      {!loading && distributors.length === 0 && !error && (
        <div className="rounded-2xl border border-white/8 bg-[#080E20] flex flex-col items-center justify-center py-16 gap-3">
          <Building2 className="h-10 w-10 text-kob-muted/40" />
          <p className="text-sm font-semibold text-kob-text">No K-Agents found</p>
          <p className="text-xs text-kob-muted">
            No distributor accounts are registered yet
          </p>
        </div>
      )}

      {/* ── Quick actions footer ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 p-4 rounded-2xl border border-white/6 bg-[#080E20]">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-kob-text">Need to add float to a specific agent?</p>
          <p className="text-[11px] text-kob-muted mt-0.5">
            Use the Float Refill tool to credit HTG directly to any K-Agent wallet.
          </p>
        </div>
        <Link
          href="/float/refill"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[11px] font-semibold text-kob-muted hover:text-kob-gold hover:border-kob-gold/25 hover:bg-kob-gold/8 transition-all shrink-0"
        >
          Go to Refill <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
