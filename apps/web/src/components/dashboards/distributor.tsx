"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { kkGet } from "@/lib/kobklein-api";
import { KIdCard } from "@/components/kid-card";
import {
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  AlertTriangle,
  Zap,
  TrendingUp,
  Wallet,
  Users,
  BarChart3,
  ArrowRight,
  MapPin,
  Activity,
  ChevronRight,
  Copy,
  CheckCircle2,
  Clock,
  Shield,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  profile: {
    id: string;
    firstName?: string;
    lastName?: string;
    handle?: string;
    kycTier: number;
    kycStatus?: string;
    planSlug?: string;
    planName?: string;
  };
};

// Real shape from GET /v1/distributor/dashboard
type AgentDashboard = {
  distributorId: string | null;
  businessName: string | null;
  status: string;
  floatBalance: number;
  totalFloat: number;
  todayTransactions: number;
  todayCommissions: number;
  commissionRate: number;
  settlements: {
    id: string;
    amount: number;
    currency: string;
    type: string;
    createdAt: string;
  }[];
};

// Real shape from GET /v1/distributor/transactions
type LedgerEntry = {
  id: string;
  amount: number;
  type: string;
  createdAt: string;
};

// ─── Design tokens ────────────────────────────────────────────────────────────

const BG = "#050F0C";
const CARD = "#0B1A16";
const PANEL = "#0E2018";
const PANEL2 = "#122B22";
const BORDER = "rgba(13,158,138,0.12)";
const TEAL = "#0D9E8A";
const TEAL_BRIGHT = "#14C9B0";
const GOLD_START = "#E2CA6E";
const GOLD_MID = "#C9A84C";
const GOLD_END = "#A08030";
const LOW_FLOAT_THRESHOLD = 5_000;

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 900) {
  const [val, setVal] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    fromRef.current = val;
    startRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(fromRef.current + (target - fromRef.current) * ease));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return val;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString("fr-HT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtShort = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toFixed(0);
};

