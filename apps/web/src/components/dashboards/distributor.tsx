"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { kkGet } from "@/lib/kobklein-api";
import { KIdCard } from "@/components/kid-card";
import { KNfcIcon } from "@/components/pos/KNfcIcon";
import { PosActivationModal } from "@/components/pos/PosActivationModal";
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
  Eye,
  EyeOff,
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

// ─── Design tokens — Distributor: Noir Glass ──────────────────────────────────

const G = {
  // Backgrounds
  bg:       "#07080C",                      // near-black page bg
  card:     "rgba(255,255,255,0.045)",      // glass card
  cardHov:  "rgba(255,255,255,0.07)",       // glass hover
  panel:    "rgba(255,255,255,0.028)",      // inner panel
  panel2:   "rgba(255,255,255,0.06)",       // sub-panel

  // Borders
  border:   "rgba(255,255,255,0.08)",       // default glass border
  border2:  "rgba(255,255,255,0.05)",       // subtle divider
  border3:  "rgba(255,255,255,0.12)",       // prominent border

  // Gold — Sovereign accent (CTAs, balance, commissions)
  gold:     "#D4AF37",
  goldL:    "#F5B77A",
  goldD:    "#A08030",

  // Text
  text:     "#FFFFFF",
  muted:    "rgba(255,255,255,0.58)",
  dimmed:   "rgba(255,255,255,0.30)",
  faint:    "rgba(255,255,255,0.14)",

  // Semantic
  success:  "#16C784",                      // cash-in / positive
  danger:   "#F87171",                      // cash-out / negative
  accent:   "#818CF8",                      // commission / indigo
} as const;

// Glass style helper
const glass = (extra?: React.CSSProperties): React.CSSProperties => ({
  background:             G.card,
  border:                 `1px solid ${G.border}`,
  backdropFilter:         "blur(14px)",
  WebkitBackdropFilter:   "blur(14px)",
  ...extra,
});

