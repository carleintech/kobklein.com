import { Activity, DollarSign, Percent, Receipt, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { apiGet } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

type PosAnalytics = {
  ok: boolean;
  totalGross: number;
  totalFee: number;
  totalNet: number;
  transactionCount: number;
  periodDays?: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtHTG(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

// ── Fee Rate Ring ─────────────────────────────────────────────────────────────

function FeeRateRing({ rate }: { rate: number }) {
  const r = 28;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(Math.max(rate / 100, 0), 1);
  const arc = clamped * circumference;

  return (
    <svg width="72" height="72" viewBox="0 0 72 72" aria-label={`Fee rate ${rate.toFixed(2)} percent`}>
      <title>Effective fee rate ring</title>
      <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke="#C9A84C"
        strokeWidth="5"
        strokeDasharray={`${arc} ${circumference}`}
        strokeLinecap="round"
        className="-rotate-90 origin-center"
      />
    </svg>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon,
  accent = "text-kob-gold",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: ReactNode;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-[#080E20] p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className={`h-7 w-7 rounded-lg flex items-center justify-center bg-white/5 ${accent}`}>
          {icon}
        </div>
        <p className="text-[10px] font-medium text-kob-muted uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-2xl font-bold tabular-nums text-kob-text leading-tight">{value}</p>
      {sub && <p className="text-[10px] text-kob-muted mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PosPage() {
  const data = await apiGet<PosAnalytics | null>("/v1/admin/pos/analytics?days=30", null);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // ── Offline / error state ──────────────────────────────────────────────────
  if (!data) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-kob-text tracking-tight">POS Terminal</h1>
          <p className="text-xs text-kob-muted mt-0.5">Merchant payment analytics · {today}</p>
        </div>
        <div className="rounded-2xl border border-red-500/20 bg-[#080E20] p-10 flex flex-col items-center gap-3">
          <Activity className="h-8 w-8 text-red-400" />
          <p className="text-sm font-semibold text-kob-text">POS data unavailable</p>
          <p className="text-xs text-kob-muted text-center max-w-72">
            The analytics API did not respond. Ensure the API server is running on port 3001.
          </p>
        </div>
      </div>
    );
  }

  // ── Derived metrics ────────────────────────────────────────────────────────
  const gross = data.totalGross ?? 0;
  const fee = data.totalFee ?? 0;
  const net = data.totalNet ?? 0;
  const count = data.transactionCount ?? 0;
  const periodDays = data.periodDays ?? 30;
  const avgTx = count > 0 ? gross / count : 0;
  const feeRate = gross > 0 ? (fee / gross) * 100 : 0;
  const netYield = gross > 0 ? (net / gross) * 100 : 0;

  // Clamp feeRate to 0–100 for the SVG bar width attribute
  const feeRatePct = Math.min(Math.max(feeRate, 0), 100);

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-kob-text tracking-tight">POS Terminal</h1>
        <p className="text-xs text-kob-muted mt-0.5">
          Merchant payment analytics · {today}
        </p>
      </div>

      {/* ── Hero: Gross Volume ──────────────────────────────────────────── */}
      <div className="relative rounded-2xl border border-kob-gold/20 bg-[#080E20] overflow-hidden">
        {/* Gold shimmer accent line */}
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-kob-gold/60 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full bg-kob-gold/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-white/6">

          {/* Gross volume */}
          <div className="p-6 lg:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-kob-gold" />
              <p className="text-[10px] font-medium text-kob-muted uppercase tracking-widest">
                Gross Volume · {periodDays}d
              </p>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-kob-text tabular-nums">{fmtHTG(gross)}</span>
              <span className="text-lg font-semibold text-kob-gold">HTG</span>
            </div>

            <div className="flex items-center gap-6 mt-4 pt-3 border-t border-white/6 text-[11px] text-kob-muted">
              <span>
                <span className="text-kob-text font-semibold">{count.toLocaleString()}</span>{" "}
                transactions
              </span>
              <span>
                <span className="text-kob-text font-semibold">{fmtHTG(avgTx)}</span> avg / tx
              </span>
              <span className="ml-auto flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live ledger
              </span>
            </div>
          </div>

          {/* Fee snapshot */}
          <div className="p-6 flex flex-col justify-center gap-1">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="h-4 w-4 text-orange-400" />
              <p className="text-[10px] font-medium text-kob-muted uppercase tracking-widest">Fee Revenue</p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-orange-400 tabular-nums">{fmtHTG(fee)}</span>
              <span className="text-sm font-semibold text-orange-400/60">HTG</span>
            </div>
            <p className="text-[10px] text-kob-muted">Effective rate: {feeRate.toFixed(2)}%</p>
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-kob-muted">Net to merchants</span>
                <span className="text-emerald-400 font-semibold">{fmtHTG(net)} HTG</span>
              </div>
              <p className="text-[10px] text-kob-muted">{netYield.toFixed(1)}% net yield</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Gross Volume"
          value={`${fmtHTG(gross)} HTG`}
          sub={`${periodDays}-day total`}
          icon={<DollarSign className="h-3.5 w-3.5" />}
          accent="text-kob-gold"
        />
        <StatCard
          label="Fees Collected"
          value={`${fmtHTG(fee)} HTG`}
          sub="Treasury revenue"
          icon={<Percent className="h-3.5 w-3.5" />}
          accent="text-orange-400"
        />
        <StatCard
          label="Net to Merchants"
          value={`${fmtHTG(net)} HTG`}
          sub={`${netYield.toFixed(1)}% net yield`}
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          accent="text-emerald-400"
        />
        <StatCard
          label="Transactions"
          value={count.toLocaleString()}
          sub={`${fmtHTG(avgTx)} HTG avg`}
          icon={<Receipt className="h-3.5 w-3.5" />}
          accent="text-sky-400"
        />
      </div>

      {/* ── Analytics Deep-Dive ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

        {/* Fee rate ring */}
        <div className="rounded-2xl border border-white/8 bg-[#080E20] p-5 flex items-center gap-6">
          <div className="relative flex items-center justify-center shrink-0">
            <FeeRateRing rate={feeRate} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-bold text-kob-gold tabular-nums">
                {feeRate.toFixed(1)}%
              </span>
              <span className="text-[8px] text-kob-muted uppercase tracking-widest">rate</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-kob-muted uppercase tracking-widest mb-1">
              Effective Fee Rate
            </p>
            <p className="text-xl font-bold text-kob-text tabular-nums">{feeRate.toFixed(2)}%</p>
            <p className="text-[10px] text-kob-muted mt-1">Weighted across all POS transactions</p>
            <div className="flex items-center gap-4 mt-3 text-[10px]">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-kob-gold" />
                <span className="text-kob-muted">Fee: {fmtHTG(fee)}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-kob-muted">Net: {fmtHTG(net)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Throughput panel */}
        <div className="rounded-2xl border border-white/8 bg-[#080E20] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-sky-400" />
            <p className="text-[10px] font-semibold text-kob-muted uppercase tracking-widest">
              Transaction Throughput
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-kob-muted mb-0.5">Avg Transaction</p>
              <p className="text-xl font-bold text-kob-text tabular-nums">{fmtHTG(avgTx)}</p>
              <p className="text-[10px] text-kob-muted">HTG per payment</p>
            </div>
            <div>
              <p className="text-[10px] text-kob-muted mb-0.5">Total Count</p>
              <p className="text-xl font-bold text-sky-400 tabular-nums">{count.toLocaleString()}</p>
              <p className="text-[10px] text-kob-muted">in {periodDays} days</p>
            </div>

            {/* Fee vs Net proportion bar */}
            <div className="col-span-2 pt-3 border-t border-white/6">
              <p className="text-[10px] text-kob-muted mb-2">Fee vs net proportion</p>
              <svg
                className="w-full h-2 rounded-full overflow-hidden"
                viewBox="0 0 100 8"
                preserveAspectRatio="none"
                aria-label="Fee vs net proportion bar"
              >
                <title>Fee vs net split</title>
                <rect x="0" y="0" width="100" height="8" fill="rgba(255,255,255,0.04)" />
                <rect x="0" y="0" width={feeRatePct} height="8" fill="#ea580c" />
              </svg>
              <div className="flex items-center justify-between text-[10px] mt-1">
                <span className="text-orange-400">Fee {feeRate.toFixed(1)}%</span>
                <span className="text-emerald-400">Net {netYield.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