const txnLabel = (type: string) => {
  const map: Record<string, string> = {
    cash_in: "Cash-In",
    cash_in_debit: "Cash-In",
    cash_in_credit: "Cash-In Credit",
    cash_out: "Cash-Out",
    cash_out_debit: "Cash-Out",
    cash_out_credit: "Cash-Out Credit",
    commission: "Commission",
    float_transfer: "Float Transfer",
  };
  return map[type] ?? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const isCashIn = (type: string) =>
  type === "cash_in" || type === "cash_in_debit" || type === "cash_in_credit";

// Build 7-day chart from settlements
function buildWeeklyChart(
  settlements: AgentDashboard["settlements"],
  txns: LedgerEntry[],
): { day: string; cashIn: number; cashOut: number; commission: number }[] {
  const days: { day: string; cashIn: number; cashOut: number; commission: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);

    const label = d.toLocaleDateString("en", { weekday: "short" });

    // Use settlements (from /dashboard) where available
    const daySett = settlements.filter((s) => {
      const t = new Date(s.createdAt);
      return t >= d && t < next;
    });
    const cashIn = daySett.filter((s) => s.type === "cash_in").reduce((a, s) => a + s.amount, 0);
    const cashOut = daySett.filter((s) => s.type === "cash_out").reduce((a, s) => a + s.amount, 0);

    // Commission from ledger
    const dayComm = txns.filter((t) => {
      const ts = new Date(t.createdAt);
      return ts >= d && ts < next && t.type === "commission";
    });
    const commission = dayComm.reduce((a, t) => a + Math.abs(t.amount), 0);

    days.push({ day: label, cashIn, cashOut, commission });
  }
  return days;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color = TEAL,
  delay = 0,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16 }}
      className="p-4 flex flex-col gap-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
          {label}
        </span>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${color}22` }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-bold text-white leading-none">{value}</div>
      {sub && (
        <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
          {sub}
        </div>
      )}
    </motion.div>
  );
}

function TxnRow({ s, index }: { s: AgentDashboard["settlements"][0]; index: number }) {
  const isIn = s.type === "cash_in";
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      style={{ borderBottom: `1px solid ${BORDER}` }}
      className="flex items-center gap-3 py-3 last:border-0"
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: isIn ? "rgba(13,158,138,0.15)" : "rgba(239,68,68,0.12)" }}
      >
        {isIn ? (
          <ArrowDownLeft className="h-4 w-4" style={{ color: TEAL_BRIGHT }} />
        ) : (
          <ArrowUpRight className="h-4 w-4 text-red-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">
          {txnLabel(s.type)}
        </div>
        <div className="text-[11px] flex items-center gap-1" style={{ color: "rgba(255,255,255,0.35)" }}>
          <Clock className="h-2.5 w-2.5" />
          {new Date(s.createdAt).toLocaleString("fr-HT", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
      <div
        className="text-sm font-bold tabular-nums"
        style={{ color: isIn ? TEAL_BRIGHT : "#f87171" }}
      >
        {isIn ? "+" : "-"}
        {fmt(s.amount)}
        <span className="text-[10px] font-normal ml-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
          {s.currency}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Custom tooltip for recharts ──────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{ background: PANEL2, border: `1px solid ${BORDER}`, borderRadius: 10 }}
      className="p-3 text-xs space-y-1 shadow-xl"
    >
      <div className="font-semibold text-white mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: "rgba(255,255,255,0.6)" }}>{p.name}:</span>
          <span className="font-bold text-white">{fmtShort(p.value)} HTG</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DistributorDashboard({ profile }: Props) {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<AgentDashboard | null>(null);
  const [txns, setTxns] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hideBalance, setHideBalance] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview");

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const [dashRes, txnsRes] = await Promise.allSettled([
        kkGet<AgentDashboard>("v1/distributor/dashboard"),
        kkGet<LedgerEntry[]>("v1/distributor/transactions"),
      ]);

      if (dashRes.status === "fulfilled") setDashboard(dashRes.value);
      else setError("Could not load agent dashboard.");

      if (txnsRes.status === "fulfilled") setTxns(txnsRes.value);
    } catch {
      setError("Could not load agent dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const floatBalance = dashboard?.floatBalance ?? 0;
  const animatedBalance = useCountUp(hideBalance ? 0 : floatBalance);
  const animatedCommissions = useCountUp(dashboard?.todayCommissions ?? 0);
  const isLowFloat = floatBalance > 0 && floatBalance < LOW_FLOAT_THRESHOLD;
  const isPending = dashboard?.status === "pending" || dashboard?.distributorId === null;

  const chartData = dashboard
    ? buildWeeklyChart(dashboard.settlements, txns)
    : Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
          day: d.toLocaleDateString("en", { weekday: "short" }),
          cashIn: 0,
          cashOut: 0,
          commission: 0,
        };
      });

  const copyHandle = () => {
    if (!profile.handle) return;
    navigator.clipboard.writeText(`@${profile.handle}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // USD estimate (rough: 1 USD ≈ 132 HTG)
  const usdEstimate = (floatBalance / 132).toFixed(2);

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: BG, color: "white", fontFamily: "inherit" }}
    >
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-28">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-start justify-between"
        >
          <div>
            <div
              className="text-[11px] font-medium flex items-center gap-1.5 mb-1"
              style={{ color: TEAL }}
            >
              <MapPin className="h-3 w-3" />
              KobKlein K-Agent
            </div>
            <h1 className="text-xl font-bold text-white leading-tight">
              {dashboard?.businessName ||
                (profile.firstName
                  ? `${profile.firstName}${profile.lastName ? ` ${profile.lastName}` : ""}`
                  : "Agent Dashboard")}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {profile.handle && (
                <button
                  type="button"
                  onClick={copyHandle}
                  className="flex items-center gap-1 text-[11px] transition-colors"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  @{profile.handle}
                  {copied ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              )}
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: isPending
                    ? "rgba(234,179,8,0.15)"
                    : "rgba(13,158,138,0.15)",
                  color: isPending ? "#EAB308" : TEAL_BRIGHT,
                }}
              >
                {isPending ? "Pending Activation" : "Active"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              onClick={() => load(true)}
              whileTap={{ scale: 0.9 }}
              aria-label="Refresh dashboard"
              title="Refresh dashboard"
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: PANEL, border: `1px solid ${BORDER}` }}
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                style={{ color: TEAL }}
              />
            </motion.button>
          </div>
        </motion.div>

        {/* ── K-ID Identity Card ── */}
        <KIdCard compact profile={profile} />

        {/* ── Error ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}
            >
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
              <button
                type="button"
                onClick={() => load()}
                className="ml-auto text-xs font-medium text-red-300 hover:text-red-200"
              >
                Retry
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Pending state ── */}
        <AnimatePresence>
          {!loading && isPending && !error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-5 rounded-2xl text-center space-y-3"
              style={{ background: PANEL, border: `1px solid rgba(234,179,8,0.2)` }}
            >
              <div
                className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
                style={{ background: "rgba(234,179,8,0.12)" }}
              >
                <Shield className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <div className="text-base font-bold text-white">Agent Setup Pending</div>
                <div
                  className="text-xs mt-1 leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  Your K-Agent account is awaiting activation. Contact KobKlein support to complete onboarding.
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push("/settings")}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{
                  background: `linear-gradient(135deg, ${GOLD_START}, ${GOLD_MID}, ${GOLD_END})`,
                }}
              >
                Complete Setup
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Float Balance Card ── */}
        {!isPending && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="relative overflow-hidden rounded-3xl p-6"
            style={{
              background: `linear-gradient(145deg, #0A2820 0%, #0B1E18 50%, #061410 100%)`,
              border: `1px solid rgba(13,158,138,0.25)`,
            }}
          >
            {/* Ambient glow */}
            <div
              className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(13,158,138,0.12) 0%, transparent 70%)",
                transform: "translate(30%, -30%)",
              }}
            />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Total Float Balance
                  </span>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(13,158,138,0.15)", color: TEAL_BRIGHT }}
                  >
                    CASH
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setHideBalance((h) => !h)}
                  className="text-xs font-medium transition-colors"
                  aria-label={hideBalance ? "Show balance" : "Hide balance"}
                  title={hideBalance ? "Show balance" : "Hide balance"}
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  {hideBalance ? "Show" : "Hide"}
                </button>
              </div>

              <div className="flex items-end gap-3 mt-2">
                <div className="text-4xl font-bold text-white leading-none">
                  {hideBalance
                    ? "•••,•••.••"
                    : loading
                    ? "–"
                    : `${animatedBalance.toLocaleString("fr-HT", { minimumFractionDigits: 2 })}`}
                </div>
                <div
                  className="text-lg font-semibold mb-0.5"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                >
                  HTG
                </div>
              </div>

              {!hideBalance && (
                <div
                  className="text-xs mt-1"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  ≈ {usdEstimate} USD
                </div>
              )}

              {/* Quick Action Buttons */}
              <div className="flex gap-3 mt-5">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push("/distributor/cash-in")}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white"
                  style={{ background: `linear-gradient(135deg, rgba(13,158,138,0.85), rgba(10,120,106,0.9))` }}
                >
                  <ArrowDownLeft className="h-4 w-4" />
                  Cash In
                </motion.button>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push("/distributor/cash-out")}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "rgba(239,68,68,0.18)", border: "1px solid rgba(239,68,68,0.25)" }}
                >
                  <ArrowUpRight className="h-4 w-4 text-red-400" />
                  <span className="text-red-300">Cash Out</span>
                </motion.button>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push("/distributor/transfer")}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
                  style={{
                    background: `linear-gradient(135deg, ${GOLD_START}22, ${GOLD_END}22)`,
                    border: `1px solid ${GOLD_MID}44`,
                    color: GOLD_START,
                  }}
                >
                  <TrendingUp className="h-4 w-4" />
                  Transfer
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Low Float Warning ── */}
        <AnimatePresence>
          {isLowFloat && !loading && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-3 p-4 rounded-2xl"
              style={{
                background: "rgba(234,179,8,0.08)",
                border: "1px solid rgba(234,179,8,0.25)",
              }}
            >
              <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-yellow-300">Low Float Balance</div>
                <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Your float is below 5,000 HTG. Contact admin to refill.
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push("/distributor/transfer")}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(234,179,8,0.2)", color: "#EAB308" }}
              >
                Request
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Stats Grid ── */}
        {!isPending && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Today's Transactions"
              value={loading ? "–" : String(dashboard?.todayTransactions ?? 0)}
              sub="Cash-in + Cash-out ops"
              icon={Activity}
              color={TEAL}
              delay={0.1}
            />
            <StatCard
              label="Today's Commissions"
              value={
                loading
                  ? "–"
                  : `${animatedCommissions.toLocaleString("fr-HT", { minimumFractionDigits: 2 })} HTG`
              }
              sub={`${((dashboard?.commissionRate ?? 0) * 100).toFixed(1)}% rate`}
              icon={Zap}
              color={GOLD_MID}
              delay={0.15}
            />
            <StatCard
              label="Total Float Loaded"
              value={
                loading
                  ? "–"
                  : `${fmtShort(dashboard?.totalFloat ?? 0)} HTG`
              }
              sub="All-time float loaded"
              icon={Wallet}
              color="#818cf8"
              delay={0.2}
            />
            <StatCard
              label="Operations"
              value={
                loading
                  ? "–"
                  : String(dashboard?.settlements?.length ?? 0)
              }
              sub="Total recorded"
              icon={Users}
              color="#fb923c"
              delay={0.25}
            />
          </div>
        )}

        {/* ── Tab Navigation ── */}
        {!isPending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex gap-1 p-1 rounded-xl"
            style={{ background: PANEL }}
          >
            {(["overview", "history"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: activeTab === tab ? CARD : "transparent",
                  color:
                    activeTab === tab ? "white" : "rgba(255,255,255,0.4)",
                  border: activeTab === tab ? `1px solid ${BORDER}` : "1px solid transparent",
                }}
              >
                {tab === "overview" ? "Overview" : "History"}
              </button>
            ))}
          </motion.div>
        )}

        {/* ── Overview Tab ── */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && !isPending && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              {/* Float Transfer Insights / Chart */}
              <div
                className="rounded-2xl p-4"
                style={{ background: CARD, border: `1px solid ${BORDER}` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm font-bold text-white">Float Transfer Insights</div>
                    <div className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                      Last 7 days
                    </div>
                  </div>
                  <BarChart3 className="h-4 w-4" style={{ color: TEAL }} />
                </div>

                <div className="min-w-0" style={{ height: 160 }}>
                  {loading ? (
                    <div
                      className="h-full rounded-xl animate-pulse"
                      style={{ background: PANEL }}
                    />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} barSize={8} barGap={2}>
                        <XAxis
                          dataKey="day"
                          tick={{ fontSize: 10, fill: "rgba(255,255,255,0.35)" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis hide />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                        <Bar dataKey="cashIn" name="Cash-In" fill={TEAL} radius={[3, 3, 0, 0]} />
                        <Bar dataKey="cashOut" name="Cash-Out" fill="#f87171" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="commission" name="Commission" fill={GOLD_MID} radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Summary row */}
                {!loading && dashboard && (
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {[
                      {
                        label: "Revenue This Month",
                        value: fmtShort(
                          chartData.reduce((a, d) => a + d.cashIn, 0),
                        ),
                        color: TEAL_BRIGHT,
                      },
                      {
                        label: "Total Bases",
                        value: `${((dashboard.commissionRate ?? 0) * 100).toFixed(0)}%`,
                        color: GOLD_START,
                      },
                      {
                        label: "Way Go Out Traces",
                        value: fmtShort(chartData.reduce((a, d) => a + d.cashOut, 0)),
                        color: "#f87171",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="p-2 rounded-xl text-center"
                        style={{ background: PANEL }}
                      >
                        <div
                          className="text-base font-bold"
                          style={{ color: item.color }}
                        >
                          {item.value} HTG
                        </div>
                        <div
                          className="text-[10px] mt-0.5 leading-tight"
                          style={{ color: "rgba(255,255,255,0.35)" }}
                        >
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Operations */}
              <div
                className="rounded-2xl p-4"
                style={{ background: CARD, border: `1px solid ${BORDER}` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-bold text-white">Recent Operations</div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("history")}
                    className="text-xs font-medium flex items-center gap-1"
                    style={{ color: TEAL }}
                  >
                    View All <ChevronRight className="h-3 w-3" />
                  </button>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-12 rounded-xl animate-pulse"
                        style={{ background: PANEL }}
                      />
                    ))}
                  </div>
                ) : dashboard && dashboard.settlements.length > 0 ? (
                  <div>
                    {dashboard.settlements.slice(0, 8).map((s, i) => (
                      <TxnRow key={s.id} s={s} index={i} />
                    ))}
                  </div>
                ) : (
                  <div
                    className="py-10 text-center text-sm"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    No operations yet. Start with a Cash-In or Cash-Out.
                  </div>
                )}
              </div>

              {/* Navigation tiles */}
              <div className="space-y-2">
                {[
                  {
                    label: "Float Transfer",
                    description: "Transfer float to another K-Agent",
                    href: "/distributor/transfer",
                    icon: TrendingUp,
                    color: GOLD_MID,
                  },
                  {
                    label: "Full Transaction History",
                    description: "All ledger entries and operations",
                    href: "/wallet",
                    icon: Wallet,
                    color: "#818cf8",
                  },
                ].map((item) => (
                  <motion.button
                    key={item.href}
                    type="button"
                    whileTap={{ scale: 0.99 }}
                    onClick={() => router.push(item.href)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-colors"
                    style={{ background: CARD, border: `1px solid ${BORDER}` }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${item.color}18` }}
                    >
                      <item.icon className="h-5 w-5" style={{ color: item.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white">{item.label}</div>
                      <div
                        className="text-xs mt-0.5 truncate"
                        style={{ color: "rgba(255,255,255,0.4)" }}
                      >
                        {item.description}
                      </div>
                    </div>
                    <ArrowRight
                      className="h-4 w-4 shrink-0"
                      style={{ color: "rgba(255,255,255,0.25)" }}
                    />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── History Tab ── */}
          {activeTab === "history" && !isPending && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <div
                className="rounded-2xl p-4"
                style={{ background: CARD, border: `1px solid ${BORDER}` }}
              >
                <div className="text-sm font-bold text-white mb-4">
                  All Transactions
                  {txns.length > 0 && (
                    <span
                      className="ml-2 text-[11px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: `${TEAL}22`, color: TEAL_BRIGHT }}
                    >
                      {txns.length}
                    </span>
                  )}
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-12 rounded-xl animate-pulse"
                        style={{ background: PANEL }}
                      />
                    ))}
                  </div>
                ) : txns.length > 0 ? (
                  <div>
                    {txns.map((t, i) => {
                      const isIn = isCashIn(t.type) || (t.type === "commission" && t.amount > 0);
                      return (
                        <motion.div
                          key={t.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: Math.min(i * 0.025, 0.5) }}
                          style={{ borderBottom: `1px solid ${BORDER}` }}
                          className="flex items-center gap-3 py-3 last:border-0"
                        >
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                              background:
                                t.type === "commission"
                                  ? `${GOLD_MID}18`
                                  : isIn
                                  ? "rgba(13,158,138,0.15)"
                                  : "rgba(239,68,68,0.12)",
                            }}
                          >
                            {t.type === "commission" ? (
                              <Zap className="h-4 w-4" style={{ color: GOLD_MID }} />
                            ) : isIn ? (
                              <ArrowDownLeft className="h-4 w-4" style={{ color: TEAL_BRIGHT }} />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-red-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">
                              {txnLabel(t.type)}
                            </div>
                            <div
                              className="text-[11px] flex items-center gap-1"
                              style={{ color: "rgba(255,255,255,0.35)" }}
                            >
                              <Clock className="h-2.5 w-2.5" />
                              {new Date(t.createdAt).toLocaleString("fr-HT", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                          <div
                            className="text-sm font-bold tabular-nums"
                            style={{
                              color:
                                t.type === "commission"
                                  ? GOLD_START
                                  : t.amount > 0
                                  ? TEAL_BRIGHT
                                  : "#f87171",
                            }}
                          >
                            {t.amount > 0 ? "+" : ""}
                            {fmt(Math.abs(t.amount))}
                            <span
                              className="text-[10px] font-normal ml-0.5"
                              style={{ color: "rgba(255,255,255,0.35)" }}
                            >
                              HTG
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    className="py-10 text-center text-sm"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    No transactions recorded yet.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
