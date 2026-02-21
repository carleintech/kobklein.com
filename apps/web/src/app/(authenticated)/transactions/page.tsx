"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { kkGet } from "@/lib/kobklein-api";
import {
  ArrowLeft, Loader2, Search, Filter, ArrowUpRight, ArrowDownLeft,
  RefreshCw, X, ChevronDown, Calendar, Wallet,
  ArrowLeftRight, CreditCard, Zap, CheckCircle2, Clock, AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Transaction = {
  id: string;
  type: string;
  amount: number;
  currency: string;
  createdAt: string;
  status: string;
  description?: string;
  counterpartyName?: string;
  reference?: string;
  fee?: number;
  walletId?: string;
};

type BalanceInfo = {
  balances?: { walletId: string; currency: string; type: string; balance: number }[];
  walletId?: string;
};

type FilterType = "all" | "credit" | "debit";
type StatusFilter = "all" | "completed" | "pending" | "failed";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CREDIT_TYPES = new Set(["TOPUP", "RECEIVE", "TRANSFER_IN", "REFUND", "CASHBACK", "DEPOSIT"]);
const DEBIT_TYPES  = new Set(["SEND", "TRANSFER_OUT", "PAYMENT", "WITHDRAWAL", "FEE", "PURCHASE"]);

function isCredit(type: string) {
  return CREDIT_TYPES.has(type.toUpperCase()) ||
    type.toLowerCase().includes("in") ||
    type.toLowerCase().includes("receive") ||
    type.toLowerCase().includes("topup") ||
    type.toLowerCase().includes("refund");
}

function formatCurrency(amount: number, currency = "HTG") {
  const sym = currency === "USD" ? "$" : currency === "HTG" ? "HTG " : `${currency} `;
  return `${sym}${Math.abs(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function groupByDate(txs: Transaction[]): { label: string; items: Transaction[] }[] {
  const groups: Record<string, Transaction[]> = {};
  const today    = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

  for (const tx of txs) {
    const d = new Date(tx.createdAt); d.setHours(0, 0, 0, 0);
    let label: string;
    if (d.getTime() === today.getTime())     label = "Today";
    else if (d.getTime() === yesterday.getTime()) label = "Yesterday";
    else label = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    if (!groups[label]) groups[label] = [];
    groups[label].push(tx);
  }

  return Object.entries(groups).map(([label, items]) => ({ label, items }));
}

function txIcon(type: string) {
  const up  = type.toUpperCase();
  if (up === "TOPUP" || up === "DEPOSIT")   return <Zap className="h-4 w-4" />;
  if (up.includes("CARD") || up === "PURCHASE") return <CreditCard className="h-4 w-4" />;
  if (up.includes("TRANSFER"))              return <ArrowLeftRight className="h-4 w-4" />;
  if (isCredit(type))                       return <ArrowDownLeft className="h-4 w-4" />;
  return <ArrowUpRight className="h-4 w-4" />;
}

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "completed" || s === "success" || s === "settled") {
    return (
      <div className="flex items-center gap-1 text-[#10B981]">
        <CheckCircle2 className="h-3 w-3" />
        <span className="text-[10px] font-bold uppercase tracking-wide">Done</span>
      </div>
    );
  }
  if (s === "pending" || s === "processing") {
    return (
      <div className="flex items-center gap-1 text-amber-400">
        <Clock className="h-3 w-3" />
        <span className="text-[10px] font-bold uppercase tracking-wide">Pending</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-red-400">
      <AlertCircle className="h-3 w-3" />
      <span className="text-[10px] font-bold uppercase tracking-wide">Failed</span>
    </div>
  );
}

function txLabel(type: string) {
  const map: Record<string, string> = {
    TOPUP: "Top-up",
    DEPOSIT: "Deposit",
    SEND: "Send",
    RECEIVE: "Received",
    TRANSFER_IN: "Transfer In",
    TRANSFER_OUT: "Transfer Out",
    PAYMENT: "Payment",
    PURCHASE: "Purchase",
    WITHDRAWAL: "Withdrawal",
    REFUND: "Refund",
    CASHBACK: "Cashback",
    FEE: "Fee",
  };
  return map[type.toUpperCase()] ?? type.replace(/_/g, " ");
}

// ─── Transaction Detail Drawer ────────────────────────────────────────────────

function TxDrawer({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  const credit = isCredit(tx.type);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{ background: "rgba(6,13,31,0.92)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border border-white/[0.08] overflow-hidden"
        style={{ background: "#0E1829" }}
      >
        {/* Top stripe */}
        <div
          className="h-1 w-full"
          style={{
            background: credit
              ? "linear-gradient(90deg, #10B981, #059669)"
              : "linear-gradient(90deg, #C9A84C, #9F7F2C)",
          }}
        />

        <div className="p-6 flex flex-col gap-5">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5A6B82] uppercase tracking-widest">Transaction Detail</span>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-[#162038] flex items-center justify-center text-[#5A6B82] hover:text-[#F0F1F5] transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Amount */}
          <div className="text-center">
            <div
              className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
              style={{
                background: credit ? "rgba(16,185,129,0.12)" : "rgba(201,168,76,0.12)",
                border: `1px solid ${credit ? "rgba(16,185,129,0.25)" : "rgba(201,168,76,0.25)"}`,
                color: credit ? "#10B981" : "#C9A84C",
              }}
            >
              {txIcon(tx.type)}
            </div>
            <p
              className="text-3xl font-black"
              style={{ color: credit ? "#10B981" : "#F0F1F5" }}
            >
              {credit ? "+" : "-"}{formatCurrency(tx.amount, tx.currency)}
            </p>
            <p className="text-sm text-[#5A6B82] mt-1">{txLabel(tx.type)}</p>
          </div>

          {/* Details grid */}
          <div className="rounded-2xl bg-[#080F1C] border border-white/[0.04] p-4 flex flex-col gap-3">
            {[
              { label: "Status",      value: statusBadge(tx.status), raw: true },
              { label: "Date",        value: formatDate(tx.createdAt) },
              { label: "Time",        value: formatTime(tx.createdAt) },
              tx.counterpartyName ? { label: credit ? "From" : "To", value: tx.counterpartyName } : null,
              tx.description ? { label: "Note", value: tx.description } : null,
              tx.fee ? { label: "Fee", value: formatCurrency(tx.fee, tx.currency) } : null,
              tx.reference ? { label: "Reference", value: tx.reference } : null,
              { label: "ID", value: tx.id.slice(0, 16) + "…" },
            ]
              .filter(Boolean)
              .map((row) => (
                <div key={row!.label} className="flex items-center justify-between gap-3">
                  <span className="text-xs text-[#3A4558] shrink-0">{row!.label}</span>
                  {row!.raw ? (
                    row!.value
                  ) : (
                    <span className="text-xs font-medium text-[#B8BCC8] text-right truncate max-w-[180px]">
                      {row!.value as string}
                    </span>
                  )}
                </div>
              ))}
          </div>

          <button
            onClick={onClose}
            className="w-full h-11 rounded-2xl bg-[#162038] border border-white/[0.06] text-sm font-bold text-[#7A8394] hover:text-[#F0F1F5] transition-all"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TransactionsPage() {
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [error,        setError]        = useState("");

  // Filters
  const [search,       setSearch]       = useState("");
  const [typeFilter,   setTypeFilter]   = useState<FilterType>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showFilters,  setShowFilters]  = useState(false);

  // Detail drawer
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Summary stats
  const [totalIn,  setTotalIn]  = useState(0);
  const [totalOut, setTotalOut] = useState(0);

  const searchRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError("");
    try {
      // Get walletId for the timeline endpoint
      let txList: Transaction[] = [];
      try {
        const bal = await kkGet<BalanceInfo>("v1/wallets/balance");
        const walletId = bal.balances?.find((b) => b.type === "USER")?.walletId ?? (bal as any).walletId;
        if (walletId) {
          txList = await kkGet<Transaction[]>(`v1/wallets/${walletId}/timeline?limit=200`);
        } else {
          txList = await kkGet<Transaction[]>("v1/transactions?limit=200");
        }
      } catch {
        txList = await kkGet<Transaction[]>("v1/transactions?limit=200");
      }

      // Compute summary
      let inSum = 0, outSum = 0;
      for (const tx of txList) {
        if (isCredit(tx.type)) inSum  += tx.amount;
        else                   outSum += tx.amount;
      }
      setTotalIn(inSum);
      setTotalOut(outSum);
      setTransactions(txList);
    } catch (e: any) {
      setError(e.message || "Failed to load transactions");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Filtered transactions ────────────────────────────────────────────────────
  const filtered = transactions.filter((tx) => {
    // Type filter
    if (typeFilter === "credit" && !isCredit(tx.type)) return false;
    if (typeFilter === "debit"  && isCredit(tx.type))  return false;

    // Status filter
    if (statusFilter !== "all") {
      const s = tx.status.toLowerCase();
      if (statusFilter === "completed" && !(s === "completed" || s === "success" || s === "settled")) return false;
      if (statusFilter === "pending"   && !(s === "pending" || s === "processing")) return false;
      if (statusFilter === "failed"    && s !== "failed") return false;
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        tx.counterpartyName?.toLowerCase().includes(q) ||
        tx.description?.toLowerCase().includes(q) ||
        txLabel(tx.type).toLowerCase().includes(q) ||
        tx.id.toLowerCase().includes(q) ||
        formatCurrency(tx.amount, tx.currency).includes(q)
      );
    }

    return true;
  });

  const groups = groupByDate(filtered);
  const hasFilters = typeFilter !== "all" || statusFilter !== "all" || search.trim();

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-lg mx-auto flex flex-col gap-4 p-4 md:p-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#162038] animate-pulse" />
          <div className="flex flex-col gap-1.5">
            <div className="w-36 h-5 rounded-lg bg-[#162038] animate-pulse" />
            <div className="w-24 h-3 rounded-lg bg-[#0E1829] animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-[#0E1829] animate-pulse" />
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-[#0E1829] animate-pulse" style={{ opacity: 1 - i * 0.1 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-lg mx-auto flex flex-col gap-5 p-4 md:p-0 pb-24">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl bg-[#162038] hover:bg-[#1A2640] text-[#7A8394] hover:text-[#E0E4EE] transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-[#F0F1F5]">Transactions</h1>
              <p className="text-xs text-[#5A6B82] mt-0.5">
                {transactions.length} total · {filtered.length} shown
              </p>
            </div>
          </div>

          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-[#162038] text-[#5A6B82] hover:text-[#F0F1F5] hover:bg-[#1A2640] transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </motion.div>

        {/* ── Summary cards ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 gap-3"
        >
          {/* Money In */}
          <div
            className="rounded-2xl p-4 flex flex-col gap-1"
            style={{
              background: "linear-gradient(135deg, rgba(16,185,129,0.10), rgba(16,185,129,0.04))",
              border: "1px solid rgba(16,185,129,0.15)",
            }}
          >
            <div className="flex items-center gap-1.5">
              <ArrowDownLeft className="h-3.5 w-3.5 text-[#10B981]" />
              <span className="text-[10px] font-black text-[#10B981] uppercase tracking-widest">Money In</span>
            </div>
            <p className="text-lg font-black text-[#10B981]">
              {formatCurrency(totalIn)}
            </p>
          </div>

          {/* Money Out */}
          <div
            className="rounded-2xl p-4 flex flex-col gap-1"
            style={{
              background: "linear-gradient(135deg, rgba(201,168,76,0.08), rgba(201,168,76,0.03))",
              border: "1px solid rgba(201,168,76,0.12)",
            }}
          >
            <div className="flex items-center gap-1.5">
              <ArrowUpRight className="h-3.5 w-3.5 text-[#C9A84C]" />
              <span className="text-[10px] font-black text-[#C9A84C] uppercase tracking-widest">Money Out</span>
            </div>
            <p className="text-lg font-black text-[#C9A84C]">
              {formatCurrency(totalOut)}
            </p>
          </div>
        </motion.div>

        {/* ── Search + Filter bar ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 }}
          className="flex flex-col gap-2"
        >
          {/* Search */}
          <div className="flex items-center gap-2">
            <div
              className="flex-1 flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-all"
              style={{ background: "#0E1829", borderColor: "rgba(255,255,255,0.07)" }}
            >
              <Search className="h-4 w-4 text-[#3A4558] shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search transactions…"
                className="flex-1 bg-transparent text-sm text-[#F0F1F5] placeholder-[#3A4558] outline-none"
              />
              {search && (
                <button onClick={() => setSearch("")}>
                  <X className="h-3.5 w-3.5 text-[#5A6B82]" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border transition-all text-sm font-bold"
              style={{
                background: hasFilters ? "rgba(201,168,76,0.10)" : "#0E1829",
                borderColor: hasFilters ? "rgba(201,168,76,0.30)" : "rgba(255,255,255,0.07)",
                color: hasFilters ? "#C9A84C" : "#5A6B82",
              }}
            >
              <Filter className="h-4 w-4" />
              {hasFilters && <span className="text-xs">On</span>}
            </button>
          </div>

          {/* Filter panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl bg-[#0E1829] border border-white/[0.06] p-3 flex flex-col gap-3">
                  {/* Type filter */}
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[10px] font-black text-[#3A4558] uppercase tracking-widest">Type</p>
                    <div className="flex gap-2">
                      {(["all", "credit", "debit"] as FilterType[]).map((f) => (
                        <button
                          key={f}
                          onClick={() => setTypeFilter(f)}
                          className="flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-all"
                          style={{
                            background: typeFilter === f ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${typeFilter === f ? "rgba(201,168,76,0.30)" : "rgba(255,255,255,0.06)"}`,
                            color: typeFilter === f ? "#C9A84C" : "#5A6B82",
                          }}
                        >
                          {f === "credit" ? "Money In" : f === "debit" ? "Money Out" : "All"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Status filter */}
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[10px] font-black text-[#3A4558] uppercase tracking-widest">Status</p>
                    <div className="flex gap-2">
                      {(["all", "completed", "pending", "failed"] as StatusFilter[]).map((f) => (
                        <button
                          key={f}
                          onClick={() => setStatusFilter(f)}
                          className="flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-all"
                          style={{
                            background: statusFilter === f ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${statusFilter === f ? "rgba(201,168,76,0.30)" : "rgba(255,255,255,0.06)"}`,
                            color: statusFilter === f ? "#C9A84C" : "#5A6B82",
                          }}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Clear filters */}
                  {hasFilters && (
                    <button
                      onClick={() => { setTypeFilter("all"); setStatusFilter("all"); setSearch(""); }}
                      className="text-xs text-red-400 hover:text-red-300 font-bold transition-colors text-right"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Error ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl bg-red-500/08 border border-red-500/15 px-4 py-3 flex items-center gap-2.5"
            >
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-300 flex-1">{error}</p>
              <button onClick={() => load()} className="text-xs text-red-400 font-bold">Retry</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Empty state ── */}
        {!error && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 gap-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#0E1829] border border-white/[0.06] flex items-center justify-center">
              <Wallet className="h-7 w-7 text-[#2A3448]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-[#5A6B82]">
                {hasFilters ? "No matching transactions" : "No transactions yet"}
              </p>
              <p className="text-xs text-[#3A4558] mt-1">
                {hasFilters ? "Try adjusting your filters" : "Make your first transaction to see history here"}
              </p>
            </div>
            {hasFilters && (
              <button
                onClick={() => { setTypeFilter("all"); setStatusFilter("all"); setSearch(""); }}
                className="text-xs text-[#C9A84C] font-bold"
              >
                Clear filters
              </button>
            )}
          </motion.div>
        )}

        {/* ── Transaction groups ── */}
        {groups.map((group, gi) => (
          <motion.div
            key={group.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + gi * 0.04 }}
            className="flex flex-col gap-2"
          >
            {/* Date label */}
            <div className="flex items-center gap-3 px-1">
              <p className="text-[10px] font-black text-[#3A4558] uppercase tracking-widest shrink-0">
                {group.label}
              </p>
              <div className="flex-1 h-px bg-white/[0.04]" />
            </div>

            {/* Transaction rows */}
            <div className="flex flex-col gap-1.5">
              {group.items.map((tx, i) => {
                const credit = isCredit(tx.type);
                return (
                  <motion.button
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.02 * i }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 border transition-all text-left"
                    style={{
                      background: "#0E1829",
                      borderColor: "rgba(255,255,255,0.05)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.10)";
                      (e.currentTarget as HTMLElement).style.background = "#0F1B2E";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.05)";
                      (e.currentTarget as HTMLElement).style.background = "#0E1829";
                    }}
                  >
                    {/* Icon */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: credit ? "rgba(16,185,129,0.12)" : "rgba(201,168,76,0.10)",
                        color:      credit ? "#10B981"                : "#C9A84C",
                      }}
                    >
                      {txIcon(tx.type)}
                    </div>

                    {/* Label + counterparty */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#F0F1F5] truncate">
                        {tx.counterpartyName || txLabel(tx.type)}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-[#3A4558]">{formatTime(tx.createdAt)}</p>
                        <span className="text-[#1E2A3A]">·</span>
                        {statusBadge(tx.status)}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right shrink-0">
                      <p
                        className="text-sm font-black"
                        style={{ color: credit ? "#10B981" : "#F0F1F5" }}
                      >
                        {credit ? "+" : "-"}{formatCurrency(tx.amount, tx.currency)}
                      </p>
                      {tx.fee ? (
                        <p className="text-[10px] text-[#3A4558] mt-0.5">Fee: {formatCurrency(tx.fee, tx.currency)}</p>
                      ) : (
                        <p className="text-[10px] text-[#2A3448] mt-0.5">{tx.currency}</p>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        ))}

        {/* Bottom hint */}
        {filtered.length > 0 && (
          <p className="text-[11px] text-[#2A3448] text-center pb-4">
            Showing {filtered.length} of {transactions.length} transactions · Tap any row for details
          </p>
        )}

      </div>

      {/* Transaction detail drawer */}
      <AnimatePresence>
        {selectedTx && (
          <TxDrawer tx={selectedTx} onClose={() => setSelectedTx(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
