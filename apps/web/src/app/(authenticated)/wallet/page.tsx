"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { apiGet } from "@/lib/api";
import { kkPost } from "@/lib/kobklein-api";
import { useToast } from "@kobklein/ui";
import {
  ArrowDownLeft, ArrowUpRight, Banknote, RefreshCw,
  Send, QrCode, Eye, EyeOff, TrendingUp,
  TrendingDown, Shield, Lock, ChevronRight, Wallet,
  Clock, Filter, Search, Wifi,
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

const TX_CONFIG: Record<string, {
  label: string; icon: typeof Send;
  textColor: string; sign: "+" | "-"; bgDot: string;
}> = {
  deposit:           { label: "Deposit",   icon: ArrowDownLeft,  textColor: "#16C784", sign: "+", bgDot: "rgba(22,199,132,0.12)"  },
  transfer_sent:     { label: "Sent",      icon: ArrowUpRight,   textColor: "#FF74D4", sign: "-", bgDot: "rgba(255,116,212,0.12)" },
  transfer_received: { label: "Received",  icon: ArrowDownLeft,  textColor: "#16C784", sign: "+", bgDot: "rgba(22,199,132,0.12)"  },
  withdrawal:        { label: "Cash Out",  icon: Banknote,       textColor: "#D4AF37", sign: "-", bgDot: "rgba(212,175,55,0.12)"  },
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
      <span className="tracking-[0.3em]" style={{ color: "var(--dash-text-faint, #6E558B)" }}>
        ••••••••
      </span>
    );
  }

  return <span>{fmtHTG(displayed)}</span>;
}

// ─── Custom tooltip for chart ─────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 shadow-2xl"
         style={{ background: "var(--dash-shell-bg, #1C0A35)", border: "1px solid var(--dash-shell-border, rgba(165,150,201,0.28))" }}>
      <p className="text-[10px] mb-0.5" style={{ color: "var(--dash-text-faint, #6E558B)" }}>{label}</p>
      <p className="text-sm font-bold" style={{ color: "var(--dash-accent, #D4AF37)" }}>
        {fmtHTG(payload[0].value)} HTG
      </p>
    </div>
  );
}

// ─── Quick action button ──────────────────────────────────────────────────────

