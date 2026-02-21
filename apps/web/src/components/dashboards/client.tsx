"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { apiGet } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { KIdCard } from "@/components/kid-card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import {
  Send, QrCode, CreditCard, ArrowDownLeft,
  Shield, ChevronRight, ArrowUpRight, ArrowDownRight,
  TrendingUp, TrendingDown, Wallet, Lock, Clock, Zap,
  CheckCircle2, AlertTriangle, RefreshCw,
  Eye, EyeOff, Globe, Users, Star, ShieldCheck,
} from "lucide-react";

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
    planTier?: number;
  };
};

type BalanceInfo = {
  totalBalance: number;
  availableBalance: number;
  heldBalance: number;
  balances?: { walletId: string; currency: string; type: string; balance: number }[];
};

type Transaction = {
  id: string;
  type: string;
  amount: number;
  currency: string;
  createdAt: string;
  status: string;
  description?: string;
  counterpartyName?: string;
};

type FamilyMember = {
  id: string;
  nickname?: string;
  relationship?: string;
  isFavorite?: boolean;
  familyUser: { id: string; firstName?: string; lastName?: string; handle?: string };
  recentTransfers: { id: string; amount: number; createdAt: string }[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

// greeting word varies by time of day, per locale
const GREETING_MORNING: Record<string, string> = {
  en: "Good morning",
  fr: "Bonjour",
  ht: "Bonjou",
  es: "Buenos días",
};
const GREETING_AFTERNOON: Record<string, string> = {
  en: "Good afternoon",
  fr: "Bon après-midi",
  ht: "Bon apremidi",
  es: "Buenas tardes",
};
const GREETING_EVENING: Record<string, string> = {
  en: "Good evening",
  fr: "Bonsoir",
  ht: "Bonswa",
  es: "Buenas noches",
};

function getGreeting(locale: string) {
  const h = new Date().getHours();
  const map = h < 12 ? GREETING_MORNING : h < 17 ? GREETING_AFTERNOON : GREETING_EVENING;
  return map[locale] ?? map["en"];
}

function fmtHTG(n: number) {
  return Number(n).toLocaleString("fr-HT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtShort(n: number) {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toFixed(0);
}

const CATEGORY_COLORS: Record<string, string> = {
  Transfer:   "#C9A84C",
  Payment:    "#3B82F6",
  "Cash-Out": "#EF4444",
  "Cash-In":  "#22C55E",
  Other:      "#6B7280",
};

const RELATIONSHIP_EMOJI: Record<string, string> = {
  parent: "👩", child: "👧", sibling: "🧑", spouse: "💑", cousin: "🤝", other: "👤",
};

// ─── Custom chart components ──────────────────────────────────────────────────

function CustomBarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0E2018] border border-[#0D9E8A]/20 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-[#7A8394] mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {fmtHTG(p.value)} HTG
        </p>
      ))}
    </div>
  );
}

function CustomPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#F0F1F5" textAnchor="middle" dominantBaseline="central" fontSize={9} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────

