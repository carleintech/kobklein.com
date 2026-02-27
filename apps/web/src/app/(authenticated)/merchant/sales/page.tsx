"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { kkGet } from "@/lib/kobklein-api";
import {
  ArrowLeft, RefreshCw, Download, TrendingUp, Receipt,
  Banknote, BarChart3, AlertCircle,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

// ─── Design tokens — Merchant: Deep Navy ──────────────────────────────────────

const M = {
  card:    "#0F1E3A",
  panel:   "#102240",
  panel2:  "#132850",
  border:  "rgba(100,140,220,0.13)",
  border2: "rgba(100,140,220,0.08)",
  border3: "rgba(100,140,220,0.20)",
  gold:    "#D4AF37",
  goldD:   "#A08030",
  text:    "#E6EDF7",
  muted:   "#A8BAD8",
  dimmed:  "#3A5A7A",
  success: "#16C784",
  accent:  "#6E8DAE",
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = "today" | "7d" | "30d" | "90d";

type MerchantStats = {
  todaySales: number;
  todayCount: number;
  todayFees:  number;
  balance:    number;
  netToday:   number;
  weekSales:  number;
  monthSales: number;
};

type Settlement = {
  ok:               boolean;
  merchantName?:    string;
  period:           { from: string; to: string };
  transactionCount: number;
  totalGross:       number;
  totalFee:         number;
  totalNet:         number;
  entries: {
    id:         string;
    amount:     number;
    type:       string;
    reference?: string;
    createdAt:  string;
  }[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("fr-HT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function shortLabel(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day:   "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: {
  active?: boolean; payload?: { value: number }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs shadow-xl"
      style={{ background: M.panel2, border: `1px solid ${M.border3}` }}
    >
      <p className="mb-0.5" style={{ color: M.muted }}>{label}</p>
      <p className="font-bold" style={{ color: M.gold }}>
        {fmt(Number(payload[0].value))} HTG
      </p>
    </div>
  );
}

function StatCard({
  icon, label, value, sub, highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-2.5"
      style={{
        background: highlight
          ? `linear-gradient(135deg, ${M.panel2} 0%, rgba(212,175,55,0.08) 100%)`
          : M.card,
        border: `1px solid ${highlight ? "rgba(212,175,55,0.25)" : M.border}`,
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: highlight ? "rgba(212,175,55,0.12)" : "rgba(100,140,220,0.10)",
            color: highlight ? M.gold : M.accent,
          }}
        >
          {icon}
        </div>
        <span
          className="text-[10px] uppercase tracking-widest font-bold leading-tight"
          style={{ color: M.muted }}
        >
          {label}
        </span>
      </div>
      <div>
        <div
          className="text-xl font-black leading-none"
          style={{ color: highlight ? M.gold : M.text }}
        >
          {value}
        </div>
        {sub && (
          <div className="text-xs mt-1" style={{ color: M.dimmed }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Period config ────────────────────────────────────────────────────────────

const PERIODS: { key: Period; label: string; days: number }[] = [
  { key: "today", label: "Today",   days: 0  },
  { key: "7d",    label: "7 Days",  days: 7  },
  { key: "30d",   label: "30 Days", days: 30 },
  { key: "90d",   label: "90 Days", days: 90 },
];

const PAGE_SIZE = 15;

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MerchantSalesPage() {
  const router = useRouter();

  const [period,     setPeriod]     = useState<Period>("30d");
  const [stats,      setStats]      = useState<MerchantStats | null>(null);
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [page,       setPage]       = useState(0);

  const today    = todayISO();
  const fromDate = useMemo(() => {
    const cfg = PERIODS.find(p => p.key === period)!;
    return cfg.days === 0 ? today : daysAgoISO(cfg.days);
  }, [period, today]);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [statsRes, settlementRes] = await Promise.allSettled([
        kkGet<MerchantStats>("v1/merchant/stats"),
        kkGet<Settlement>(`v1/merchant/reports/settlement?from=${fromDate}&to=${today}`),
      ]);
      if (statsRes.status     === "fulfilled") setStats(statsRes.value);
      if (settlementRes.status === "fulfilled") setSettlement(settlementRes.value);
      if (statsRes.status === "rejected" && settlementRes.status === "rejected") {
        setError("Could not load sales data.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fromDate, today]);

  useEffect(() => {
    setPage(0);
    load();
  }, [load]);

  function refresh() {
    setRefreshing(true);
    load(true);
  }

  // ── Aggregated numbers ────────────────────────────────────────────────────

  const entries = useMemo(() => settlement?.entries ?? [], [settlement]);

  const totalGross = period === "today" ? (stats?.todaySales ?? 0) : (settlement?.totalGross ?? 0);
  const totalFees  = period === "today" ? (stats?.todayFees  ?? 0) : (settlement?.totalFee   ?? 0);
  const totalNet   = period === "today" ? (stats?.netToday   ?? 0) : (settlement?.totalNet   ?? 0);
  const txCount    = period === "today"
    ? (stats?.todayCount ?? 0)
    : (settlement?.transactionCount ?? entries.length ?? 0);

  // ── Chart data — aggregate entries by day ─────────────────────────────────

  const chartData = useMemo(() => {
    if (period === "today") {
      return [{ label: "Today", sales: stats?.todaySales ?? 0, isToday: true }];
    }
    const nDays = Math.min(PERIODS.find(p => p.key === period)!.days, 30);
    return Array.from({ length: nDays }, (_, i) => {
      const dayIso = daysAgoISO(nDays - 1 - i);
      const daySum = entries
        .filter(e => e.createdAt?.slice(0, 10) === dayIso)
        .reduce((s, e) => s + Math.abs(Number(e.amount ?? 0)), 0);
      return { label: shortLabel(dayIso), sales: daySum, isToday: dayIso === today };
    });
  }, [period, entries, stats, today]);

  // ── Pagination ────────────────────────────────────────────────────────────

  const totalPages  = Math.ceil(entries.length / PAGE_SIZE);
  const pageEntries = entries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // ── CSV export ────────────────────────────────────────────────────────────

  function exportCsv() {
    const header = "Date,Reference,Amount (HTG),Type\n";
    const rows   = entries
      .map(e =>
        `${new Date(e.createdAt).toISOString()},` +
        `${e.reference ?? ""},` +
        `${Number(e.amount).toFixed(2)},` +
        `${e.type}`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `sales-${fromDate}_${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-5 pb-8 animate-pulse" data-dashboard="merchant">
        <div className="h-8 w-44 rounded-xl" style={{ background: M.panel }} />
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-8 w-20 rounded-xl" style={{ background: M.card }} />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl" style={{ background: M.card }} />
          ))}
        </div>
        <div className="h-52 rounded-2xl" style={{ background: M.card }} />
        <div className="h-64 rounded-2xl" style={{ background: M.card }} />
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────

  if (error) {
    return (
      <div
        className="max-w-lg mx-auto mt-12 rounded-2xl p-6 text-center space-y-3"
        style={{ background: M.card, border: "1px solid rgba(255,100,100,0.20)" }}
      >
        <AlertCircle className="h-8 w-8 mx-auto" style={{ color: "#F87171" }} />
        <p className="text-sm font-medium" style={{ color: M.text }}>{error}</p>
        <button
          onClick={() => load()}
          className="text-xs font-medium px-4 py-2 rounded-xl"
          style={{ background: "rgba(255,100,100,0.10)", color: "#F87171" }}
        >
          Try again
        </button>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 pb-8" data-dashboard="merchant">

      {/* ── HEADER ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors hover:brightness-110"
            style={{ background: M.card, border: `1px solid ${M.border}` }}
          >
            <ArrowLeft className="h-4 w-4" style={{ color: M.muted }} />
          </button>
          <div>
            <div
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest mb-0.5"
              style={{ color: M.muted }}
            >
              <BarChart3 className="h-3 w-3" />
              Sales Report
            </div>
            <h1 className="text-xl font-black leading-none" style={{ color: M.text }}>
              {settlement?.merchantName ?? "Sales Analytics"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            disabled={entries.length === 0}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-opacity disabled:opacity-40"
            style={{
              background: "rgba(212,175,55,0.10)",
              border:     "1px solid rgba(212,175,55,0.22)",
              color:       M.gold,
            }}
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </button>
          <button
            onClick={refresh}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: M.card, border: `1px solid ${M.border}` }}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              style={{ color: M.muted }}
            />
          </button>
        </div>
      </motion.div>

      {/* ── PERIOD TABS ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
      >
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all"
            style={
              period === p.key
                ? {
                    background: "rgba(212,175,55,0.12)",
                    border:     "1px solid rgba(212,175,55,0.32)",
                    color:       M.gold,
                  }
                : {
                    background: M.card,
                    border:     `1px solid ${M.border}`,
                    color:       M.muted,
                  }
            }
          >
            {p.label}
          </button>
        ))}
      </motion.div>

      {/* ── STAT CARDS ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.10 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Total Sales"
          value={`${fmt(totalGross)} HTG`}
          sub={`${txCount} tx${txCount !== 1 ? "s" : ""}`}
        />
        <StatCard
          icon={<Receipt className="h-4 w-4" />}
          label="Platform Fees"
          value={`${fmt(totalFees)} HTG`}
          sub="Deducted at source"
        />
        <StatCard
          icon={<Banknote className="h-4 w-4" />}
          label="Net Earnings"
          value={`${fmt(totalNet)} HTG`}
          sub="After fees"
          highlight
        />
        <StatCard
          icon={<BarChart3 className="h-4 w-4" />}
          label="Wallet Balance"
          value={`${fmt(stats?.balance ?? 0)} HTG`}
          sub="Current balance"
        />
      </motion.div>

      {/* ── DAILY CHART ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl p-4"
        style={{ background: M.card, border: `1px solid ${M.border}` }}
      >
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4" style={{ color: M.gold }} />
          <span className="text-sm font-bold" style={{ color: M.text }}>
            Daily Revenue
          </span>
          <span className="ml-auto text-xs font-medium" style={{ color: M.dimmed }}>
            HTG
          </span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} barCategoryGap="38%">
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: M.dimmed }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis hide />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: "rgba(100,140,220,0.05)" }}
            />
            <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
              {chartData.map((d, i) => (
                <Cell
                  key={i}
                  fill={d.isToday ? M.gold : d.sales > 0 ? M.accent : M.dimmed}
                  fillOpacity={d.isToday ? 1 : d.sales > 0 ? 0.75 : 0.25}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: M.gold }} />
            <span className="text-[10px]" style={{ color: M.dimmed }}>Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: M.accent, opacity: 0.75 }} />
            <span className="text-[10px]" style={{ color: M.dimmed }}>Sales day</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: M.dimmed, opacity: 0.4 }} />
            <span className="text-[10px]" style={{ color: M.dimmed }}>No sales</span>
          </div>
        </div>
      </motion.div>

      {/* ── TRANSACTION LIST ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.20 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: M.card, border: `1px solid ${M.border}` }}
      >
        {/* Table header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: `1px solid ${M.border2}` }}
        >
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4" style={{ color: M.gold }} />
            <span className="text-sm font-bold" style={{ color: M.text }}>
              Transactions
            </span>
            {entries.length > 0 && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{
                  background: "rgba(212,175,55,0.10)",
                  color:       M.gold,
                }}
              >
                {entries.length}
              </span>
            )}
          </div>
          {totalPages > 1 && (
            <span className="text-xs" style={{ color: M.dimmed }}>
              Page {page + 1} / {totalPages}
            </span>
          )}
        </div>

        {/* Column labels */}
        {entries.length > 0 && (
          <div
            className="grid grid-cols-[1fr_auto] px-4 py-2 text-[10px] uppercase tracking-widest font-bold"
            style={{
              color:        M.dimmed,
              borderBottom: `1px solid ${M.border2}`,
              background:   M.panel,
            }}
          >
            <span>Reference / Date</span>
            <span className="text-right">Amount</span>
          </div>
        )}

        {/* Entries */}
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: M.panel }}
            >
              <Receipt className="h-5 w-5" style={{ color: M.dimmed }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: M.muted }}>
              No transactions found
            </p>
            <p className="text-xs text-center max-w-[200px]" style={{ color: M.dimmed }}>
              {period === "today"
                ? "No sales recorded today yet."
                : `No sales in the selected period.`}
            </p>
          </div>
        ) : (
          <>
            <AnimatePresence mode="popLayout">
              {pageEntries.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.018 }}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:brightness-110"
                  style={{ borderBottom: `1px solid ${M.border2}` }}
                >
                  {/* Icon */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(22,199,132,0.10)" }}
                  >
                    <Banknote className="h-4 w-4" style={{ color: M.success }} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-sm font-bold truncate"
                      style={{ color: M.text }}
                    >
                      {entry.reference
                        ? entry.reference.length > 20
                          ? `${entry.reference.slice(0, 20)}…`
                          : entry.reference
                        : `#${entry.id.slice(-8).toUpperCase()}`}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: M.dimmed }}>
                      {formatTime(entry.createdAt)}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black" style={{ color: M.success }}>
                      +{fmt(Math.abs(Number(entry.amount)))}
                    </div>
                    <div
                      className="text-[10px] uppercase tracking-widest"
                      style={{ color: M.dimmed }}
                    >
                      HTG
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                className="flex items-center justify-between px-4 py-3 gap-3"
                style={{ borderTop: `1px solid ${M.border2}` }}
              >
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="text-xs font-bold px-4 py-2 rounded-xl disabled:opacity-40 transition-opacity"
                  style={{ background: M.panel, color: M.muted }}
                >
                  ← Previous
                </button>
                <span className="text-xs" style={{ color: M.dimmed }}>
                  {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, entries.length)} of {entries.length}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="text-xs font-bold px-4 py-2 rounded-xl disabled:opacity-40 transition-opacity"
                  style={{ background: M.panel, color: M.muted }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
