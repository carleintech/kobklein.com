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

// ─── Design tokens — Merchant: Deep Navy ──────────────────────────────────────

const M = {
  bg:        "#0A1628",
  bg2:       "#0D1B35",
  bg3:       "#1A2555",
  card:      "#0F1E3A",
  panel:     "#102240",
  panel2:    "#132850",
  border:    "rgba(100,140,220,0.13)",
  border2:   "rgba(100,140,220,0.08)",
  border3:   "rgba(100,140,220,0.20)",
  accent:    "#6E8DAE",       // replaces teal
  accentDim: "#3A5A7A",
  gold:      "#D4AF37",
  goldL:     "#F5B77A",
  goldD:     "#A08030",
  text:      "#E6EDF7",
  muted:     "#6EB2A6",
  dimmed:    "#3A5A7A",
  success:   "#16C734",
  expense:   "#FF74D4",
} as const;

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
    <div className="rounded-xl px-3 py-2 text-xs"
      style={{ background: M.card, border: `1px solid ${M.border}` }}>
      <p className="mb-1" style={{ color: M.muted }}>{label}</p>
      <p className="font-bold" style={{ color: M.gold }}>
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
    <div className="space-y-5 pb-8" data-dashboard="merchant">

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest mb-1"
            style={{ color: M.muted }}>
            <Store className="h-3 w-3" />
            KobKlein Merchant
          </div>
          <h1 className="text-2xl font-black" style={{ color: M.text }}>
            {greeting}{name}! 🏪
          </h1>
          {profile.handle && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-black"
                style={{ background: `${M.gold}20`, color: M.gold }}>K</span>
              <span className="text-xs font-bold" style={{ color: M.gold }}>@{profile.handle}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1.5">
            {profile.planName && (
              <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full"
                style={{ background: `${M.gold}25`, color: M.gold, border: `1px solid ${M.gold}40` }}>
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
            className="p-1.5 rounded-lg transition-colors"
            style={{ background: M.panel, border: `1px solid ${M.border}`, color: M.muted }}
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
              background: `linear-gradient(135deg, ${M.bg} 0%, ${M.bg2} 40%, ${M.bg3} 70%, ${M.bg} 100%)`,
              boxShadow: `0 24px 60px -12px rgba(0,0,0,0.7), 0 0 0 1px ${M.border}`,
            }}
          >
            {/* Ambient glows */}
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-25 pointer-events-none"
              style={{ background: `radial-gradient(circle, ${M.gold} 0%, transparent 70%)`, transform: "translate(30%,-30%)" }} />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10 pointer-events-none"
              style={{ background: `radial-gradient(circle, ${M.accent} 0%, transparent 70%)`, transform: "translate(-20%,20%)" }} />

            <div className="relative p-5">
              {/* Label row */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] font-bold" style={{ color: M.muted }}>Commercial Operating Balance</p>
                  <p className="text-[10px] mt-0.5" style={{ color: M.dimmed }}>
                    ≈ <span className="font-bold">${balance > 0 ? (balance / 130).toFixed(2) : "0.00"}</span> USD
                  </p>
                </div>
                <button
                  onClick={() => setHideBalance(b => !b)}
                  className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] transition-colors"
                >
                  {hideBalance
                    ? <EyeOff className="h-3.5 w-3.5" style={{ color: M.muted }} />
                    : <Eye    className="h-3.5 w-3.5" style={{ color: M.muted }} />}
                </button>
              </div>

              {/* Balance */}
              <div className="mb-5">
                <AnimatePresence mode="wait">
                  {hideBalance ? (
                    <motion.p key="hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="text-4xl font-black tracking-widest" style={{ color: M.muted }}>
                      ●●●●●●
                    </motion.p>
                  ) : (
                    <motion.div key="shown" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {loading ? (
                        <div className="h-10 w-48 rounded-xl animate-pulse" style={{ background: M.panel }} />
                      ) : (
                        <>
                          <span className="text-4xl font-black tabular-nums"
                            style={{
                              background: `linear-gradient(135deg, ${M.goldL}, ${M.gold}, ${M.goldD})`,
                              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                            }}>
                            {animBalance.toLocaleString("fr-HT")}
                          </span>
                          <span className="text-lg font-bold ml-2" style={{ color: `${M.gold}80` }}>HTG</span>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Stat pills — all from real stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: "Today's Sales", value: loading ? null : todaySales, icon: Zap,        color: M.gold   },
                  { label: "Pending",       value: loading ? null : netToday,   icon: TrendingUp, color: M.accent },
                  { label: "Payouts",       value: loading ? null : todayFees,  icon: Receipt,    color: "#FF74D4" },
                ].map((s) => (
                  <div key={s.label}
                    className="rounded-xl px-3 py-2 flex flex-col gap-1"
                    style={{ background: `${M.panel}CC`, border: `1px solid ${M.border2}` }}>
                    <s.icon className="h-3.5 w-3.5" style={{ color: s.color }} />
                    {s.value === null ? (
                      <div className="h-4 w-16 rounded animate-pulse" style={{ background: M.panel2 }} />
                    ) : (
                      <p className="text-sm font-black tabular-nums leading-none" style={{ color: M.text }}>
                        {s.value.toLocaleString("fr-HT")}
                      </p>
                    )}
                    <p className="text-[9px] uppercase tracking-wide font-bold" style={{ color: M.dimmed }}>{s.label}</p>
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
                      ? { background: `linear-gradient(135deg, ${M.goldL}30, ${M.gold}18)`, border: `1px solid ${M.gold}50` }
                      : { background: `${M.panel}AA`, border: `1px solid ${M.border2}` }}
                  >
                    <a.icon className="h-4 w-4" style={{ color: a.gold ? M.gold : M.accent }} />
                    <span className="text-[9px] font-bold uppercase tracking-wide"
                      style={{ color: a.gold ? M.gold : M.muted }}>
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
            className="rounded-3xl overflow-hidden"
            style={{ background: `linear-gradient(160deg, ${M.card} 0%, ${M.bg} 100%)`, border: `1px solid ${M.border}` }}
          >
            {/* Tab bar */}
            <div className="flex" style={{ borderBottom: `1px solid ${M.border2}` }}>
              {(["today", "week", "month"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`flex-1 py-3.5 text-xs font-bold capitalize transition-all border-b-2`}
                  style={activeTab === t
                    ? { borderBottomColor: M.gold, color: M.gold }
                    : { borderBottomColor: "transparent", color: M.dimmed }}
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
                        <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: M.panel }} />
                      ))}
                    </div>
                  ) : currentEntries.length === 0 ? (
                    <div className="py-10 flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ background: `${M.panel}CC`, border: `1px solid ${M.border2}` }}>
                        <Receipt className="h-5 w-5" style={{ color: M.dimmed }} />
                      </div>
                      <p className="text-sm" style={{ color: M.dimmed }}>No transactions yet</p>
                      {activeTab === "today" && stats && todaySales > 0 && (
                        <p className="text-[10px]" style={{ color: M.dimmed }}>
                          {stats.todayCount} payment{stats.todayCount !== 1 ? "s" : ""} recorded today
                        </p>
                      )}
                    </div>
                  ) : (
                    currentEntries.slice(0, 8).map((entry, i) => {
                      const palette = [
                        { from: M.gold,    to: M.goldD  },
                        { from: M.accent,  to: M.accentDim },
                        { from: "#6366F1", to: "#4F46E5" },
                        { from: "#F97316", to: "#EA580C" },
                        { from: "#10B981", to: "#059669" },
                      ];
                      const col = palette[i % palette.length];
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
                          className="flex items-center gap-3 p-3 rounded-2xl transition-colors"
                          style={{ background: M.panel, border: `1px solid ${M.border2}` }}
                        >
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0"
                            style={{ background: `linear-gradient(135deg, ${col.from}, ${col.to})` }}>
                            {initial}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate" style={{ color: M.text }}>{label}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Clock className="h-2.5 w-2.5" style={{ color: M.dimmed }} />
                              <p className="text-[10px]" style={{ color: M.dimmed }}>{time}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-black" style={{ color: M.gold }}>
                              +{amt.toLocaleString("fr-HT")}
                            </p>
                            <p className="text-[10px]" style={{ color: M.muted }}>HTG</p>
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
                      className="w-full py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 mt-1"
                      style={{ color: M.muted, border: `1px solid ${M.border2}` }}
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
            className="rounded-3xl overflow-hidden"
            style={{ background: `linear-gradient(160deg, ${M.card} 0%, ${M.bg} 100%)`, border: `1px solid ${M.border}` }}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-bold" style={{ color: M.text }}>Sales Overview</p>
                <span className="text-[10px]" style={{ color: M.dimmed }}>Last 7 days</span>
              </div>

              {loading ? (
                <div className="h-40 rounded-2xl animate-pulse mt-4" style={{ background: M.panel }} />
              ) : (
                <>
                  <div className="flex items-end gap-4 mb-4 mt-2">
                    <div>
                      <p className="text-2xl font-black tabular-nums"
                        style={{
                          background: `linear-gradient(135deg, ${M.goldL}, ${M.gold})`,
                          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                        }}>
                        {weekSales.toLocaleString("fr-HT")}
                      </p>
                      <p className="text-[10px]" style={{ color: M.dimmed }}>Week total (HTG)</p>
                    </div>
                  </div>

                  <div className="h-40 min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} barCategoryGap="30%">
                        <XAxis dataKey="day" tick={{ fontSize: 9, fill: M.dimmed }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: `${M.accent}0D` }} />
                        <Bar dataKey="sales" radius={[5, 5, 0, 0]} maxBarSize={28}>
                          {chartData.map((d, i) => (
                            <Cell key={i}
                              fill={d.isToday ? M.gold : M.accent}
                              fillOpacity={d.isToday ? 1 : 0.55}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex items-center gap-4 mt-1">
                    {[{ color: M.accent, label: "Past days" }, { color: M.gold, label: "Today" }].map(l => (
                      <div key={l.label} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-sm" style={{ background: l.color }} />
                        <span className="text-[10px]" style={{ color: M.dimmed }}>{l.label}</span>
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
            className="rounded-3xl overflow-hidden"
            style={{ background: `linear-gradient(160deg, ${M.card} 0%, ${M.bg} 100%)`, border: `1px solid ${M.border}` }}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold" style={{ color: M.text }}>Monthly Overview</p>
                <span className="text-[10px]" style={{ color: M.dimmed }}>Last 30 days</span>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-10 rounded-xl animate-pulse" style={{ background: M.panel }} />)}
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: M.muted }}>Gross Sales</p>
                    <p className="text-3xl font-black tabular-nums"
                      style={{
                        background: `linear-gradient(135deg, ${M.goldL}, ${M.gold})`,
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
                          <Line type="monotone" dataKey="v" stroke={M.gold} strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div className="space-y-2">
                    {[
                      { label: "Total Fees",   value: monthFee.toLocaleString("fr-HT") + " HTG",               color: "#9FB8E0", icon: Receipt     },
                      { label: "Net Revenue",  value: monthNet.toLocaleString("fr-HT") + " HTG",               color: M.success, icon: TrendingUp  },
                      { label: "Transactions", value: (settlement?.transactionCount ?? 0).toString() + " tx",  color: M.accent,  icon: Zap         },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center gap-3 p-2.5 rounded-xl"
                        style={{ background: `${M.panel}CC`, border: `1px solid ${M.border2}` }}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `${s.color}18` }}>
                          <s.icon className="h-3.5 w-3.5" style={{ color: s.color }} />
                        </div>
                        <p className="text-[10px] flex-1" style={{ color: M.dimmed }}>{s.label}</p>
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
            className="rounded-3xl overflow-hidden"
            style={{ background: `linear-gradient(160deg, ${M.card} 0%, ${M.bg} 100%)`, border: `1px solid ${M.border}` }}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold" style={{ color: M.text }}>Your K-Pay QR</p>
                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `${M.success}18`, color: M.success, border: `1px solid ${M.success}30` }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: M.success }} />
                  Active
                </span>
              </div>

              <div className="flex flex-col items-center gap-3 mb-4">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push("/merchant/qr")}
                  className="relative w-28 h-28 rounded-2xl flex items-center justify-center"
                  style={{ border: `2px dashed ${M.accent}50`, background: `${M.accent}08` }}
                >
                  <QrCode className="h-14 w-14" style={{ color: `${M.accent}66` }} />
                  {[
                    "top-1 left-1 border-t-2 border-l-2 rounded-tl-lg",
                    "top-1 right-1 border-t-2 border-r-2 rounded-tr-lg",
                    "bottom-1 left-1 border-b-2 border-l-2 rounded-bl-lg",
                    "bottom-1 right-1 border-b-2 border-r-2 rounded-br-lg",
                  ].map((cls, i) => (
                    <div key={i} className={`absolute w-4 h-4 ${cls}`} style={{ borderColor: M.gold }} />
                  ))}
                </motion.button>
                <div className="text-center">
                  <p className="text-xs font-bold" style={{ color: M.text }}>
                    {profile.handle ? `@${profile.handle}` : profile.firstName || "Merchant"}
                  </p>
                  <button
                    onClick={copyId}
                    className="flex items-center gap-1 mt-0.5 text-[10px] transition-colors mx-auto"
                    style={{ color: M.dimmed }}
                  >
                    <span className="font-mono">ID: {profile.id.slice(0, 8)}…</span>
                    {copied
                      ? <CheckCircle2 className="h-3 w-3" style={{ color: M.success }} />
                      : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => router.push("/merchant/qr")}
                  className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${M.goldL} 0%, ${M.gold} 50%, ${M.goldD} 100%)`,
                    boxShadow: `0 8px 24px -4px ${M.gold}55`,
                    color: M.bg,
                  }}
                >
                  <QrCode className="h-4 w-4" />
                  Open Full Screen
                </motion.button>
                <button
                  onClick={() => router.push("/merchant/pos")}
                  className="w-full py-2.5 rounded-2xl font-semibold text-xs transition-all"
                  style={{ color: M.muted, border: `1px solid ${M.border}` }}
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
              className="w-full rounded-2xl overflow-hidden text-left"
              style={{ background: `linear-gradient(135deg, ${M.accent}14, ${M.accent}06)`, border: `1px solid ${M.accent}30` }}
            >
              <div className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${M.accent}18` }}>
                  <Shield className="h-4 w-4" style={{ color: M.accent }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold" style={{ color: M.text }}>Verify Your Business</p>
                  <p className="text-xs" style={{ color: M.dimmed }}>Unlock higher payment limits</p>
                </div>
                <ArrowUpRight className="h-4 w-4" style={{ color: M.accent }} />
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
              className="w-full rounded-2xl overflow-hidden text-left"
              style={{ background: `linear-gradient(135deg, ${M.gold}14, ${M.gold}06)`, border: `1px solid ${M.gold}30` }}
            >
              <div className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${M.gold}18` }}>
                  <Crown className="h-4 w-4" style={{ color: M.gold }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold" style={{ color: M.text }}>Merchant Pro</p>
                  <p className="text-xs" style={{ color: M.dimmed }}>Lower fees · Analytics · Priority support</p>
                </div>
                <ArrowUpRight className="h-4 w-4" style={{ color: M.gold }} />
              </div>
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