function QuickAction({
  icon: Icon, label, accentColor, onClick,
}: {
  icon: typeof Send; label: string; accentColor?: string; onClick?: () => void;
}) {
  const color = accentColor ?? "var(--dash-accent, #D4AF37)";
  return (
    <motion.button
      whileHover={{ scale: 1.06, y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="flex flex-col items-center gap-2 group"
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200"
        style={{
          background: `${color}18`,
          border: `1px solid ${color}30`,
        }}
      >
        <Icon className="h-5 w-5 transition-colors" style={{ color }} />
      </div>
      <span className="text-[10px] font-semibold transition-colors"
            style={{ color: "var(--dash-text-faint, #6E558B)" }}>
        {label}
      </span>
    </motion.button>
  );
}

// ─── Transaction row ──────────────────────────────────────────────────────────

function TxRow({ item, index }: { item: TimelineItem; index: number }) {
  const cfg = TX_CONFIG[item.type] ?? TX_CONFIG.deposit;
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="group flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer"
      style={{ ["--hover-bg" as string]: "var(--dash-shell-bg, #1C0A35)" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--dash-shell-bg, #1C0A35)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {/* Icon dot */}
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
        style={{ background: cfg.bgDot, border: `1px solid ${cfg.textColor}20` }}
      >
        <Icon className="h-4 w-4" style={{ color: cfg.textColor }} />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold truncate" style={{ color: "var(--dash-text-primary, #E6DBF7)" }}>
            {cfg.label}
          </span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: "var(--dash-shell-bg, #1C0A35)", color: "var(--dash-text-faint, #6E558B)" }}>
            {item.currency}
          </span>
        </div>
        <p className="text-xs truncate mt-0.5" style={{ color: "var(--dash-text-faint, #6E558B)" }}>
          {item.detail || "—"}
        </p>
      </div>

      {/* Amount + time */}
      <div className="text-right shrink-0">
        <p className="text-sm font-bold tabular-nums" style={{ color: cfg.textColor }}>
          {cfg.sign}{fmtHTG(item.amount)}
        </p>
        <p className="text-[10px] mt-0.5 flex items-center justify-end gap-1"
           style={{ color: "var(--dash-text-faint, #6E558B)" }}>
          <Clock className="h-2.5 w-2.5" />
          {timeAgo(item.createdAt)}
        </p>
      </div>

      <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-colors"
                    style={{ color: "var(--dash-text-faint, #6E558B)" }} />
    </motion.div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-lg animate-pulse ${className}`}
         style={{ background: "var(--dash-shell-bg, #1C0A35)" }} />
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

  const totalIn  = timeline.filter((t) => TX_CONFIG[t.type]?.sign === "+").reduce((s, t) => s + t.amount, 0);
  const totalOut = timeline.filter((t) => TX_CONFIG[t.type]?.sign === "-").reduce((s, t) => s + t.amount, 0);

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
          <h1 className="text-xl font-bold" style={{ color: "var(--dash-accent, #D4AF37)" }}>
            My Wallet
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--dash-text-faint, #6E558B)" }}>
            Manage your funds &amp; activity
          </p>
        </div>
        <motion.button
          whileTap={{ rotate: 360 }}
          transition={{ duration: 0.5 }}
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 rounded-xl transition-colors"
          style={{
            background: "var(--dash-shell-bg, #1C0A35)",
            border: "1px solid var(--dash-shell-border, rgba(165,150,201,0.28))",
          }}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                     style={{ color: "var(--dash-accent, #D4AF37)" }} />
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
            aspectRatio: "1.586 / 1",
            background: "linear-gradient(135deg, #1C0A35 0%, #2E1060 30%, #D4AF37 65%, #F0D060 80%, #1C0A35 100%)",
            boxShadow: "0 32px 80px -12px rgba(0,0,0,0.75), 0 0 0 1px rgba(212,175,55,0.30), 0 0 60px -20px rgba(212,175,55,0.40), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          {/* ── Noise texture overlay ── */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
               style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: "150px" }} />

          {/* ── Holographic shimmer diagonal ── */}
          <div className="absolute inset-0 pointer-events-none"
               style={{ background: "linear-gradient(125deg, transparent 20%, rgba(255,255,255,0.06) 40%, rgba(212,175,55,0.10) 50%, rgba(255,255,255,0.04) 60%, transparent 80%)" }} />

          {/* ── Top glow arc ── */}
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full pointer-events-none"
               style={{ background: "radial-gradient(circle, rgba(212,175,55,0.22) 0%, transparent 65%)" }} />

          {/* ── Bottom left purple glow ── */}
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full pointer-events-none"
               style={{ background: "radial-gradient(circle, rgba(138,80,200,0.25) 0%, transparent 65%)" }} />

          <div className="relative z-10 h-full flex flex-col justify-between p-4">

            {/* ── ROW 1: Brand + Contactless + Hide ── */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/logos/logo.png" alt="KobKlein" className="w-5 h-5 rounded-md object-contain" />
                <span className="text-[11px] font-black text-white/90 tracking-wide"
                      style={{ fontFamily: "'Playfair Display', serif" }}>
                  KobKlein
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <Wifi className="h-4 w-4 text-white/40 rotate-90" />
                {/* Live pill */}
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                     style={{ background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.30)" }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                  <span className="text-[9px] font-black tracking-widest text-[#D4AF37]">LIVE</span>
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
                     background: "linear-gradient(135deg, #D4AF37 0%, #F0D060 40%, #9F7F2C 70%, #D4AF37 100%)",
                     boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.3)",
                   }}>
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
                          style={{ textShadow: "0 0 30px rgba(212,175,55,0.40)" }}>
                      <AnimatedBalance value={totalBalance} hidden={hidden} />
                    </span>
                    <span className="text-sm font-bold text-[#D4AF37] mb-0.5">HTG</span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* ── ROW 3: Card number + Available/Held ── */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[11px] font-mono font-bold text-white/30 tracking-[0.22em] mb-1">
                  {mainWallet?.walletId
                    ? `•••• •••• •••• ${mainWallet.walletId.slice(-4)}`
                    : "•••• •••• •••• ••••"}
                </p>
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-[8px] text-white/30 uppercase tracking-widest">Available</p>
                    <p className="text-xs font-bold text-[#D4AF37]">
                      {hidden ? "••••" : `${fmtHTG(available)}`}
                    </p>
                  </div>
                  {held > 0 && (
                    <>
                      <div className="w-px h-5 bg-white/10" />
                      <div>
                        <p className="text-[8px] text-white/30 uppercase tracking-widest">On Hold</p>
                        <p className="text-xs font-bold text-[#A596C9]">
                          {hidden ? "••••" : `${fmtHTG(held)}`}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Network logo — two overlapping circles */}
              <div className="flex items-center shrink-0">
                <div className="w-5 h-5 rounded-full opacity-80"
                     style={{ background: "#D4AF37", marginRight: "-7px" }} />
                <div className="w-5 h-5 rounded-full opacity-60"
                     style={{ background: "#8A50C8" }} />
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
          className="h-14 rounded-2xl overflow-hidden"
          style={{
            background: "var(--dash-shell-bg, #1C0A35)",
            border: "1px solid var(--dash-shell-border, rgba(165,150,201,0.20))",
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkline} margin={{ top: 4, bottom: 0, left: 0, right: 0 }}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#D4AF37" stopOpacity={0.30} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" hide />
              <YAxis hide />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="value" stroke="#D4AF37" strokeWidth={1.5}
                    fill="url(#goldGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* ── Quick actions ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        <QuickAction icon={Send}          label="Send"     accentColor="#D4AF37"  onClick={() => router.push("/send")} />
        <QuickAction icon={ArrowDownLeft} label="Refill"   accentColor="#16C784"  onClick={() => router.push("/wallet/refill")} />
        <QuickAction icon={Banknote}      label="Cash Out" accentColor="#D4AF37"  onClick={() => router.push("/wallet/cashout")} />
        <QuickAction icon={QrCode}        label="K-Scan"   accentColor="#A596C9"  onClick={() => router.push("/pay")} />
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Money in */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-4"
          style={{
            background: "linear-gradient(135deg, rgba(22,199,132,0.08) 0%, rgba(22,199,132,0.03) 100%)",
            border: "1px solid rgba(22,199,132,0.15)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                 style={{ background: "rgba(22,199,132,0.15)" }}>
              <TrendingUp className="h-3 w-3 text-[#16C784]" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#16C784]">Money In</span>
          </div>
          <p className="text-base font-black tabular-nums text-[#16C784]">
            {hidden ? "••••" : `${fmtHTG(totalIn)}`}
            <span className="text-[10px] ml-1 font-medium opacity-60">HTG</span>
          </p>
        </motion.div>

        {/* Money out */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl p-4"
          style={{
            background: "linear-gradient(135deg, rgba(255,116,212,0.08) 0%, rgba(255,116,212,0.03) 100%)",
            border: "1px solid rgba(255,116,212,0.15)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                 style={{ background: "rgba(255,116,212,0.15)" }}>
              <TrendingDown className="h-3 w-3 text-[#FF74D4]" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF74D4]">Money Out</span>
          </div>
          <p className="text-base font-black tabular-nums text-[#FF74D4]">
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
        className="rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, var(--dash-shell-bg, #1C0A35) 0%, #160830 100%)",
          border: "1px solid var(--dash-shell-border, rgba(165,150,201,0.20))",
        }}
      >
        {/* Section header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3"
             style={{ borderBottom: "1px solid var(--dash-shell-border, rgba(165,150,201,0.12))" }}>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" style={{ color: "var(--dash-accent, #D4AF37)" }} />
            <h2 className="text-sm font-bold" style={{ color: "var(--dash-text-primary, #E6DBF7)" }}>
              Recent Activity
            </h2>
            {timeline.length > 0 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: "var(--dash-accent-muted, rgba(212,175,55,0.14))", color: "var(--dash-accent, #D4AF37)" }}>
                {timeline.length}
              </span>
            )}
          </div>
          <button
            onClick={() => {}}
            className="flex items-center gap-1 text-[10px] transition-colors"
            style={{ color: "var(--dash-text-faint, #6E558B)" }}
          >
            <Filter className="h-3 w-3" />
            Filter
          </button>
        </div>

        {/* Search bar */}
        <div className="px-4 py-3"
             style={{ borderBottom: "1px solid var(--dash-shell-border, rgba(165,150,201,0.12))" }}>
          <div className="flex items-center gap-2 rounded-xl px-3 h-9 transition-all"
               style={{
                 background: "var(--dash-page-bg, #240E3C)",
                 border: "1px solid var(--dash-shell-border, rgba(165,150,201,0.20))",
               }}>
            <Search className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--dash-text-faint, #6E558B)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transactions…"
              className="flex-1 bg-transparent text-xs outline-none border-none"
              style={{ color: "var(--dash-text-primary, #E6DBF7)" }}
            />
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto scrollbar-none"
             style={{ borderBottom: "1px solid var(--dash-shell-border, rgba(165,150,201,0.12))" }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-full transition-all duration-150"
              style={filter === f.key
                ? { background: "var(--dash-accent, #D4AF37)", color: "#0D0520" }
                : { background: "var(--dash-page-bg, #240E3C)", color: "var(--dash-text-muted, #A596C9)", border: "1px solid var(--dash-shell-border, rgba(165,150,201,0.18))" }
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Transaction list */}
        <div style={{ ["--divider" as string]: "var(--dash-shell-border, rgba(165,150,201,0.10))" }}>
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
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                   style={{ background: "var(--dash-page-bg, #240E3C)", border: "1px solid var(--dash-shell-border, rgba(165,150,201,0.20))" }}>
                <Wallet className="h-6 w-6" style={{ color: "var(--dash-text-faint, #6E558B)" }} />
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--dash-text-muted, #A596C9)" }}>
                No transactions yet
              </p>
              <p className="text-xs" style={{ color: "var(--dash-text-faint, #6E558B)" }}>
                Your activity will appear here
              </p>
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
          <div className="px-4 py-3 text-center"
               style={{ borderTop: "1px solid var(--dash-shell-border, rgba(165,150,201,0.12))" }}>
            <button className="text-xs font-semibold transition-colors"
                    style={{ color: "var(--dash-accent, #D4AF37)" }}>
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
        className="rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(239,68,68,0.07) 0%, rgba(239,68,68,0.02) 100%)",
          border: "1px solid rgba(239,68,68,0.15)",
        }}
      >
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                 style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.20)" }}>
              <Shield className="h-4 w-4 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--dash-text-primary, #E6DBF7)" }}>
                Emergency Lock
              </p>
              <p className="text-[10px]" style={{ color: "var(--dash-text-faint, #6E558B)" }}>
                Freeze your account instantly if compromised
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={lockAccount}
            disabled={locking}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                       text-red-400 text-sm font-bold
                       transition-all duration-200 disabled:opacity-50"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.22)",
            }}
          >
            <Lock className="h-4 w-4" />
            {locking ? "Locking…" : "Lock My Account"}
          </motion.button>
        </div>
      </motion.div>

    </div>
  );
}
