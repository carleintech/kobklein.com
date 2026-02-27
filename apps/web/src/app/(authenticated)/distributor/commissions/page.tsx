"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { kkGet } from "@/lib/kobklein-api";
import {
  TrendingUp, Wallet, CheckCircle2, Clock, RefreshCw,
  AlertTriangle, ArrowDownLeft, ArrowUpRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type CommissionSummary = {
  totalEarned: number;
  pendingBalance: number;
  totalPaid: number;
  currency: string;
};

type CommissionEntry = {
  id: string;
  amount: number;
  currency: string;
  type: "cashin" | "cashout" | string;
  status: "earned" | "paid" | string;
  createdAt: string;
  txnId?: string;
};

// ─── Design tokens ────────────────────────────────────────────────────────────

const BG     = "#0F0800";
const PANEL  = "#1A1200";
const PANEL2 = "#221800";
const BORDER = "rgba(245,158,11,0.15)";
const GOLD   = "#F59E0B";
const GOLD2  = "#D97706";
const AMBER  = "#FCD34D";
const EMERALD = "#10B981";
const MUTED  = "#78716C";
const TEXT   = "#E7E5E4";

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, currency, icon: Icon, iconColor, borderColor, delay = 0,
}: {
  label: string; value: number; currency: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconColor: string; borderColor: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl p-4 space-y-2"
      style={{
        background: PANEL2,
        border: `1px solid ${borderColor}`,
      }}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0" style={{ color: iconColor }} />
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: iconColor }}>
          {label}
        </span>
      </div>
      <div>
        <span
          className="text-2xl font-black tabular-nums"
          style={{ color: TEXT }}
        >
          {value.toLocaleString("fr-HT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className="text-sm font-bold ml-1.5" style={{ color: iconColor }}>{currency}</span>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CommissionsPage() {
  const [summary, setSummary]       = useState<CommissionSummary | null>(null);
  const [history, setHistory]       = useState<CommissionEntry[]>([]);
  const [loading, setLoading]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [page, setPage]             = useState(1);
  const [hasMore, setHasMore]       = useState(true);

  const load = useCallback(async (pg = 1, append = false) => {
    if (pg === 1) setLoading(true);
    else setLoadingMore(true);
    setError(null);
    try {
      const [sumRes, histRes] = await Promise.allSettled([
        pg === 1 ? kkGet<CommissionSummary>("v1/distributor/commissions/summary") : Promise.resolve(null),
        kkGet<{ items: CommissionEntry[]; total: number }>(`v1/distributor/commissions?page=${pg}`),
      ]);
      if (sumRes.status === "fulfilled" && sumRes.value) setSummary(sumRes.value as CommissionSummary);
      if (histRes.status === "fulfilled") {
        const { items, total } = histRes.value as { items: CommissionEntry[]; total: number };
        setHistory((prev) => append ? [...prev, ...items] : items);
        setHasMore(history.length + items.length < total);
      }
    } catch {
      setError("Could not load commission data.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [history.length]);

  useEffect(() => { load(1); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    load(next, true);
  };

  const currency = summary?.currency ?? "HTG";

  return (
    <div className="min-h-screen pb-28" style={{ background: BG, color: TEXT }}>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 mb-1"
              style={{ color: GOLD }}>
              <TrendingUp className="h-3 w-3" /> Commission Tracking
            </div>
            <h1 className="text-2xl font-black" style={{ color: TEXT, fontFamily: "'Playfair Display', serif" }}>
              My Commissions
            </h1>
            <p className="text-xs mt-0.5" style={{ color: MUTED }}>
              Earnings from cash-in and cash-out operations
            </p>
          </div>
          <button type="button" onClick={() => load(1)} aria-label="Refresh"
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: PANEL, border: `1px solid ${BORDER}` }}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} style={{ color: GOLD }} />
          </button>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-300 flex-1">{error}</p>
              <button type="button" onClick={() => setError(null)} className="text-red-400 text-xs font-bold">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stat cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: PANEL2 }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard
              label="Total Earned"
              value={summary?.totalEarned ?? 0}
              currency={currency}
              icon={TrendingUp}
              iconColor={GOLD}
              borderColor={`${GOLD}30`}
              delay={0.05}
            />
            <StatCard
              label="Pending Payout"
              value={summary?.pendingBalance ?? 0}
              currency={currency}
              icon={Clock}
              iconColor={AMBER}
              borderColor="rgba(252,211,77,0.25)"
              delay={0.10}
            />
            <StatCard
              label="Paid Out"
              value={summary?.totalPaid ?? 0}
              currency={currency}
              icon={CheckCircle2}
              iconColor={EMERALD}
              borderColor="rgba(16,185,129,0.25)"
              delay={0.15}
            />
          </div>
        )}

        {/* Payout info */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl px-4 py-3 flex items-center gap-2 text-xs"
            style={{ background: `${GOLD}0D`, border: `1px solid ${GOLD}20` }}
          >
            <Wallet className="h-3.5 w-3.5 shrink-0" style={{ color: GOLD2 }} />
            <span style={{ color: MUTED }}>
              Commissions are credited to your float wallet automatically after each transaction settles.
            </span>
          </motion.div>
        )}

        {/* Transaction history */}
        <div>
          <h2 className="text-sm font-bold mb-3" style={{ color: TEXT }}>Transaction History</h2>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: PANEL2 }} />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-4 text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: `${GOLD}12`, border: `2px dashed ${GOLD}25` }}
              >
                <TrendingUp className="h-7 w-7" style={{ color: GOLD }} />
              </div>
              <div>
                <p className="text-base font-bold" style={{ color: TEXT }}>No commissions yet</p>
                <p className="text-sm mt-1" style={{ color: MUTED }}>
                  Complete cash-in or cash-out operations to start earning
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((entry, i) => {
                const isCashIn = entry.type === "cashin";
                const isPaid   = entry.status === "paid";
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ background: PANEL2, border: `1px solid ${BORDER}` }}
                  >
                    {/* Icon */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: isCashIn ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.10)",
                      }}
                    >
                      {isCashIn
                        ? <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
                        : <ArrowUpRight  className="h-4 w-4 text-red-400" />}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: TEXT }}>
                        {isCashIn ? "Cash-In" : "Cash-Out"} Commission
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: MUTED }}>
                        {new Date(entry.createdAt).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {/* Amount + status */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <p className="text-sm font-black tabular-nums" style={{ color: AMBER }}>
                        +{entry.amount.toLocaleString("fr-HT", { minimumFractionDigits: 2 })} {entry.currency}
                      </p>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                        style={{
                          background: isPaid ? "rgba(16,185,129,0.12)" : `${GOLD}18`,
                          color: isPaid ? EMERALD : GOLD2,
                        }}
                      >
                        {isPaid ? "Paid" : "Earned"}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Load more */}
          {!loading && hasMore && history.length > 0 && (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="w-full mt-4 py-3 rounded-xl text-sm font-bold transition-all"
              style={{
                background: PANEL,
                border: `1px solid ${BORDER}`,
                color: GOLD,
                opacity: loadingMore ? 0.6 : 1,
              }}
            >
              {loadingMore ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Loading…
                </span>
              ) : (
                "Load More"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