const LOW_FLOAT_THRESHOLD = 5_000;

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 900) {
  const [val, setVal] = useState(0);
  const rafRef  = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const fromRef  = useRef(0);

  useEffect(() => {
    fromRef.current  = val;
    startRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const p    = Math.min((ts - startRef.current) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(fromRef.current + (target - fromRef.current) * ease));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
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
  if (Math.abs(n) >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return n.toFixed(0);
};

const txnLabel = (type: string) => {
  const map: Record<string, string> = {
    cash_in:           "Cash-In",
    cash_in_debit:     "Cash-In",
    cash_in_credit:    "Cash-In Credit",
    cash_out:          "Cash-Out",
    cash_out_debit:    "Cash-Out",
    cash_out_credit:   "Cash-Out Credit",
    commission:        "Commission",
    float_transfer:    "Float Transfer",
  };
  return map[type] ?? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const isCashIn = (type: string) =>
  type === "cash_in" || type === "cash_in_debit" || type === "cash_in_credit";

function buildWeeklyChart(
  settlements: AgentDashboard["settlements"],
  txns: LedgerEntry[],
): { day: string; cashIn: number; cashOut: number; commission: number }[] {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const label = d.toLocaleDateString("en", { weekday: "short" });
    const daySett  = settlements.filter(s => { const t = new Date(s.createdAt); return t >= d && t < next; });
    const cashIn   = daySett.filter(s => s.type === "cash_in").reduce((a, s) => a + s.amount, 0);
    const cashOut  = daySett.filter(s => s.type === "cash_out").reduce((a, s) => a + s.amount, 0);
    const dayComm  = txns.filter(t => { const ts = new Date(t.createdAt); return ts >= d && ts < next && t.type === "commission"; });
    const commission = dayComm.reduce((a, t) => a + Math.abs(t.amount), 0);
    days.push({ day: label, cashIn, cashOut, commission });
  }
  return days;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, color = G.muted, delay = 0 }: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color?: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="p-4 rounded-2xl flex flex-col gap-2.5"
      style={glass()}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: G.dimmed }}>
          {label}
        </span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${color}1A` }}>
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-black text-white leading-none">{value}</div>
      {sub && <div className="text-[11px]" style={{ color: G.dimmed }}>{sub}</div>}
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
      className="flex items-center gap-3 py-3 last:border-0"
      style={{ borderBottom: `1px solid ${G.border2}` }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: isIn ? `${G.success}18` : `${G.danger}18` }}>
        {isIn
          ? <ArrowDownLeft className="h-4 w-4" style={{ color: G.success }} />
          : <ArrowUpRight  className="h-4 w-4" style={{ color: G.danger  }} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white truncate">{txnLabel(s.type)}</div>
        <div className="text-[11px] flex items-center gap-1" style={{ color: G.dimmed }}>
          <Clock className="h-2.5 w-2.5" />
          {new Date(s.createdAt).toLocaleString("fr-HT", {
            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
          })}
        </div>
      </div>
      <div className="text-sm font-black tabular-nums" style={{ color: isIn ? G.success : G.danger }}>
        {isIn ? "+" : "-"}{fmt(s.amount)}
        <span className="text-[10px] font-normal ml-0.5" style={{ color: G.dimmed }}>
          {s.currency}
        </span>
      </div>
    </motion.div>
  );
}

function ChartTooltip({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="p-3 text-xs space-y-1 shadow-2xl rounded-xl"
      style={glass({ padding: 12 })}>
      <div className="font-bold text-white mb-1">{label}</div>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: G.dimmed }}>{p.name}:</span>
          <span className="font-bold text-white">{fmtShort(p.value)} HTG</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DistributorDashboard({ profile }: Props) {
  const router = useRouter();
  const [dashboard,    setDashboard]    = useState<AgentDashboard | null>(null);
  const [txns,         setTxns]         = useState<LedgerEntry[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [hideBalance,  setHideBalance]  = useState(false);
  const [copied,       setCopied]       = useState(false);
  const [activeTab,    setActiveTab]    = useState<"overview" | "history">("overview");
  const [posActive,    setPosActive]    = useState(false);
  const [showPosModal, setShowPosModal] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const [dashRes, txnsRes, posRes] = await Promise.allSettled([
        kkGet<AgentDashboard>("v1/distributor/dashboard"),
        kkGet<LedgerEntry[]>("v1/distributor/transactions"),
        kkGet<{ hasActivePosDevice: boolean }>("v1/pos/devices/my"),
      ]);
      if (dashRes.status === "fulfilled") setDashboard(dashRes.value);
      else setError("Could not load agent dashboard.");
      if (txnsRes.status === "fulfilled") setTxns(txnsRes.value);
      if (posRes.status === "fulfilled") setPosActive(posRes.value.hasActivePosDevice ?? false);
    } catch {
      setError("Could not load agent dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const floatBalance          = dashboard?.floatBalance ?? 0;
  const animatedBalance       = useCountUp(hideBalance ? 0 : floatBalance);
  const animatedCommissions   = useCountUp(dashboard?.todayCommissions ?? 0);
  const isLowFloat            = floatBalance > 0 && floatBalance < LOW_FLOAT_THRESHOLD;
  const isPending             = dashboard?.status === "pending" || dashboard?.distributorId === null;

  const chartData = dashboard
    ? buildWeeklyChart(dashboard.settlements, txns)
    : Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return { day: d.toLocaleDateString("en", { weekday: "short" }), cashIn: 0, cashOut: 0, commission: 0 };
      });

  const copyHandle = () => {
    if (!profile.handle) return;
    navigator.clipboard.writeText(`@${profile.handle}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const usdEstimate = (floatBalance / 132).toFixed(2);

  return (
    <div
      data-dashboard="distributor"
      className="min-h-screen w-full"
      style={{ background: G.bg, color: G.text, fontFamily: "inherit" }}
    >
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-28">

        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-start justify-between"
        >
          <div>
            <div className="text-[11px] font-bold flex items-center gap-1.5 mb-1 uppercase tracking-widest"
              style={{ color: G.dimmed }}>
              <MapPin className="h-3 w-3" />
              KobKlein K-Agent
            </div>
            <h1 className="text-xl font-black text-white leading-tight">
              {dashboard?.businessName ||
                (profile.firstName
                  ? `${profile.firstName}${profile.lastName ? ` ${profile.lastName}` : ""}`
                  : "Agent Dashboard")}
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              {profile.handle && (
                <button type="button" onClick={copyHandle}
                  className="flex items-center gap-1 text-[11px] transition-colors"
                  style={{ color: G.dimmed }}>
                  @{profile.handle}
                  {copied
                    ? <CheckCircle2 className="h-3 w-3" style={{ color: G.success }} />
                    : <Copy className="h-3 w-3" />}
                </button>
              )}
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: isPending ? "rgba(234,179,8,0.12)" : "rgba(22,199,132,0.10)",
                  border:     isPending ? "1px solid rgba(234,179,8,0.25)" : "1px solid rgba(22,199,132,0.25)",
                  color:      isPending ? "#EAB308" : G.success,
                }}>
                {isPending ? "Pending Activation" : "Active"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* K-NFC POS activation */}
            <div className="flex flex-col items-center gap-0.5">
              <KNfcIcon
                size={44}
                active={posActive}
                onClick={() => posActive ? router.push("/distributor/pos") : setShowPosModal(true)}
              />
              <span className="text-[8px] font-bold uppercase tracking-wide"
                style={{ color: posActive ? G.success : G.dimmed }}>
                {posActive ? "POS On" : "K-NFC"}
              </span>
            </div>
            <motion.button type="button" onClick={() => load(true)} whileTap={{ scale: 0.9 }}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={glass()}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                style={{ color: G.muted }} />
            </motion.button>
          </div>
        </motion.div>

        {/* ── POS Activation Modal ────────────────────────────────────── */}
        <AnimatePresence>
          {showPosModal && (
            <PosActivationModal
              onActivated={() => setPosActive(true)}
              onClose={() => setShowPosModal(false)}
            />
          )}
        </AnimatePresence>

        {/* ── K-ID CARD ──────────────────────────────────────────────── */}
        <KIdCard compact profile={profile} />

        {/* ── ERROR BANNER ───────────────────────────────────────────── */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.20)" }}>
              <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: G.danger }} />
              <p className="text-sm flex-1" style={{ color: G.danger }}>{error}</p>
              <button type="button" onClick={() => load()}
                className="text-xs font-bold ml-auto" style={{ color: G.danger }}>
                Retry
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── PENDING STATE ──────────────────────────────────────────── */}
        <AnimatePresence>
          {!loading && isPending && !error && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.45 }}
              className="rounded-3xl overflow-hidden"
              style={{
                background: "linear-gradient(145deg, rgba(212,175,55,0.06) 0%, rgba(255,255,255,0.025) 100%)",
                border: "1px solid rgba(212,175,55,0.18)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            >
              {/* Gold accent top bar */}
              <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, transparent 0%, #D4AF37 50%, transparent 100%)" }} />

              <div className="p-6 flex flex-col items-center text-center gap-5">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 260 }}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(212,175,55,0.10)", border: "1px solid rgba(212,175,55,0.22)" }}
                >
                  <Shield className="h-8 w-8" style={{ color: G.gold }} />
                </motion.div>

                {/* Text */}
                <div className="space-y-1.5">
                  <h2 className="text-lg font-black text-white tracking-tight">
                    Agent Setup Pending
                  </h2>
                  <p className="text-sm leading-relaxed max-w-xs mx-auto" style={{ color: G.muted }}>
                    Your K-Agent account is awaiting activation by the KobKlein operations team. You&apos;ll be notified once approved.
                  </p>
                </div>

                {/* Progress steps */}
                <div className="w-full space-y-2 text-left">
                  {([
                    { label: "Application submitted",      done: true },
                    { label: "KobKlein operations review", done: false },
                    { label: "Account activation",         done: false },
                  ] as const).map(({ label, done }, i) => (
                    <div
                      key={label}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl"
                      style={{
                        background: done ? "rgba(22,199,132,0.06)" : "rgba(255,255,255,0.025)",
                        border: `1px solid ${done ? "rgba(22,199,132,0.18)" : G.border2}`,
                      }}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black"
                        style={{
                          background: done ? "rgba(22,199,132,0.18)" : G.faint,
                          color: done ? G.success : G.dimmed,
                        }}
                      >
                        {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                      </div>
                      <span className="text-xs font-medium" style={{ color: done ? G.success : G.muted }}>
                        {label}
                      </span>
                      {i === 1 && (
                        <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-md animate-pulse"
                          style={{ background: "rgba(212,175,55,0.12)", color: G.gold }}>
                          IN PROGRESS
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <a
                  href="mailto:support@kobklein.com?subject=K-Agent%20Activation%20Inquiry"
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-black transition-opacity hover:opacity-90"
                  style={{
                    background: `linear-gradient(135deg, ${G.goldL} 0%, ${G.gold} 50%, ${G.goldD} 100%)`,
                    color: "#07080C",
                    boxShadow: "0 4px 28px -4px rgba(212,175,55,0.35)",
                  }}
                >
                  <Zap className="h-4 w-4" />
                  Contact Support
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── FLOAT BALANCE HERO ─────────────────────────────────────── */}
        {!isPending && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="relative overflow-hidden rounded-3xl p-6"
            style={{
              background:           "linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
              border:               `1px solid ${G.border3}`,
              backdropFilter:       "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            {/* Gold ambient glow */}
            <div className="absolute top-0 right-0 w-56 h-56 rounded-full pointer-events-none"
              style={{
                background: `radial-gradient(circle, rgba(212,175,55,0.14) 0%, transparent 65%)`,
                transform:  "translate(35%, -35%)",
              }} />
            {/* Subtle grid texture */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
              style={{
                backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0, rgba(255,255,255,0.6) 1px, transparent 1px, transparent 24px),
                  repeating-linear-gradient(90deg, rgba(255,255,255,0.6) 0, rgba(255,255,255,0.6) 1px, transparent 1px, transparent 24px)`,
              }} />

            <div className="relative z-10">
              {/* Top row */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: G.dimmed }}>
                    Operating Balance
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(212,175,55,0.12)", color: G.gold, border: "1px solid rgba(212,175,55,0.20)" }}>
                    HTG
                  </span>
                </div>
                <button type="button" onClick={() => setHideBalance(h => !h)}
                  className="flex items-center gap-1 text-xs font-medium"
                  aria-label={hideBalance ? "Show balance" : "Hide balance"}
                  style={{ color: G.dimmed }}>
                  {hideBalance
                    ? <><Eye    className="h-3.5 w-3.5" /> Show</>
                    : <><EyeOff className="h-3.5 w-3.5" /> Hide</>}
                </button>
              </div>

              {/* Amount */}
              <div className="flex items-end gap-3 mt-3">
                <div className="text-4xl font-black leading-none"
                  style={{
                    background:             `linear-gradient(135deg, ${G.goldL}, ${G.gold})`,
                    WebkitBackgroundClip:   "text",
                    WebkitTextFillColor:    "transparent",
                    backgroundClip:         "text",
                  }}>
                  {hideBalance ? "•••,•••.••" : loading ? "–" :
                    animatedBalance.toLocaleString("fr-HT", { minimumFractionDigits: 2 })}
                </div>
                <div className="text-lg font-semibold mb-0.5" style={{ color: G.dimmed }}>HTG</div>
              </div>

              {!hideBalance && (
                <div className="text-xs mt-1" style={{ color: G.faint }}>
                  ≈ {usdEstimate} USD
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 mt-5">
                <motion.button type="button" whileTap={{ scale: 0.97 }}
                  onClick={() => router.push("/distributor/cash-in")}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black"
                  style={{
                    background: `linear-gradient(135deg, ${G.goldL}DD, ${G.gold}DD, ${G.goldD}DD)`,
                    color:      G.bg,
                  }}>
                  <ArrowDownLeft className="h-4 w-4" />
                  Cash In
                </motion.button>

                <motion.button type="button" whileTap={{ scale: 0.97 }}
                  onClick={() => router.push("/distributor/cash-out")}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black"
                  style={{ background: `${G.danger}18`, border: `1px solid ${G.danger}30`, color: G.danger }}>
                  <ArrowUpRight className="h-4 w-4" />
                  Cash Out
                </motion.button>

                <motion.button type="button" whileTap={{ scale: 0.97 }}
                  onClick={() => router.push("/distributor/transfer")}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black"
                  style={glass({ color: G.muted })}>
                  <TrendingUp className="h-4 w-4" />
                  Transfer
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── LOW FLOAT WARNING ──────────────────────────────────────── */}
        <AnimatePresence>
          {isLowFloat && !loading && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-3 p-4 rounded-2xl"
              style={{ background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.22)" }}>
              <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-bold text-yellow-300">Low Float Balance</div>
                <div className="text-xs mt-0.5" style={{ color: G.dimmed }}>
                  Your float is below 5,000 HTG. Contact admin to refill.
                </div>
              </div>
              <button type="button" onClick={() => router.push("/distributor/transfer")}
                className="text-xs font-bold px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(234,179,8,0.14)", color: "#EAB308" }}>
                Request
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── STATS GRID ─────────────────────────────────────────────── */}
        {!isPending && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Today's Txns"
              value={loading ? "–" : String(dashboard?.todayTransactions ?? 0)}
              sub="Cash-in + Cash-out ops"
              icon={Activity}
              color={G.accent}
              delay={0.10}
            />
            <StatCard
              label="Commissions"
              value={loading ? "–" : `${animatedCommissions.toLocaleString("fr-HT", { minimumFractionDigits: 2 })} HTG`}
              sub={`${((dashboard?.commissionRate ?? 0) * 100).toFixed(1)}% rate`}
              icon={Zap}
              color={G.gold}
              delay={0.15}
            />
            <StatCard
              label="Total Float Loaded"
              value={loading ? "–" : `${fmtShort(dashboard?.totalFloat ?? 0)} HTG`}
              sub="All-time float loaded"
              icon={Wallet}
              color={G.success}
              delay={0.20}
            />
            <StatCard
              label="Operations"
              value={loading ? "–" : String(dashboard?.settlements?.length ?? 0)}
              sub="Total recorded"
              icon={Users}
              color={G.muted}
              delay={0.25}
            />
          </div>
        )}

        {/* ── TAB SWITCHER ───────────────────────────────────────────── */}
        {!isPending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="flex gap-1 p-1 rounded-xl"
            style={glass()}>
            {(["overview", "history"] as const).map(tab => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all"
                style={{
                  background: activeTab === tab ? "rgba(255,255,255,0.08)" : "transparent",
                  color:      activeTab === tab ? G.text : G.dimmed,
                  border:     activeTab === tab ? `1px solid ${G.border}` : "1px solid transparent",
                }}>
                {tab === "overview" ? "Overview" : "History"}
              </button>
            ))}
          </motion.div>
        )}

        {/* ── OVERVIEW TAB ───────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && !isPending && (
            <motion.div key="overview"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
              className="space-y-4">

              {/* Float Transfer Insights / Chart */}
              <div className="rounded-2xl p-4" style={glass()}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm font-bold text-white">Float Transfer Insights</div>
                    <div className="text-[11px] mt-0.5" style={{ color: G.dimmed }}>Last 7 days</div>
                  </div>
                  <BarChart3 className="h-4 w-4" style={{ color: G.gold }} />
                </div>

                <div style={{ height: 160 }}>
                  {loading ? (
                    <div className="h-full rounded-xl animate-pulse"
                      style={{ background: G.panel }} />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} barSize={8} barGap={2}>
                        <XAxis dataKey="day"
                          tick={{ fontSize: 10, fill: "rgba(255,255,255,0.30)" }}
                          axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip content={<ChartTooltip />}
                          cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                        <Bar dataKey="cashIn"     name="Cash-In"    fill={G.success} radius={[3,3,0,0]} />
                        <Bar dataKey="cashOut"    name="Cash-Out"   fill={G.danger}  radius={[3,3,0,0]} />
                        <Bar dataKey="commission" name="Commission" fill={G.accent}  radius={[3,3,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-3">
                  {[
                    { label: "Cash-In",    color: G.success },
                    { label: "Cash-Out",   color: G.danger  },
                    { label: "Commission", color: G.accent  },
                  ].map(l => (
                    <div key={l.label} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                      <span className="text-[10px]" style={{ color: G.dimmed }}>{l.label}</span>
                    </div>
                  ))}
                </div>

                {/* Summary row */}
                {!loading && dashboard && (
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {[
                      { label: "Revenue",    value: fmtShort(chartData.reduce((a,d) => a + d.cashIn, 0)),    color: G.success },
                      { label: "Commission", value: `${((dashboard.commissionRate ?? 0) * 100).toFixed(0)}%`, color: G.gold },
                      { label: "Cash-Out",   value: fmtShort(chartData.reduce((a,d) => a + d.cashOut, 0)),   color: G.danger },
                    ].map(item => (
                      <div key={item.label} className="p-2.5 rounded-xl text-center"
                        style={{ background: G.panel }}>
                        <div className="text-base font-black" style={{ color: item.color }}>
                          {item.value} HTG
                        </div>
                        <div className="text-[10px] mt-0.5 leading-tight" style={{ color: G.dimmed }}>
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Operations */}
              <div className="rounded-2xl p-4" style={glass()}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-bold text-white">Recent Operations</div>
                  <button type="button" onClick={() => setActiveTab("history")}
                    className="text-xs font-bold flex items-center gap-1"
                    style={{ color: G.gold }}>
                    View All <ChevronRight className="h-3 w-3" />
                  </button>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: G.panel }} />
                    ))}
                  </div>
                ) : dashboard && dashboard.settlements.length > 0 ? (
                  <div>
                    {dashboard.settlements.slice(0, 8).map((s, i) => (
                      <TxnRow key={s.id} s={s} index={i} />
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center text-sm" style={{ color: G.dimmed }}>
                    No operations yet. Start with a Cash-In or Cash-Out.
                  </div>
                )}
              </div>

              {/* Navigation tiles */}
              <div className="space-y-2">
                {[
                  {
                    label:       "Float Transfer",
                    description: "Transfer float to another K-Agent",
                    href:        "/distributor/transfer",
                    icon:        TrendingUp,
                    color:       G.gold,
                  },
                  {
                    label:       "Full Transaction History",
                    description: "All ledger entries and operations",
                    href:        "/wallet",
                    icon:        Wallet,
                    color:       G.accent,
                  },
                ].map(item => (
                  <motion.button key={item.href} type="button" whileTap={{ scale: 0.99 }}
                    onClick={() => router.push(item.href)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all hover:brightness-110"
                    style={glass()}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${item.color}18` }}>
                      <item.icon className="h-5 w-5" style={{ color: item.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white">{item.label}</div>
                      <div className="text-xs mt-0.5 truncate" style={{ color: G.dimmed }}>
                        {item.description}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0" style={{ color: G.faint }} />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── HISTORY TAB ──────────────────────────────────────────── */}
          {activeTab === "history" && !isPending && (
            <motion.div key="history"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
              <div className="rounded-2xl p-4" style={glass()}>
                <div className="flex items-center gap-2 mb-4 text-sm font-bold text-white">
                  All Transactions
                  {txns.length > 0 && (
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full ml-1"
                      style={{ background: "rgba(212,175,55,0.10)", color: G.gold }}>
                      {txns.length}
                    </span>
                  )}
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: G.panel }} />
                    ))}
                  </div>
                ) : txns.length > 0 ? (
                  <div>
                    {txns.map((t, i) => {
                      const isIn = isCashIn(t.type) || (t.type === "commission" && t.amount > 0);
                      return (
                        <motion.div key={t.id}
                          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: Math.min(i * 0.025, 0.5) }}
                          className="flex items-center gap-3 py-3 last:border-0"
                          style={{ borderBottom: `1px solid ${G.border2}` }}>
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                              background: t.type === "commission" ? `${G.accent}18`
                                : isIn ? `${G.success}18` : `${G.danger}18`,
                            }}>
                            {t.type === "commission"
                              ? <Zap          className="h-4 w-4" style={{ color: G.accent  }} />
                              : isIn
                              ? <ArrowDownLeft className="h-4 w-4" style={{ color: G.success }} />
                              : <ArrowUpRight  className="h-4 w-4" style={{ color: G.danger  }} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-white truncate">
                              {txnLabel(t.type)}
                            </div>
                            <div className="text-[11px] flex items-center gap-1" style={{ color: G.dimmed }}>
                              <Clock className="h-2.5 w-2.5" />
                              {new Date(t.createdAt).toLocaleString("fr-HT", {
                                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                              })}
                            </div>
                          </div>
                          <div className="text-sm font-black tabular-nums"
                            style={{
                              color: t.type === "commission" ? G.accent
                                : t.amount > 0 ? G.success : G.danger,
                            }}>
                            {t.amount > 0 ? "+" : ""}{fmt(Math.abs(t.amount))}
                            <span className="text-[10px] font-normal ml-0.5" style={{ color: G.dimmed }}>HTG</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-10 text-center text-sm" style={{ color: G.dimmed }}>
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
