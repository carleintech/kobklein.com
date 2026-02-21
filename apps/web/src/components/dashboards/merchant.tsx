"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { kkGet } from "@/lib/kobklein-api";
import { KIdCard } from "@/components/kid-card";
import {
  Store, QrCode, Monitor, Banknote, BarChart3, TrendingUp,
  RefreshCw, Eye, EyeOff, CheckCircle2, Crown, Shield,
  ArrowUpRight, Receipt, ChevronRight, Zap, Copy,
  Clock, AlertCircle,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  profile: {
    id: string;
    firstName?: string;
    handle?: string;
    kycTier: number;
    kycStatus?: string;
    planSlug?: string;
    planName?: string;
  };
};

// Real shape from GET /v1/merchant/stats (or /v1/merchant/today alias)
type MerchantStats = {
  todaySales: number;
  todayCount: number;
  todayFees: number;
  balance: number;
  netToday: number;
  weekSales: number;
  monthSales: number;
};

// Real shape from GET /v1/merchant/reports/settlement
type SettlementReport = {
  ok: boolean;
  merchantName?: string;
  period: { from: string; to: string };
  transactionCount: number;
  totalGross: number;
  totalFee: number;
  totalNet: number;
  entries: {
    id: string;
    amount: number;
    type: string;
    reference?: string;
    createdAt: string;
  }[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  const startRef = useRef<number | null>(null);
  useEffect(() => {
    if (!target) { setVal(0); return; }
    startRef.current = null;
    let raf: number;
    function tick(ts: number) {
      if (!startRef.current) startRef.current = ts;
      const p = Math.min((ts - startRef.current) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * ease));
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

// Returns last N ISO date strings YYYY-MM-DD
function lastNDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toISOString().slice(0, 10);
  });
}

// Short label: "Mon", "Tue" etc. from YYYY-MM-DD
function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short" });
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function thirtyDaysAgoISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs border border-[#0D9E8A]/[0.15]"
      style={{ background: "#0B1A16" }}>
      <p className="text-[#5A7A6A] mb-1">{label}</p>
      <p className="font-bold text-[#C9A84C]">
        {Number(payload[0].value).toLocaleString("fr-HT")} HTG
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MerchantDashboard({ profile }: Props) {
  const router = useRouter();

  // ── State ──────────────────────────────────────────────────────────────────
  const [stats, setStats]           = useState<MerchantStats | null>(null);
  const [settlement, setSettlement] = useState<SettlementReport | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);
  const [activeTab, setActiveTab]   = useState<"today" | "week" | "month">("today");
  const [copied, setCopied]         = useState(false);

  // ── Data loading ───────────────────────────────────────────────────────────
  const todayStr   = todayISO();
  const monthStart = thirtyDaysAgoISO();

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      // v1/merchant/stats is the primary endpoint — has today + week + month rolled up
      // v1/merchant/reports/settlement for full entry list (last 30 days)
      const [statsRes, settlementRes] = await Promise.allSettled([
        kkGet<MerchantStats>("v1/merchant/stats"),
        kkGet<SettlementReport>(
          `v1/merchant/reports/settlement?from=${monthStart}&to=${todayStr}`
        ),
      ]);

      if (statsRes.status === "fulfilled") {
        setStats(statsRes.value);
      } else {
        console.error("[MerchantDashboard] stats error:", statsRes.reason);
        setError("Could not load merchant stats.");
      }

      if (settlementRes.status === "fulfilled") {
        setSettlement(settlementRes.value);
      } else {
        // Settlement may 500 if merchant record doesn't exist yet — not fatal
        console.warn("[MerchantDashboard] settlement error:", settlementRes.reason);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [monthStart, todayStr]);

  useEffect(() => { load(); }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load(true);
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const balance    = stats?.balance    ?? 0;
  const todaySales = stats?.todaySales ?? 0;
  const todayFees  = stats?.todayFees  ?? 0;
  const netToday   = stats?.netToday   ?? 0;
  const weekSales  = stats?.weekSales  ?? 0;
  const monthSales = stats?.monthSales ?? 0;
  const allEntries = settlement?.entries ?? [];

  // Settlement aggregates (fall back to stats totals if settlement missing)
  const monthGross = settlement?.totalGross ?? monthSales;
  const monthFee   = settlement?.totalFee   ?? 0;
  const monthNet   = settlement?.totalNet   ?? monthSales;

  // Animated counters
  const animBalance = useCountUp(loading ? 0 : balance);
  const animToday   = useCountUp(loading ? 0 : todaySales);
  const animMonth   = useCountUp(loading ? 0 : monthGross);

  // Build bar chart: group settlement entries by day for last 7 days
  const days7 = lastNDays(7);
  const weekChartData = days7.map((day) => {
    const dayEntries = allEntries.filter(e => e.createdAt?.slice(0, 10) === day);
    const sales = dayEntries.reduce((sum, e) => sum + Math.abs(Number(e.amount ?? 0)), 0);
    return { day: dayLabel(day), sales, isToday: day === todayISO() };
  });

  // If no settlement entries, seed today's bar from stats
  const hasChartData = weekChartData.some(d => d.sales > 0);
  const chartData = hasChartData ? weekChartData : days7.map((day, i) => ({
    day: dayLabel(day),
    sales: day === todayISO() ? todaySales : 0,
    isToday: day === todayISO(),
  }));

  // Sparkline from chart data
  const sparkData = chartData.map((d, i) => ({ i, v: d.sales }));

  // Filter entries per active tab
  const weekStart = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  })();

  const todayEntries = allEntries.filter(e => e.createdAt?.slice(0, 10) === todayStr);
  const weekEntries  = allEntries.filter(e => {
    const d = e.createdAt?.slice(0, 10);
    return d && d >= weekStart && d <= todayStr;
  });
  const monthEntries = allEntries;

  const currentEntries =
    activeTab === "today" ? todayEntries :
    activeTab === "week"  ? weekEntries  : monthEntries;

  // Transaction count per tab (fall back to stats counts when no entries)
  const txCount =
    activeTab === "today" ? (todayEntries.length || stats?.todayCount || 0) :
    activeTab === "week"  ? weekEntries.length :
    (monthEntries.length || settlement?.transactionCount || 0);

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjou" : hour < 17 ? "Bon apremidi" : "Bonswa";
  const name = profile.firstName ? `, ${profile.firstName}` : "";

  function copyId() {
    navigator.clipboard.writeText(profile.id).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 pb-8">

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <div className="flex items-center gap-1.5 text-[10px] text-[#5A7A6A] font-bold uppercase tracking-widest mb-1">
            <Store className="h-3 w-3" />
            KobKlein Merchant
          </div>
          <h1 className="text-2xl font-black text-[#F0F1F5]">
            {greeting}{name}! 🏪
          </h1>
          {profile.handle && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-4 h-4 rounded bg-[#C9A84C]/20 flex items-center justify-center text-[8px] font-black text-[#C9A84C]">K</span>
              <span className="text-xs font-bold text-[#C9A84C]">@{profile.handle}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1.5">
            {profile.planName && (
              <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full"
                style={{ background: "rgba(201,168,76,0.15)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.25)" }}>
                <Crown className="h-2.5 w-2.5" />{profile.planName}
              </span>
            )}
            {profile.kycTier >= 2 ? (
              <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full"
                style={{ background: "rgba(16,185,129,0.12)", color: "#10B981", border: "1px solid rgba(16,185,129,0.2)" }}>
                <CheckCircle2 className="h-2.5 w-2.5" />Verified
              </span>
            ) : (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.2)" }}>
                KYC Pending
              </span>
            )}
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleRefresh}
            className="p-1.5 rounded-lg bg-[#0E2018] border border-[#0D9E8A]/[0.12] text-[#5A7A6A] hover:text-[#0D9E8A] transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </motion.button>
        </div>
      </motion.div>

      {/* ── K-ID Identity Card ─────────────────────────────────────── */}
      <KIdCard compact profile={profile} />

      {/* ── ERROR BANNER ───────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl border border-red-500/[0.20] p-4 flex items-center gap-3"
            style={{ background: "rgba(239,68,68,0.06)" }}
          >
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-red-400">{error}</p>
              <p className="text-[10px] text-red-400/60 mt-0.5">
                Make sure your account has merchant status enabled.
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="text-[10px] text-red-400/70 hover:text-red-400 transition-colors shrink-0"
            >
              Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 2-COL LAYOUT ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-5">

        {/* LEFT COLUMN */}
        <div className="space-y-5">

          {/* ── BALANCE HERO ─────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="relative rounded-3xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #071A14 0%, #0C2A1E 40%, #0F3226 70%, #071A14 100%)",
              boxShadow: "0 24px 60px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(13,158,138,0.15)",
            }}
          >
            {/* Ambient glows */}
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20 pointer-events-none"
              style={{ background: "radial-gradient(circle, #C9A84C 0%, transparent 70%)", transform: "translate(30%,-30%)" }} />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10 pointer-events-none"
              style={{ background: "radial-gradient(circle, #0D9E8A 0%, transparent 70%)", transform: "translate(-20%,20%)" }} />

            <div className="relative p-5">
              {/* Label row */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-[#5A7A6A] font-bold">Merchant Balance</p>
                  <p className="text-[10px] text-[#4A6A5A] mt-0.5">
                    ≈ <span className="font-bold">${balance > 0 ? (balance / 130).toFixed(2) : "0.00"}</span> USD
                  </p>
                </div>
                <button
                  onClick={() => setHideBalance(b => !b)}
                  className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] transition-colors"
                >
                  {hideBalance
                    ? <EyeOff className="h-3.5 w-3.5 text-[#5A7A6A]" />
                    : <Eye    className="h-3.5 w-3.5 text-[#5A7A6A]" />}
                </button>
              </div>

              {/* Balance */}
              <div className="mb-5">
                <AnimatePresence mode="wait">
                  {hideBalance ? (
                    <motion.p key="hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="text-4xl font-black text-[#5A7A6A] tracking-widest">
                      ●●●●●●
                    </motion.p>
                  ) : (
                    <motion.div key="shown" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {loading ? (
                        <div className="h-10 w-48 rounded-xl animate-pulse bg-[#0E2018]" />
                      ) : (
                        <>
                          <span className="text-4xl font-black tabular-nums"
                            style={{
                              background: "linear-gradient(135deg, #E2CA6E, #C9A84C, #A08030)",
                              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                            }}>
                            {animBalance.toLocaleString("fr-HT")}
                          </span>
                          <span className="text-lg font-bold text-[#C9A84C]/50 ml-2">HTG</span>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Stat pills — all from real stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: "Today Sales", value: loading ? null : todaySales, icon: Zap,        color: "#C9A84C" },
                  { label: "Net Today",   value: loading ? null : netToday,   icon: TrendingUp, color: "#0D9E8A" },
                  { label: "Today Fees",  value: loading ? null : todayFees,  icon: Receipt,    color: "#6366F1" },
                ].map((s) => (
                  <div key={s.label}
                    className="rounded-xl px-3 py-2 flex flex-col gap-1"
                    style={{ background: "rgba(13,158,138,0.06)", border: "1px solid rgba(13,158,138,0.10)" }}>
                    <s.icon className="h-3.5 w-3.5" style={{ color: s.color }} />
                    {s.value === null ? (
                      <div className="h-4 w-16 rounded animate-pulse bg-[#0E2018]" />
                    ) : (
                      <p className="text-sm font-black text-[#E0E4EE] tabular-nums leading-none">
                        {s.value.toLocaleString("fr-HT")}
                      </p>
                    )}
                    <p className="text-[9px] text-[#4A6A5A] uppercase tracking-wide font-bold">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "K-Scan",   icon: QrCode,    href: "/merchant/qr",       gold: true  },
                  { label: "POS",      icon: Monitor,   href: "/merchant/pos",       gold: false },
                  { label: "Cash Out", icon: Banknote,  href: "/merchant/withdraw",  gold: false },
                  { label: "History",  icon: BarChart3, href: "/merchant/sales",     gold: false },
                ].map((a) => (
                  <motion.button
                    key={a.label}
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push(a.href)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all"
                    style={a.gold
                      ? { background: "linear-gradient(135deg, rgba(226,202,110,0.2), rgba(201,168,76,0.1))", border: "1px solid rgba(201,168,76,0.3)" }
                      : { background: "rgba(13,158,138,0.06)", border: "1px solid rgba(13,158,138,0.10)" }}
                  >
                    <a.icon className="h-4 w-4" style={{ color: a.gold ? "#C9A84C" : "#0D9E8A" }} />
                    <span className="text-[9px] font-bold uppercase tracking-wide"
                      style={{ color: a.gold ? "#C9A84C" : "#5A8A7A" }}>
                      {a.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── TRANSACTION ENTRIES ──────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl overflow-hidden border border-[#0D9E8A]/[0.12]"
            style={{ background: "linear-gradient(160deg, #0B1A16 0%, #081410 100%)" }}
          >
            {/* Tab bar */}
            <div className="flex border-b border-[#0D9E8A]/[0.08]">
              {(["today", "week", "month"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`flex-1 py-3.5 text-xs font-bold capitalize transition-all border-b-2 ${
                    activeTab === t
                      ? "border-[#C9A84C] text-[#C9A84C]"
                      : "border-transparent text-[#4A6A5A] hover:text-[#7A9A8A]"
                  }`}
                >
                  {t === "today" ? "Today" : t === "week" ? "This Week" : "This Month"}
                </button>
              ))}
            </div>

            <div className="p-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  className="space-y-2"
                >
                  {loading ? (
                    <div className="space-y-2">
                      {[1,2,3].map(i => (
                        <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "#0E2018" }} />
                      ))}
                    </div>
                  ) : currentEntries.length === 0 ? (
                    <div className="py-10 flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ background: "rgba(13,158,138,0.06)", border: "1px solid rgba(13,158,138,0.10)" }}>
                        <Receipt className="h-5 w-5 text-[#3A5A4A]" />
                      </div>
                      <p className="text-sm text-[#4A6A5A]">No transactions yet</p>
                      {activeTab === "today" && stats && todaySales > 0 && (
                        <p className="text-[10px] text-[#3A5A4A]">
                          {stats.todayCount} payment{stats.todayCount !== 1 ? "s" : ""} recorded today
                        </p>
                      )}
                    </div>
                  ) : (
                    currentEntries.slice(0, 8).map((entry, i) => {
                      const palette = [
                        { from: "#C9A84C", to: "#9F7F2C" },
                        { from: "#0D9E8A", to: "#0B7A6A" },
                        { from: "#6366F1", to: "#4F46E5" },
                        { from: "#F97316", to: "#EA580C" },
                        { from: "#10B981", to: "#059669" },
                      ];
                      const col = palette[i % palette.length];
                      // Use reference as display label (e.g. "pos_XXXXX")
                      const label = entry.reference
                        ? entry.reference.replace(/_/g, " ").toUpperCase()
                        : entry.type?.replace(/_/g, " ") || "Payment";
                      const initial = label.slice(0, 1).toUpperCase();
                      const time = entry.createdAt
                        ? new Date(entry.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                        : "—";
                      const amt = Math.abs(Number(entry.amount ?? 0));
                      return (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="flex items-center gap-3 p-3 rounded-2xl border border-[#0D9E8A]/[0.08] hover:border-[#0D9E8A]/[0.15] transition-colors"
                          style={{ background: "#0E2018" }}
                        >
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0"
                            style={{ background: `linear-gradient(135deg, ${col.from}, ${col.to})` }}>
                            {initial}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[#E0E4EE] truncate">{label}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Clock className="h-2.5 w-2.5 text-[#3A5A4A]" />
                              <p className="text-[10px] text-[#4A6A5A]">{time}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-black text-[#C9A84C]">
                              +{amt.toLocaleString("fr-HT")}
                            </p>
                            <p className="text-[10px] text-[#5A7A6A]">HTG</p>
                          </div>
                        </motion.div>
                      );
                    })
                  )}

                  {currentEntries.length > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => router.push("/merchant/sales")}
                      className="w-full py-3 rounded-2xl text-xs font-bold text-[#5A7A6A] border border-[#0D9E8A]/[0.10] hover:border-[#0D9E8A]/[0.20] hover:text-[#0D9E8A] transition-all flex items-center justify-center gap-1.5 mt-1"
                    >
                      View Full History <ChevronRight className="h-3.5 w-3.5" />
                    </motion.button>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* ── SALES CHART ──────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-3xl overflow-hidden border border-[#0D9E8A]/[0.12]"
            style={{ background: "linear-gradient(160deg, #0B1A16 0%, #081410 100%)" }}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-bold text-[#E0E4EE]">Sales Performance</p>
                <span className="text-[10px] text-[#4A6A5A]">Last 7 days</span>
              </div>

              {loading ? (
                <div className="h-40 rounded-2xl animate-pulse mt-4" style={{ background: "#0E2018" }} />
              ) : (
                <>
                  <div className="flex items-end gap-4 mb-4 mt-2">
                    <div>
                      <p className="text-2xl font-black tabular-nums"
                        style={{
                          background: "linear-gradient(135deg, #E2CA6E, #C9A84C)",
                          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                        }}>
                        {weekSales.toLocaleString("fr-HT")}
                      </p>
                      <p className="text-[10px] text-[#4A6A5A]">Week total (HTG)</p>
                    </div>
                  </div>

                  <div className="h-40 min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} barCategoryGap="30%">
                        <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#4A6A5A" }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(13,158,138,0.05)" }} />
                        <Bar dataKey="sales" radius={[5, 5, 0, 0]} maxBarSize={28}>
                          {chartData.map((d, i) => (
                            <Cell key={i}
                              fill={d.isToday ? "#C9A84C" : "#0D9E8A"}
                              fillOpacity={d.isToday ? 1 : 0.55}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex items-center gap-4 mt-1">
                    {[{ color: "#0D9E8A", label: "Past days" }, { color: "#C9A84C", label: "Today" }].map(l => (
                      <div key={l.label} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-sm" style={{ background: l.color }} />
                        <span className="text-[10px] text-[#4A6A5A]">{l.label}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-5">

          {/* ── MONTHLY OVERVIEW ─────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl overflow-hidden border border-[#0D9E8A]/[0.12]"
            style={{ background: "linear-gradient(160deg, #0B1A16 0%, #081410 100%)" }}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-[#E0E4EE]">Monthly Overview</p>
                <span className="text-[10px] text-[#4A6A5A]">Last 30 days</span>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-10 rounded-xl animate-pulse" style={{ background: "#0E2018" }} />)}
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <p className="text-[10px] text-[#5A7A6A] uppercase tracking-widest mb-1">Gross Sales</p>
                    <p className="text-3xl font-black tabular-nums"
                      style={{
                        background: "linear-gradient(135deg, #E2CA6E, #C9A84C)",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                      }}>
                      {animMonth.toLocaleString("fr-HT")}
                      <span className="text-base font-bold ml-1 opacity-50">HTG</span>
                    </p>
                  </div>

                  {/* Sparkline */}
                  {sparkData.some(d => d.v > 0) && (
                    <div className="h-14 mb-4 min-w-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sparkData}>
                          <Line type="monotone" dataKey="v" stroke="#C9A84C" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div className="space-y-2">
                    {[
                      { label: "Total Fees",   value: monthFee.toLocaleString("fr-HT") + " HTG",               color: "#6366F1", icon: Receipt     },
                      { label: "Net Revenue",  value: monthNet.toLocaleString("fr-HT") + " HTG",               color: "#10B981", icon: TrendingUp  },
                      { label: "Transactions", value: (settlement?.transactionCount ?? 0).toString() + " tx",  color: "#0D9E8A", icon: Zap         },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center gap-3 p-2.5 rounded-xl"
                        style={{ background: "rgba(13,158,138,0.05)", border: "1px solid rgba(13,158,138,0.08)" }}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `${s.color}18` }}>
                          <s.icon className="h-3.5 w-3.5" style={{ color: s.color }} />
                        </div>
                        <p className="text-[10px] text-[#4A6A5A] flex-1">{s.label}</p>
                        <p className="text-sm font-black tabular-nums" style={{ color: s.color }}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* ── QR CODE CARD ─────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-3xl overflow-hidden border border-[#0D9E8A]/[0.12]"
            style={{ background: "linear-gradient(160deg, #0B1A16 0%, #081410 100%)" }}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-[#E0E4EE]">Your K-Pay QR</p>
                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(16,185,129,0.12)", color: "#10B981", border: "1px solid rgba(16,185,129,0.2)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </span>
              </div>

              <div className="flex flex-col items-center gap-3 mb-4">
                {/* QR placeholder — tap to open full screen QR */}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push("/merchant/qr")}
                  className="relative w-28 h-28 rounded-2xl flex items-center justify-center"
                  style={{ border: "2px dashed rgba(13,158,138,0.30)", background: "rgba(13,158,138,0.05)" }}
                >
                  <QrCode className="h-14 w-14 text-[#0D9E8A]/40" />
                  {[
                    "top-1 left-1 border-t-2 border-l-2 rounded-tl-lg",
                    "top-1 right-1 border-t-2 border-r-2 rounded-tr-lg",
                    "bottom-1 left-1 border-b-2 border-l-2 rounded-bl-lg",
                    "bottom-1 right-1 border-b-2 border-r-2 rounded-br-lg",
                  ].map((cls, i) => (
                    <div key={i} className={`absolute w-4 h-4 border-[#C9A84C] ${cls}`} />
                  ))}
                </motion.button>
                <div className="text-center">
                  <p className="text-xs font-bold text-[#E0E4EE]">
                    {profile.handle ? `@${profile.handle}` : profile.firstName || "Merchant"}
                  </p>
                  <button
                    onClick={copyId}
                    className="flex items-center gap-1 mt-0.5 text-[10px] text-[#4A6A5A] hover:text-[#C9A84C] transition-colors mx-auto"
                  >
                    <span className="font-mono">ID: {profile.id.slice(0, 8)}…</span>
                    {copied
                      ? <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => router.push("/merchant/qr")}
                  className="w-full py-3 rounded-2xl font-bold text-sm text-[#050F0C] flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: "linear-gradient(135deg, #E2CA6E 0%, #C9A84C 50%, #9F7F2C 100%)",
                    boxShadow: "0 8px 24px -4px rgba(201,168,76,0.35)",
                  }}
                >
                  <QrCode className="h-4 w-4" />
                  Open Full Screen
                </motion.button>
                <button
                  onClick={() => router.push("/merchant/pos")}
                  className="w-full py-2.5 rounded-2xl font-semibold text-xs text-[#5A7A6A] border border-[#0D9E8A]/[0.12] hover:bg-[#0E2018] hover:text-[#A0BBA8] transition-all"
                >
                  Open POS Terminal
                </button>
              </div>
            </div>
          </motion.div>

          {/* ── KYC BANNER ───────────────────────────────────────────── */}
          {profile.kycTier < 2 && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => router.push("/verify")}
              className="w-full rounded-2xl overflow-hidden border border-[#0D9E8A]/[0.20] text-left"
              style={{ background: "linear-gradient(135deg, rgba(13,158,138,0.08), rgba(13,158,138,0.03))" }}
            >
              <div className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0D9E8A]/10 flex items-center justify-center shrink-0">
                  <Shield className="h-4 w-4 text-[#0D9E8A]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#E0E4EE]">Verify Your Business</p>
                  <p className="text-xs text-[#4A6A5A]">Unlock higher payment limits</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-[#0D9E8A]" />
              </div>
            </motion.button>
          )}

          {/* ── PLAN BANNER ──────────────────────────────────────────── */}
          {!profile.planSlug && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => router.push("/settings/plan")}
              className="w-full rounded-2xl overflow-hidden border border-[#C9A84C]/[0.20] text-left"
              style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.08), rgba(201,168,76,0.03))" }}
            >
              <div className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center shrink-0">
                  <Crown className="h-4 w-4 text-[#C9A84C]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#E0E4EE]">Merchant Pro</p>
                  <p className="text-xs text-[#4A6A5A]">Lower fees · Analytics · Priority support</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-[#C9A84C]" />
              </div>
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
