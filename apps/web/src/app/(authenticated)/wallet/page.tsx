"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { apiGet } from "@/lib/api";
import { kkPost } from "@/lib/kobklein-api";
import { useToast } from "@kobklein/ui";
import {
  ArrowDownLeft, ArrowUpRight, Banknote, RefreshCw,
  Send, QrCode, CreditCard, Eye, EyeOff, TrendingUp,
  TrendingDown, Shield, Lock, ChevronRight, Wallet,
  ArrowRightLeft, Clock, Filter, Search, Wifi,
  Zap,
} from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

// ─── Types ─────────────────────────────────────────────────────────────────────

type TimelineItem = {
  id: string;
  type: "deposit" | "transfer_sent" | "transfer_received" | "withdrawal";
  amount: number;
  currency: string;
  detail: string;
  createdAt: string;
};

type BalanceInfo = {
  walletId: string;
  currency: string;
  type: string;
  balance: number;
  heldBalance?: number;
  availableBalance?: number;
};

type FilterType = "all" | "sent" | "received" | "deposit" | "withdrawal";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtHTG(n: number) {
  return Math.abs(n).toLocaleString("fr-HT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60)     return "Just now";
  if (s < 3600)   return `${Math.floor(s / 60)}m ago`;
  if (s < 86400)  return `${Math.floor(s / 3600)}h ago`;
  if (s < 172800) return "Yesterday";
  return new Date(d).toLocaleDateString("fr-HT", { day: "numeric", month: "short" });
}

function shortDate(d: string) {
  return new Date(d).toLocaleDateString("fr-HT", { day: "numeric", month: "short" });
}

const TX_CONFIG: Record<string, {
  label: string; icon: typeof Send;
  gradient: string; textColor: string; sign: "+" | "-"; bgDot: string;
}> = {
  deposit:           { label: "Deposit",   icon: ArrowDownLeft,  gradient: "from-emerald-500/20 to-emerald-500/5",  textColor: "#22C55E", sign: "+", bgDot: "bg-emerald-500/20" },
  transfer_sent:     { label: "Sent",      icon: ArrowUpRight,   gradient: "from-rose-500/20   to-rose-500/5",      textColor: "#F43F5E", sign: "-", bgDot: "bg-rose-500/20"    },
  transfer_received: { label: "Received",  icon: ArrowDownLeft,  gradient: "from-emerald-500/20 to-emerald-500/5", textColor: "#22C55E", sign: "+", bgDot: "bg-emerald-500/20" },
  withdrawal:        { label: "Cash Out",  icon: Banknote,       gradient: "from-amber-500/20  to-amber-500/5",     textColor: "#F59E0B", sign: "-", bgDot: "bg-amber-500/20"   },
};

// Build sparkline data from timeline (last 14 days)
function buildSparkline(timeline: TimelineItem[]) {
  const days: Record<string, number> = {};
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days[d.toDateString()] = 0;
  }
  for (const tx of timeline) {
    const d = new Date(tx.createdAt).toDateString();
    if (d in days) {
      const cfg = TX_CONFIG[tx.type];
      days[d] += cfg?.sign === "+" ? tx.amount : -tx.amount;
    }
  }
  return Object.entries(days).map(([date, delta], i) => ({
    i,
    label: new Date(date).toLocaleDateString("fr-HT", { day: "numeric", month: "short" }),
    value: Math.max(0, delta),
  }));
}

// ─── Animated number ──────────────────────────────────────────────────────────

function AnimatedBalance({ value, hidden }: { value: number; hidden: boolean }) {
  const [displayed, setDisplayed] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    if (hidden) return;
    const target = value;
    const duration = 800;
    const start = performance.now();
    const from = ref.current;

    function step(now: number) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const cur = from + (target - from) * eased;
      setDisplayed(cur);
      ref.current = cur;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [value, hidden]);

  if (hidden) {
    return (
      <span className="tracking-[0.3em] text-[#4A5A72]">
        ••••••••
      </span>
    );
  }

  return (
    <span>
      {fmtHTG(displayed)}
    </span>
  );
}

// ─── Custom tooltip for chart ─────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0E2018] border border-[#0D9E8A]/20 rounded-xl px-3 py-2 shadow-2xl">
      <p className="text-[10px] text-[#5A6B82] mb-0.5">{label}</p>
      <p className="text-sm font-bold text-[#C9A84C]">
        {fmtHTG(payload[0].value)} HTG
      </p>
    </div>
  );
}

