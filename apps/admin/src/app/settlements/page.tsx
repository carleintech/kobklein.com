"use client";

import {
  ArrowDownToLine,
  Banknote,
  CircleDollarSign,
  RefreshCw,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { kkGet } from "@/lib/kobklein-api";

// ── Types ─────────────────────────────────────────────────────────────────────

type Settlement = {
  distributorId: string;
  currency: string;
  totalCashout: number;
  totalFees: number;
  count: number;
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
  value: string | number;
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

// ── Row ───────────────────────────────────────────────────────────────────────

function SettlementRow({ row, rank }: { row: Settlement; rank: number }) {
  return (
    <div className="grid grid-cols-[2rem_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,0.8fr)] gap-4 px-4 py-3 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center text-sm">
      {/* Rank */}
      <div className="text-xs text-kob-muted font-mono text-center">{rank}</div>

      {/* Distributor ID */}
      <div>
        <div className="font-mono text-xs text-kob-text">
          {row.distributorId.slice(0, 16)}…
        </div>
        <div className="text-[10px] text-kob-muted mt-0.5">distributor</div>
      </div>

      {/* Currency */}
      <div>
        <span className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-mono text-kob-muted">
          {row.currency}
        </span>
      </div>

      {/* Cash-out volume */}
      <div className="font-mono text-kob-text">
        {row.totalCashout.toLocaleString("fr-HT")}
      </div>

      {/* Platform fees */}
      <div className="font-mono text-kob-gold">
        {row.totalFees > 0 ? (
          row.totalFees.toLocaleString("fr-HT")
        ) : (
          <span className="text-kob-muted">—</span>
        )}
      </div>

      {/* Tx count */}
      <div className="text-right">
        <span className="text-kob-text font-semibold">{row.count}</span>
        <span className="text-kob-muted text-xs ml-1">txs</span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const DAY_OPTIONS = [7, 14, 30] as const;
type Days = (typeof DAY_OPTIONS)[number];

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<Days>(7);

  const load = useCallback(async (d: Days) => {
    setLoading(true);
    setError(null);
    try {
      const res = await kkGet<Settlement[]>(
        `admin/reports/distributor-cashouts?days=${d}`,
      );
      setSettlements(res ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load settlements");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(days);
  }, [load, days]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalCashout = settlements.reduce((s, r) => s + r.totalCashout, 0);
  const totalFees = settlements.reduce((s, r) => s + r.totalFees, 0);
  const totalTxs = settlements.reduce((s, r) => s + r.count, 0);
  const distCount = new Set(settlements.map((r) => r.distributorId)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-kob-text flex items-center gap-2">
            <Banknote size={20} className="text-kob-gold" />
            Settlements
          </h1>
          <p className="text-sm text-kob-muted mt-0.5">
            Agent cash-out totals and platform fee revenue
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Cash-out Volume"
          value={loading ? "…" : fmtHtg(totalCashout)}
          sub={`${totalTxs} transactions`}
          icon={ArrowDownToLine}
        />
        <KpiCard
          label="Platform Fees"
          value={loading ? "…" : fmtHtg(totalFees)}
          sub="fee revenue"
          icon={CircleDollarSign}
          gold
        />
        <KpiCard
          label="Distributors"
          value={loading ? "…" : distCount}
          sub="active agents"
          icon={Users}
        />
        <KpiCard
          label="Avg Per Agent"
          value={
            loading
              ? "…"
              : distCount > 0
                ? fmtHtg(Math.round(totalCashout / distCount))
                : "—"
          }
          sub="cash-out volume"
          icon={Banknote}
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/8 bg-[#080E20] overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[2rem_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,0.8fr)] gap-4 px-4 py-2.5 border-b border-white/8 bg-white/[0.02]">
          {["#", "Distributor", "Currency", "Cash-out", "Fees", "Txs"].map(
            (h) => (
              <div
                key={h}
                className="text-[10px] font-semibold uppercase tracking-widest text-kob-muted last:text-right"
              >
                {h}
              </div>
            ),
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-kob-muted">
            <RefreshCw size={20} className="animate-spin mr-2" />
            Loading settlements…
          </div>
        ) : settlements.length === 0 ? (
          <div className="py-16 text-center text-kob-muted text-sm">
            No settlement records for this period
          </div>
        ) : (
          settlements.map((row, i) => (
            <SettlementRow
              key={`${row.distributorId}:${row.currency}`}
              row={row}
              rank={i + 1}
            />
          ))
        )}
      </div>

      {!loading && settlements.length > 0 && (
        <p className="text-xs text-kob-muted/60">
          {settlements.length} distributor-currency pairs — sorted by cash-out
          volume desc
        </p>
      )}
    </div>
  );
}