function StatPill({ label, value, icon: Icon, colorClass = "text-[#C9A84C]" }: {
  label: string; value: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass?: string;
}) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-xl bg-[#122B22] border border-[#0D9E8A]/[0.12]">
      <div className="flex items-center gap-1.5">
        <Icon className={`h-3 w-3 ${colorClass}`} />
        <span className="text-[10px] text-[#5A6478] uppercase tracking-wider font-medium">{label}</span>
      </div>
      <span className="text-sm font-bold text-[#F0F1F5] tabular-nums">{value}</span>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function ClientDashboard({ profile }: Props) {
  const router = useRouter();
  const { t, locale }  = useI18n();

  const [balance, setBalance]           = useState<BalanceInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [family, setFamily]             = useState<FamilyMember[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [currency, setCurrency]         = useState<"HTG" | "USD">("HTG");
  const [expandedTx, setExpandedTx]     = useState<string | null>(null);
  const [displayBalance, setDisplayBalance] = useState<number>(0);
  const animRef = useRef<number | null>(null);

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      // First fetch balance to get the walletId, then fetch timeline with it
      const [bal, famRes] = await Promise.allSettled([
        apiGet<BalanceInfo>("v1/wallets/balance"),
        apiGet<FamilyMember[]>("v1/family/members").catch(() => [] as FamilyMember[]),
      ]);

      // Resolve transactions: use walletId-scoped timeline if available, else fall back
      let txRes: PromiseSettledResult<Transaction[]>;
      if (bal.status === "fulfilled") {
        const walletId = (bal.value as any).balances?.find((b: any) => b.type === "USER")?.walletId
          ?? (bal.value as any).walletId;
        if (walletId) {
          txRes = await Promise.resolve(
            apiGet<Transaction[]>(`v1/wallets/${walletId}/timeline?limit=60`)
              .catch(() => apiGet<Transaction[]>("v1/transactions").catch(() => [] as Transaction[]))
          ).then((v) => ({ status: "fulfilled" as const, value: v }))
            .catch((e) => ({ status: "rejected" as const, reason: e }));
        } else {
          txRes = await Promise.resolve(
            apiGet<Transaction[]>("v1/transactions").catch(() => [] as Transaction[])
          ).then((v) => ({ status: "fulfilled" as const, value: v }))
            .catch((e) => ({ status: "rejected" as const, reason: e }));
        }
      } else {
        txRes = { status: "rejected", reason: "balance failed" };
      }
      if (bal.status    === "fulfilled") setBalance(bal.value);
      if (txRes.status  === "fulfilled") setTransactions(Array.isArray(txRes.value) ? txRes.value : []);
      if (famRes.status === "fulfilled") setFamily(Array.isArray(famRes.value) ? famRes.value : []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Animated count-up ────────────────────────────────────────────────────
  useEffect(() => {
    if (!balance) return;
    const target = currency === "HTG"
      ? (balance.totalBalance ?? 0)
      : (balance.totalBalance ?? 0) / 130;
    const start    = displayBalance;
    const diff     = target - start;
    if (Math.abs(diff) < 0.01) return;
    const t0       = performance.now();
    const duration = 900;
    function step(now: number) {
      const p    = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplayBalance(start + diff * ease);
      if (p < 1) animRef.current = requestAnimationFrame(step);
    }
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(step);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balance, currency]);

  // ── Chart data ───────────────────────────────────────────────────────────
  const last30Days = (() => {
    const days: Record<string, { income: number; expense: number }> = {};
    const now = Date.now();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * 86_400_000);
      days[d.toLocaleDateString("en-US", { month: "short", day: "numeric" })] = { income: 0, expense: 0 };
    }
    transactions.forEach((tx) => {
      const key = new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (!days[key]) return;
      const amt = Math.abs(Number(tx.amount));
      if (Number(tx.amount) >= 0) days[key].income  += amt;
      else                        days[key].expense += amt;
    });
    return Object.entries(days).map(([name, v]) => ({ name, ...v }));
  })();

  // Thin every-5th tick on x-axis to avoid overlap
  const barData = last30Days.filter((_, i) => i % 5 === 0 || i === last30Days.length - 1);

  const categoryData = (() => {
    const cats: Record<string, number> = {};
    transactions.filter((tx) => Number(tx.amount) < 0).forEach((tx) => {
      const cat =
        tx.type?.includes("transfer") || tx.type?.includes("send")   ? "Transfer" :
        tx.type?.includes("payment")  || tx.type?.includes("merchant") ? "Payment" :
        tx.type?.includes("cash_out")                                  ? "Cash-Out" :
        "Other";
      cats[cat] = (cats[cat] ?? 0) + Math.abs(Number(tx.amount));
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  })();

  const totalSpend  = categoryData.reduce((s, c) => s + c.value, 0);
  const totalIncome = transactions.filter((t) => Number(t.amount) > 0)
    .reduce((s, t) => s + Number(t.amount), 0);

  const avail = balance?.availableBalance ?? 0;
  const held  = balance?.heldBalance ?? 0;
  const usdBal = balance?.balances?.find((b) => b.currency === "USD")?.balance ?? 0;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C9A84C] to-[#9F7F2C] flex items-center justify-center shadow-lg shadow-[#C9A84C]/20"
        >
          <span className="text-white font-bold text-xl">K</span>
        </motion.div>
        <p className="text-sm text-[#5A6478]">Loading your dashboard…</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ══════════════════════════════════════════════
          1. GREETING HEADER
          ══════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-start md:justify-between gap-3"
      >
        <div>
          <p className="text-xs text-[#3A4558] font-medium tracking-widest uppercase mb-1">
            {t("auth.tagline")}
          </p>
          <h1
            className="text-2xl md:text-3xl font-bold text-[#F0F1F5]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {getGreeting(locale)}, {profile.firstName || "there"} 👋
          </h1>
          {profile.handle && (
            <p className="text-xs text-[#C9A84C] mt-1.5 font-medium flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded bg-[#C9A84C] text-[#060D1F] text-[8px] font-black flex items-center justify-center">K</span>
              @{profile.handle}
            </p>
          )}
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap items-center gap-2">
          {profile.kycTier >= 2 ? (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
              <CheckCircle2 className="h-3 w-3" /> Verified Identity
            </span>
          ) : profile.kycTier === 1 ? (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] animate-pulse">
              <Clock className="h-3 w-3" /> KYC Pending
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[11px]">
              <AlertTriangle className="h-3 w-3" /> Unverified
            </span>
          )}
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#122B22] border border-[#0D9E8A]/[0.12] text-[#3A4558] text-[11px]">
            <Shield className="h-3 w-3" /> 256-bit Encrypted
          </span>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════
          MAIN 2-COLUMN GRID
          ══════════════════════════════════════════════ */}
      {/* ── K-ID Identity Card ────────────────────────────── */}
      <KIdCard compact profile={profile} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">

        {/* ───────── LEFT COLUMN ───────── */}
        <div className="space-y-6">

          {/* ────────────────────────────────────────
              2. BALANCE HERO CARD
              ──────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="relative rounded-2xl overflow-hidden border border-[#C9A84C]/20"
            style={{
              background: "linear-gradient(135deg, #071A14 0%, #0B2218 60%, #061510 100%)",
              boxShadow: "0 0 60px -10px rgba(201,168,76,0.15), 0 0 40px -12px rgba(13,158,138,0.20), 0 4px 32px -4px rgba(0,0,0,0.6)",
            }}
          >
            {/* Ambient glows */}
            <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-[#C9A84C]/[0.08] blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-[#3B82F6]/[0.05] blur-3xl pointer-events-none" />

            <div className="relative p-5 md:p-6 space-y-5">
              {/* Row 1: label + controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-[#C9A84C]" />
                  <span className="text-xs text-[#5A6478] font-medium uppercase tracking-widest">{t("dashboard.balance")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {/* HTG / USD toggle */}
                  <div className="flex rounded-lg overflow-hidden border border-[#0D9E8A]/[0.25] text-[11px] font-bold">
                    {(["HTG", "USD"] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCurrency(c)}
                        className={`px-2.5 py-1 transition-all ${
                          currency === c
                            ? "bg-[#C9A84C] text-[#060D1F]"
                            : "text-[#5A6478] hover:text-[#A8B0C0]"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    title={balanceHidden ? "Show balance" : "Hide balance"}
                    onClick={() => setBalanceHidden((v) => !v)}
                    className="p-1.5 rounded-lg hover:bg-[#122B22] text-[#5A6478] transition-colors"
                  >
                    {balanceHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    title="Refresh"
                    onClick={() => loadData(true)}
                    className="p-1.5 rounded-lg hover:bg-[#122B22] text-[#5A6478] transition-colors"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Row 2: Big number */}
              <div>
                <AnimatePresence mode="wait">
                  {balanceHidden ? (
                    <motion.p
                      key="hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-4xl md:text-5xl font-black tracking-tight text-[#2A3448] select-none"
                    >
                      ●●●●●●
                    </motion.p>
                  ) : (
                    <motion.div
                      key="visible"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-baseline gap-2"
                    >
                      <span
                        className="text-4xl md:text-5xl font-black text-[#F0F1F5] tabular-nums tracking-tight"
                        style={{ textShadow: "0 0 40px rgba(201,168,76,0.25)" }}
                      >
                        {currency === "HTG"
                          ? fmtHTG(displayBalance)
                          : displayBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-xl font-bold text-[#C9A84C]">{currency}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                {currency === "HTG" && usdBal > 0 && (
                  <p className="text-xs text-[#3A4558] mt-1 flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    USD wallet: {usdBal.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD
                  </p>
                )}
                {currency === "USD" && (
                  <p className="text-xs text-[#3A4558] mt-1">≈ 1 USD = 130 HTG (est.)</p>
                )}
              </div>

              {/* Row 3: Balance breakdown */}
              <div className="grid grid-cols-3 gap-2">
                <StatPill label="Available" value={balanceHidden ? "••••" : fmtHTG(avail) + " HTG"} icon={CheckCircle2} colorClass="text-emerald-400" />
                <StatPill label="Pending"   value={balanceHidden ? "••••" : fmtHTG(held)  + " HTG"} icon={Clock}        colorClass="text-amber-400" />
                <StatPill label="Locked"    value={balanceHidden ? "••••" : "0.00 HTG"}              icon={Lock}         colorClass="text-[#6B7280]" />
              </div>

              {/* Row 4: 30-day sparkline */}
              {last30Days.some((d) => d.income > 0 || d.expense > 0) && (
                <div className="h-14">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={last30Days} barGap={1} barCategoryGap="15%">
                      <Bar dataKey="income"  fill="#22C55E" radius={[2, 2, 0, 0]} maxBarSize={5} />
                      <Bar dataKey="expense" fill="#EF4444" radius={[2, 2, 0, 0]} maxBarSize={5} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </motion.div>

          {/* ────────────────────────────────────────
              3. QUICK ACTIONS
              ──────────────────────────────────────── */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: t("send.title"),  icon: Send,          href: "/send",           gradient: "from-[#C9A84C] to-[#9F7F2C]", glow: "#C9A84C" },
              { label: "Request",       icon: ArrowDownLeft, href: "/recurring/create",gradient: "from-[#3B82F6] to-[#1D4ED8]", glow: "#3B82F6" },
              { label: t("pay.scanQr"), icon: QrCode,        href: "/pay",            gradient: "from-[#8B5CF6] to-[#6D28D9]", glow: "#8B5CF6" },
              { label: "K-Card",        icon: CreditCard,    href: "/card",           gradient: "from-[#10B981] to-[#059669]", glow: "#10B981" },
            ].map((a, i) => (
              <motion.button
                key={a.label}
                type="button"
                onClick={() => router.push(a.href)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.06 }}
                whileHover={{ scale: 1.06, y: -3 }}
                whileTap={{ scale: 0.96 }}
                className="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-[#0D9E8A]/[0.10] bg-[#0B1A16] hover:border-[#0D9E8A]/[0.12] transition-all"
                style={{ boxShadow: `0 4px 20px -8px ${a.glow}25` }}
              >
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${a.gradient} flex items-center justify-center`}
                  style={{ boxShadow: `0 4px 16px -2px ${a.glow}45` }}
                >
                  <a.icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-[11px] font-semibold text-[#7A8394] text-center leading-tight">{a.label}</span>
              </motion.button>
            ))}
          </div>

          {/* ────────────────────────────────────────
              5. FAMILY WALLET
              ──────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl border border-[#0D9E8A]/[0.12] bg-[#0B1A16]/80 p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[#F0F1F5] flex items-center gap-2">
                <Users className="h-4 w-4 text-[#C9A84C]" />
                K-Link Family
              </h2>
              <button
                type="button"
                onClick={() => router.push("/send")}
                className="text-[11px] text-[#C9A84C] font-semibold flex items-center gap-0.5 hover:text-[#E1C97A] transition-colors"
              >
                Send <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {family.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-[#122B22] flex items-center justify-center">
                  <Globe className="h-5 w-5 text-[#2A3448]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#3A4558]">Your financial bridge to Haiti</p>
                  <p className="text-xs text-[#2A3448] mt-0.5">Link family members for easy transfers</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                {family.slice(0, 4).map((m) => {
                  const name    = m.nickname || m.familyUser.firstName || "Family";
                  const lastAmt = m.recentTransfers[0]?.amount;
                  return (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="w-9 h-9 rounded-full bg-[#C9A84C]/10 flex items-center justify-center text-base shrink-0">
                        {RELATIONSHIP_EMOJI[m.relationship || "other"] ?? "👤"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-[#F0F1F5] truncate">{name}</p>
                          {m.isFavorite && <Star className="h-3 w-3 text-[#C9A84C] fill-[#C9A84C] shrink-0" />}
                        </div>
                        {m.familyUser.handle && (
                          <p className="text-[10px] text-[#2A3448]">@{m.familyUser.handle}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {lastAmt != null && (
                          <p className="text-xs font-semibold text-[#C9A84C] tabular-nums">
                            {fmtHTG(lastAmt)} HTG
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => router.push(`/send?recipientId=${m.familyUser.id}`)}
                          className="text-[10px] font-bold text-[#060D1F] bg-[#C9A84C] px-2 py-0.5 rounded-md hover:bg-[#E1C97A] transition-colors flex items-center gap-0.5"
                        >
                          <Send className="h-2.5 w-2.5" /> Send
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* ────────────────────────────────────────
              6. RECENT TRANSACTIONS
              ──────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.26 }}
            className="rounded-2xl border border-[#0D9E8A]/[0.12] bg-[#0B1A16]/80 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#0D9E8A]/[0.12]">
              <button
                type="button"
                onClick={() => router.push("/transactions")}
                className="text-sm font-bold text-[#F0F1F5] flex items-center gap-2 hover:text-[#C9A84C] transition-colors"
              >
                <Zap className="h-4 w-4 text-[#C9A84C]" /> {t("dashboard.recentActivity")}
              </button>
              <button
                type="button"
                onClick={() => router.push("/transactions")}
                className="text-[11px] text-[#C9A84C] font-semibold flex items-center gap-0.5 hover:text-[#E1C97A] transition-colors"
              >
                View All <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {transactions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <Wallet className="h-6 w-6 text-[#2A3448]" />
                <p className="text-sm text-[#3A4558]">{t("wallet.noTransactions")}</p>
              </div>
            ) : (
              <div className="divide-y divide-[#0D9E8A]/[0.06]">
                {transactions.slice(0, 8).map((tx) => {
                  const isPos   = Number(tx.amount) >= 0;
                  const isExp   = expandedTx === tx.id;
                  const label   = tx.description || tx.counterpartyName ||
                    (tx.type?.replace(/_/g, " ") ?? "Transaction");
                  return (
                    <div key={tx.id}>
                      <button
                        type="button"
                        onClick={() => setExpandedTx(isExp ? null : tx.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left"
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isPos ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                          {isPos
                            ? <ArrowDownRight className="h-4 w-4 text-emerald-400" />
                            : <ArrowUpRight   className="h-4 w-4 text-red-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#E0E4EE] truncate capitalize">{label}</p>
                          <p className="text-[10px] text-[#2A3448]">
                            {new Date(tx.createdAt).toLocaleDateString("en-US", {
                              month: "short", day: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-sm font-bold tabular-nums ${isPos ? "text-emerald-400" : "text-red-400"}`}>
                            {isPos ? "+" : ""}{fmtHTG(Number(tx.amount))} {tx.currency || "HTG"}
                          </p>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                            tx.status === "posted"  ? "bg-emerald-500/10 text-emerald-400" :
                            tx.status === "pending" ? "bg-amber-500/10 text-amber-400" :
                            "bg-[#122B22] text-[#3A4558]"
                          }`}>
                            {tx.status || "—"}
                          </span>
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExp && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-3 pt-1 flex gap-4 text-[10px] text-[#3A4558] border-t border-[#0D9E8A]/[0.06]">
                              <span>ID: <span className="font-mono text-[#2A3448]">{tx.id.slice(0, 18)}…</span></span>
                              <span>Type: <span className="text-[#5A6478]">{tx.type}</span></span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* ───────── RIGHT COLUMN ───────── */}
        <div className="space-y-6">

          {/* ────────────────────────────────────────
              4a. SPENDING INSIGHTS — Bar chart
              ──────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.14 }}
            className="rounded-2xl border border-[#0D9E8A]/[0.12] bg-[#0B1A16]/80 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-[#F0F1F5] flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#C9A84C]" /> Spending Insights
              </h2>
              <span className="text-[10px] text-[#5A7A6A] bg-[#0E2018] border border-[#0D9E8A]/[0.10] px-2 py-0.5 rounded-full">
                Last 30 days
              </span>
            </div>

            {/* Income vs Expenses summary */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/10">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                  <span className="text-[10px] text-emerald-400/70 uppercase tracking-wider">Income</span>
                </div>
                <p className="text-sm font-bold text-emerald-400 tabular-nums">+{fmtShort(totalIncome)}</p>
                <p className="text-[10px] text-emerald-400/50">HTG</p>
              </div>
              <div className="p-3 rounded-xl bg-red-500/[0.06] border border-red-500/10">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingDown className="h-3 w-3 text-red-400" />
                  <span className="text-[10px] text-red-400/70 uppercase tracking-wider">Expenses</span>
                </div>
                <p className="text-sm font-bold text-red-400 tabular-nums">-{fmtShort(totalSpend)}</p>
                <p className="text-[10px] text-red-400/50">HTG</p>
              </div>
            </div>

            {last30Days.some((d) => d.income > 0 || d.expense > 0) ? (
              <>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} barGap={2} barCategoryGap="30%">
                      <XAxis dataKey="name" tick={{ fill: "#2A3448", fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#2A3448", fontSize: 9 }} axisLine={false} tickLine={false} width={36} tickFormatter={fmtShort} />
                      <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                      <Bar dataKey="income"  name="Income"   fill="#22C55E" radius={[3, 3, 0, 0]} maxBarSize={12} />
                      <Bar dataKey="expense" name="Expenses" fill="#EF4444" radius={[3, 3, 0, 0]} maxBarSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-4 mt-1 text-[10px] text-[#2A3448]">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" />Income</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-red-500 inline-block" />Expenses</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <TrendingUp className="h-5 w-5 text-[#2A3448]" />
                <p className="text-xs text-[#2A3448]">No activity this month</p>
              </div>
            )}
          </motion.div>

          {/* ────────────────────────────────────────
              4b. SPENDING BREAKDOWN — Donut
              ──────────────────────────────────────── */}
          {categoryData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.22 }}
              className="rounded-2xl border border-[#0D9E8A]/[0.12] bg-[#0B1A16]/80 p-4"
            >
              <h2 className="text-sm font-bold text-[#F0F1F5] mb-4 flex items-center gap-2">
                <Wallet className="h-4 w-4 text-[#C9A84C]" /> Spending Breakdown
              </h2>

              <div className="flex items-center gap-4">
                <div className="h-36 w-36 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={34}
                        outerRadius={60}
                        paddingAngle={3}
                        dataKey="value"
                        labelLine={false}
                        label={CustomPieLabel}
                        animationBegin={0}
                        animationDuration={900}
                      >
                        {categoryData.map((entry, i) => (
                          <Cell key={i} fill={CATEGORY_COLORS[entry.name] ?? "#6B7280"} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex-1 space-y-2.5">
                  {categoryData.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: CATEGORY_COLORS[cat.name] ?? "#6B7280" }}
                        />
                        <span className="text-[11px] text-[#5A6478] truncate">{cat.name}</span>
                      </div>
                      <span className="text-[11px] font-bold text-[#A8B0C0] tabular-nums shrink-0">
                        {fmtShort(cat.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ────────────────────────────────────────
              7. SECURITY PANEL
              ──────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-2xl border border-[#0D9E8A]/[0.12] bg-[#0B1A16]/80 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-[#F0F1F5] flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#C9A84C]" /> Security
              </h2>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="h-2.5 w-2.5" /> Secure
              </span>
            </div>
            <div className="space-y-2 mb-3">
              {[
                { label: "Encryption",      value: "AES-256",    color: "text-emerald-400" },
                { label: "Identity",         value: profile.kycTier >= 2 ? "Verified" : profile.kycTier === 1 ? "Pending" : "Unverified",
                  color: profile.kycTier >= 2 ? "text-emerald-400" : "text-amber-400" },
                { label: "Account Status",  value: "Active",     color: "text-emerald-400" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between text-[11px]">
                  <span className="text-[#3A4558]">{row.label}</span>
                  <span className={`font-semibold ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => router.push("/settings/security")}
              className="w-full py-2 rounded-lg border border-[#C9A84C]/20 text-[11px] font-bold text-[#C9A84C] hover:bg-[#C9A84C]/5 transition-colors flex items-center justify-center gap-1.5"
            >
              <Shield className="h-3.5 w-3.5" /> Manage Security
            </button>
          </motion.div>

          {/* KYC banner */}
          {profile.kycTier < 2 && (
            <motion.button
              type="button"
              onClick={() => router.push("/verify")}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.36 }}
              whileHover={{ scale: 1.02 }}
              className="w-full text-left rounded-2xl border border-[#C9A84C]/20 bg-[#C9A84C]/[0.04] p-4 flex items-center gap-3 hover:bg-[#C9A84C]/[0.07] transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5 text-[#C9A84C]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#F0F1F5]">
                  {profile.kycTier === 0 ? "Verify Your Identity" : "Complete Verification"}
                </p>
                <p className="text-[11px] text-[#3A4558] mt-0.5">Unlock higher limits & K-Card access</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-[#C9A84C] shrink-0" />
            </motion.button>
          )}

          {/* No premium upsell for clients — KobKlein is fully free for clients */}

          {/* KleinAssist AI placeholder — hidden, activate later */}
          <div id="klein-assist-preview" style={{ display: "none" }} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