// ─── Quick action button ──────────────────────────────────────────────────────

function QuickAction({
  icon: Icon, label, gradient, onClick,
}: {
  icon: typeof Send; label: string; gradient: string; onClick?: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="flex flex-col items-center gap-2 group"
    >
      <div
        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient}
                    flex items-center justify-center
                    border border-[#0D9E8A]/[0.20] shadow-lg
                    group-hover:border-[#0D9E8A]/[0.30] transition-all duration-200`}
      >
        <Icon className="h-5 w-5 text-[#E0E4EE]" />
      </div>
      <span className="text-[10px] font-semibold text-[#4A5A72] group-hover:text-[#B0BBCC] transition-colors">
        {label}
      </span>
    </motion.button>
  );
}

// ─── Transaction row ──────────────────────────────────────────────────────────

function TxRow({ item, index }: { item: TimelineItem; index: number }) {
  const cfg = TX_CONFIG[item.type] ?? TX_CONFIG.deposit;
  const Icon = cfg.icon;
  const isPos = cfg.sign === "+";

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="group flex items-center gap-3 px-4 py-3
                 hover:bg-[#122B22] rounded-xl transition-colors cursor-pointer"
    >
      {/* Icon dot */}
      <div className={`w-10 h-10 rounded-2xl ${cfg.bgDot} border border-[#0D9E8A]/[0.10]
                       flex items-center justify-center shrink-0`}>
        <Icon className="h-4 w-4" style={{ color: cfg.textColor }} />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#E0E4EE] truncate">{cfg.label}</span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#0E2018] text-[#4A5A72]">
            {item.currency}
          </span>
        </div>
        <p className="text-xs text-[#5A6B82] truncate mt-0.5">{item.detail || "—"}</p>
      </div>

      {/* Amount + time */}
      <div className="text-right shrink-0">
        <p
          className="text-sm font-bold tabular-nums"
          style={{ color: cfg.textColor }}
        >
          {cfg.sign}{fmtHTG(item.amount)}
        </p>
        <p className="text-[10px] text-[#5A6B82] mt-0.5 flex items-center justify-end gap-1">
          <Clock className="h-2.5 w-2.5" />
          {timeAgo(item.createdAt)}
        </p>
      </div>

      <ChevronRight className="h-3.5 w-3.5 text-[#4A5A72] group-hover:text-[#4A5A72] transition-colors shrink-0" />
    </motion.div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-lg bg-[#122B22] animate-pulse ${className}`} />
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WalletPage() {
  const router = useRouter();
  const toast  = useToast();

  const [balances,   setBalances]   = useState<BalanceInfo[]>([]);
  const [timeline,   setTimeline]   = useState<TimelineItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hidden,     setHidden]     = useState(false);
  const [filter,     setFilter]     = useState<FilterType>("all");
  const [search,     setSearch]     = useState("");
  const [locking,    setLocking]    = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const bal = await apiGet<{ balances: BalanceInfo[]; totalBalance?: number; availableBalance?: number; heldBalance?: number }>("v1/wallets/balance");
      // Merge top-level totals into the USER wallet entry
      const enriched = (bal.balances || []).map((b: BalanceInfo) =>
        b.type === "USER"
          ? {
              ...b,
              balance: bal.totalBalance ?? b.balance,
              availableBalance: bal.availableBalance,
              heldBalance: bal.heldBalance,
            }
          : b
      );
      setBalances(enriched);

      const primary = enriched.find((b) => b.type === "USER") ?? enriched[0];
      if (primary?.walletId) {
        const items = await apiGet<TimelineItem[]>(
          `v1/wallets/${primary.walletId}/timeline?limit=60`
        );
        setTimeline(Array.isArray(items) ? items : []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => {
    await load(true);
    toast.show("Wallet refreshed", "success");
  };

  const lockAccount = async () => {
    setLocking(true);
    try {
      await kkPost("security/freeze", {});
      toast.show("Account locked successfully", "success");
    } catch {
      toast.show("Failed to lock account", "error");
    } finally {
      setLocking(false);
    }
  };

  const mainWallet   = balances.find((b) => b.type === "USER");
  const totalBalance = mainWallet?.balance ?? 0;
  const available    = mainWallet?.availableBalance ?? totalBalance;
  const held         = mainWallet?.heldBalance ?? 0;

  // Income / expense summary from timeline
  const totalIn  = timeline.filter((t) => TX_CONFIG[t.type]?.sign === "+").reduce((s, t) => s + t.amount, 0);
  const totalOut = timeline.filter((t) => TX_CONFIG[t.type]?.sign === "-").reduce((s, t) => s + t.amount, 0);

  // Filtered + searched timeline
  const filtered = timeline.filter((t) => {
    const matchFilter =
      filter === "all"        ? true :
      filter === "sent"       ? t.type === "transfer_sent" :
      filter === "received"   ? t.type === "transfer_received" :
      filter === "deposit"    ? t.type === "deposit" :
      filter === "withdrawal" ? t.type === "withdrawal" :
      true;
    const matchSearch = search
      ? t.detail?.toLowerCase().includes(search.toLowerCase()) ||
        TX_CONFIG[t.type]?.label.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchFilter && matchSearch;
  });

  const sparkline = buildSparkline(timeline);

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: "all",        label: "All" },
    { key: "received",   label: "Received" },
    { key: "sent",       label: "Sent" },
    { key: "deposit",    label: "Deposits" },
    { key: "withdrawal", label: "Cash Out" },
  ];

  return (
    <div className="space-y-5 pb-8">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#F0F1F5]">My Wallet</h1>
          <p className="text-xs text-[#5A6B82] mt-0.5">Manage your funds &amp; activity</p>
        </div>
        <motion.button
          whileTap={{ rotate: 360 }}
          transition={{ duration: 0.5 }}
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 rounded-xl bg-[#122B22] border border-[#0D9E8A]/[0.12]
                     hover:bg-[#163528] transition-colors"
        >
          <RefreshCw className={`h-4 w-4 text-[#4A5A72] ${refreshing ? "animate-spin" : ""}`} />
        </motion.button>
      </div>

      {/* ── Physical Card ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex justify-start"
        style={{ perspective: "1200px" }}
      >
        <motion.div
          whileHover={{ rotateY: 3, rotateX: -2, scale: 1.015 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative rounded-2xl overflow-hidden select-none"
          style={{
            width: "340px",
            aspectRatio: "1.586 / 1",   /* standard credit-card ratio */
            background: "linear-gradient(135deg, #062820 0%, #0A3028 30%, #0D9E8A 65%, #0B7A6A 80%, #062820 100%)",
            boxShadow: "0 32px 80px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(13,158,138,0.30), 0 0 60px -20px rgba(13,158,138,0.35), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          {/* ── Noise texture overlay ── */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
               style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: "150px" }} />

          {/* ── Holographic shimmer diagonal ── */}
          <div className="absolute inset-0 pointer-events-none"
               style={{ background: "linear-gradient(125deg, transparent 20%, rgba(255,255,255,0.06) 40%, rgba(201,168,76,0.08) 50%, rgba(255,255,255,0.04) 60%, transparent 80%)" }} />

          {/* ── Top glow arc ── */}
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full pointer-events-none"
               style={{ background: "radial-gradient(circle, rgba(201,168,76,0.18) 0%, transparent 65%)" }} />

          {/* ── Bottom left teal glow ── */}
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full pointer-events-none"
               style={{ background: "radial-gradient(circle, rgba(13,158,138,0.20) 0%, transparent 65%)" }} />

          <div className="relative z-10 h-full flex flex-col justify-between p-4">

            {/* ── ROW 1: Brand + Contactless + Hide ── */}
            <div className="flex items-start justify-between">
              {/* Brand */}
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/logos/logo.png" alt="KobKlein" className="w-5 h-5 rounded-md object-contain" />
                <span className="text-[11px] font-black text-white/90 tracking-wide"
                      style={{ fontFamily: "'Playfair Display', serif" }}>
                  KobKlein
                </span>
              </div>

              {/* Right: contactless + hide + live */}
              <div className="flex items-center gap-2.5">
                {/* Contactless icon */}
                <Wifi className="h-4 w-4 text-white/40 rotate-90" />
                {/* Live pill */}
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] font-black text-emerald-400 tracking-widest">LIVE</span>
                </div>
                {/* Hide/show */}
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => setHidden((h) => !h)}
                  className="p-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] transition-colors"
                >
                  {hidden
                    ? <EyeOff className="h-3.5 w-3.5 text-white/50" />
                    : <Eye    className="h-3.5 w-3.5 text-white/50" />
                  }
                </motion.button>
              </div>
            </div>

            {/* ── ROW 2: Chip + Balance ── */}
            <div className="flex items-center justify-between">
              {/* EMV Chip */}
              <div className="w-8 h-6 rounded-md shrink-0"
                   style={{
                     background: "linear-gradient(135deg, #C9A84C 0%, #E2CA6E 40%, #9F7F2C 70%, #C9A84C 100%)",
                     boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.3)",
                   }}>
                {/* Chip lines */}
                <div className="w-full h-full grid grid-rows-3 gap-px p-1 opacity-40">
                  <div className="bg-[#9F7F2C] rounded-sm" />
                  <div className="grid grid-cols-3 gap-px">
                    <div className="bg-[#9F7F2C] rounded-sm" />
                    <div className="bg-transparent" />
                    <div className="bg-[#9F7F2C] rounded-sm" />
                  </div>
                  <div className="bg-[#9F7F2C] rounded-sm" />
                </div>
              </div>

              {/* Balance */}
              <div className="text-right">
                <p className="text-[9px] text-white/40 uppercase tracking-[0.18em] font-bold mb-0.5">
                  Total Balance
                </p>
                {loading ? (
                  <div className="h-8 w-36 rounded-lg bg-white/10 animate-pulse" />
                ) : (
                  <motion.div
                    key={hidden ? "h" : "s"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-end gap-1.5 justify-end"
                  >
                    <span className="text-2xl font-black tabular-nums leading-none text-white"
                          style={{ textShadow: "0 0 30px rgba(201,168,76,0.35)" }}>
                      <AnimatedBalance value={totalBalance} hidden={hidden} />
                    </span>
                    <span className="text-sm font-bold text-[#C9A84C] mb-0.5">HTG</span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* ── ROW 3: Card number + Available/Held ── */}
            <div className="flex items-end justify-between">
              {/* Card number */}
              <div>
                <p className="text-[11px] font-mono font-bold text-white/30 tracking-[0.22em] mb-1">
                  {mainWallet?.walletId
                    ? `•••• •••• •••• ${mainWallet.walletId.slice(-4)}`
                    : "•••• •••• •••• ••••"}
                </p>
                {/* Available + held */}
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-[8px] text-white/30 uppercase tracking-widest">Available</p>
                    <p className="text-xs font-bold text-emerald-300">
                      {hidden ? "••••" : `${fmtHTG(available)}`}
                    </p>
                  </div>
                  {held > 0 && (
                    <>
                      <div className="w-px h-5 bg-white/10" />
                      <div>
                        <p className="text-[8px] text-white/30 uppercase tracking-widest">On Hold</p>
                        <p className="text-xs font-bold text-amber-300">
                          {hidden ? "••••" : `${fmtHTG(held)}`}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Network logo — two overlapping circles like Mastercard */}
              <div className="flex items-center shrink-0">
                <div className="w-5 h-5 rounded-full opacity-80"
                     style={{ background: "#C9A84C", marginRight: "-7px" }} />
                <div className="w-5 h-5 rounded-full opacity-60"
                     style={{ background: "#0D9E8A" }} />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Sparkline (below card) ─────────────────────────────────────────────── */}
      {!loading && sparkline.some((d) => d.value > 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="h-14 rounded-2xl overflow-hidden border border-[#0D9E8A]/[0.12] bg-[#0B1A16]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkline} margin={{ top: 4, bottom: 0, left: 0, right: 0 }}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#C9A84C" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#C9A84C" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" hide />
              <YAxis hide />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="value" stroke="#C9A84C" strokeWidth={1.5}
                    fill="url(#goldGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* ── Quick actions ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        <QuickAction icon={Send}           label="Send"    gradient="from-blue-500/30 to-blue-600/20"     onClick={() => router.push("/send")} />
        <QuickAction icon={ArrowRightLeft} label="Request" gradient="from-purple-500/30 to-purple-600/20" onClick={() => router.push("/recurring/create")} />
        <QuickAction icon={QrCode}         label="K-Scan"  gradient="from-teal-500/30 to-teal-600/20"     onClick={() => router.push("/pay")} />
        <QuickAction icon={CreditCard}     label="K-Card"  gradient="from-[#C9A84C]/30 to-[#9F7F2C]/20" />
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Money in */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-4 border border-emerald-500/10"
          style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0.03) 100%)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold text-emerald-400/70 uppercase tracking-wider">Money In</span>
          </div>
          <p className="text-base font-black text-emerald-400 tabular-nums">
            {hidden ? "••••" : `${fmtHTG(totalIn)}`}
            <span className="text-[10px] ml-1 font-medium opacity-60">HTG</span>
          </p>
        </motion.div>

        {/* Money out */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl p-4 border border-rose-500/10"
          style={{ background: "linear-gradient(135deg, rgba(244,63,94,0.08) 0%, rgba(244,63,94,0.03) 100%)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-rose-500/15 flex items-center justify-center">
              <TrendingDown className="h-3 w-3 text-rose-400" />
            </div>
            <span className="text-[10px] font-bold text-rose-400/70 uppercase tracking-wider">Money Out</span>
          </div>
          <p className="text-base font-black text-rose-400 tabular-nums">
            {hidden ? "••••" : `${fmtHTG(totalOut)}`}
            <span className="text-[10px] ml-1 font-medium opacity-60">HTG</span>
          </p>
        </motion.div>
      </div>

      {/* ── Transaction history ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-3xl overflow-hidden border border-[#0D9E8A]/[0.12]"
        style={{ background: "linear-gradient(160deg, #0B1A16 0%, #081410 100%)" }}
      >
        {/* Section header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[#0D9E8A]/[0.10]">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#C9A84C]" />
            <h2 className="text-sm font-bold text-[#E0E4EE]">Recent Activity</h2>
            {timeline.length > 0 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#C9A84C]/10 text-[#C9A84C]">
                {timeline.length}
              </span>
            )}
          </div>
          <button
            onClick={() => {}}
            className="flex items-center gap-1 text-[10px] text-[#5A6B82] hover:text-[#7A8394] transition-colors"
          >
            <Filter className="h-3 w-3" />
            Filter
          </button>
        </div>

        {/* Search bar */}
        <div className="px-4 py-3 border-b border-[#0D9E8A]/[0.10]">
          <div className="flex items-center gap-2 bg-[#0B1A16] border border-[#0D9E8A]/[0.15]
                          rounded-xl px-3 h-9 focus-within:border-[#C9A84C]/30 transition-all">
            <Search className="h-3.5 w-3.5 text-[#5A6B82] shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transactions…"
              className="flex-1 bg-transparent text-sm text-[#E0E4EE] placeholder-[#3A4A60]
                         outline-none border-none text-xs"
            />
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto scrollbar-none border-b border-[#0D9E8A]/[0.10]">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-full transition-all duration-150
                ${filter === f.key
                  ? "bg-[#C9A84C] text-[#060D1F]"
                  : "bg-[#122B22] text-[#4A5A72] hover:bg-[#163528] hover:text-[#B0BBCC]"
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Transaction list */}
        <div className="divide-y divide-[#0D9E8A]/[0.06]">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1,2,3,4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2.5 w-36" />
                  </div>
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 gap-3"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#122B22] border border-[#0D9E8A]/[0.12]
                              flex items-center justify-center">
                <Wallet className="h-6 w-6 text-[#4A5A72]" />
              </div>
              <p className="text-sm text-[#5A6B82] font-medium">No transactions yet</p>
              <p className="text-xs text-[#4A5A72]">Your activity will appear here</p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {filtered.slice(0, 30).map((item, i) => (
                <TxRow key={item.id} item={item} index={i} />
              ))}
            </AnimatePresence>
          )}
        </div>

        {filtered.length > 30 && (
          <div className="px-4 py-3 border-t border-[#0D9E8A]/[0.10] text-center">
            <button className="text-xs text-[#C9A84C] hover:text-[#E2CA6E] font-semibold transition-colors">
              View all {filtered.length} transactions
            </button>
          </div>
        )}
      </motion.div>

      {/* ── Security panel ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-red-500/10 overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(239,68,68,0.02) 100%)" }}
      >
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Shield className="h-4 w-4 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#E0E4EE]">Emergency Lock</p>
              <p className="text-[10px] text-[#5A6B82]">Freeze your account instantly if compromised</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={lockAccount}
            disabled={locking}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                       bg-red-500/10 border border-red-500/20
                       hover:bg-red-500/20 hover:border-red-500/30
                       text-red-400 text-sm font-bold
                       transition-all duration-200 disabled:opacity-50"
          >
            <Lock className="h-4 w-4" />
            {locking ? "Locking…" : "Lock My Account"}
          </motion.button>
        </div>
      </motion.div>

    </div>
  );
}



