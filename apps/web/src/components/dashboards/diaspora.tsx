"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { apiGet } from "@/lib/api";
import { KIdCard } from "@/components/kid-card";
import { kkPost, kkPatch, kkGet } from "@/lib/kobklein-api";
import { useToast } from "@kobklein/ui";
import {
  ArrowUpRight, Calendar, CheckCircle2, Crown, Globe, Heart,
  Plus, Send, Shield, Star, Users, Wallet, Zap, TrendingUp,
  RefreshCw, Eye, EyeOff, ChevronRight, Bell, Receipt,
  ArrowDownLeft, ArrowUpLeft, MoreHorizontal, MapPin,
  Sparkles, Clock, DollarSign, X, Siren, AlertCircle,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
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
    planTier?: number;
  };
};

type FamilyMember = {
  id: string;
  nickname?: string;
  relationship?: string;
  isFavorite?: boolean;
  familyUser: {
    id: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    handle?: string;
  };
  recentTransfers: { id: string; amount: number; createdAt: string }[];
};

type DashboardData = {
  familyCount: number;
  balance: number;
  totalSentToFamily: number;
  pendingRequests: { id: string; amount: number; requester: { firstName?: string } }[];
};

// ─── Design tokens — Diaspora: Royal Purple (per mockup #240E3C palette) ──────

const D = {
  bg:        "#240E3C",   // mockup primary dark
  bg2:       "#2A1248",
  bg3:       "#382057",   // mockup primary mid
  card:      "#2D1450",
  panel:     "#321858",
  panel2:    "#3A2060",
  border:    "rgba(138,80,200,0.20)",
  border2:   "rgba(138,80,200,0.10)",
  border3:   "rgba(138,80,200,0.35)",
  accent:    "#A596C9",   // neutral UI text — mockup
  accentDim: "#6E558B",  // neutral UI text dim — mockup
  gold:      "#C9A84C",  // Imperial Gold (CSS primary)
  goldL:     "#C9A84C",  // Imperial Gold (light)
  goldD:     "#C9A84C",  // Imperial Gold (dark)
  text:      "#E6DBF7",  // neutral UI text — mockup
  muted:     "#A596C9",
  dimmed:    "#6E558B",
  success:   "#16C784",  // indicator success — mockup
  expense:   "#FF74D4",  // indicator expense — mockup
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RELATIONSHIP_LABELS: Record<string, string> = {
  parent: "Manman/Papa", child: "Pitit", sibling: "Frè/Sè",
  spouse: "Mari/Madanm", cousin: "Kouzen/Kouzin", other: "Fanmi",
};

const FAMILY_EMOJIS: Record<string, string> = {
  parent: "👩", child: "👧", sibling: "🧑", spouse: "💑", cousin: "🤝", other: "👤",
};

const MEMBER_COLORS = [
  { from: "#C9A84C", to: "#C9A84C" },
  { from: "#9B6DC8", to: "#6E3FA0" },
  { from: "#6366F1", to: "#4F46E5" },
  { from: "#F97316", to: "#EA580C" },
  { from: "#EC4899", to: "#DB2777" },
];

function getMemberColor(idx: number) {
  return MEMBER_COLORS[idx % MEMBER_COLORS.length];
}

function getInitials(m: FamilyMember) {
  const name = m.nickname || m.familyUser.firstName || "?";
  return name.slice(0, 2).toUpperCase();
}

function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  const start = useRef<number | null>(null);
  useEffect(() => {
    if (!target) { setVal(0); return; }
    start.current = null;
    let raf: number;
    function tick(ts: number) {
      if (!start.current) start.current = ts;
      const p = Math.min((ts - start.current) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * ease));
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

// Remittance chart data (fetched from API)
type RemittanceMonth = { month: string; sent: number; savedVsWesternUnion: number };
type TimelineEntry = { id: string; amount: number; type: string; currency: string; createdAt: string; counterpart?: { name: string } };

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs"
      style={{ background: D.card, border: `1px solid ${D.border}` }}>
      <p className="mb-1" style={{ color: D.muted }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="font-bold" style={{ color: p.color }}>
          ${p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DiasporaDashboard({ profile }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [family, setFamily] = useState<FamilyMember[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addPhone, setAddPhone] = useState("");
  const [addNickname, setAddNickname] = useState("");
  const [addRelationship, setAddRelationship] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hideBalance, setHideBalance] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"family" | "activity">("family");
  const [remittanceData, setRemittanceData] = useState<RemittanceMonth[]>([]);
  const [recentActivity, setRecentActivity] = useState<TimelineEntry[]>([]);
  const [fxRate, setFxRate] = useState<{ mid: number; buy: number } | null>(null);
  const [emergencyModal, setEmergencyModal] = useState(false);
  const [emergencyAmount, setEmergencyAmount] = useState("");
  const [emergencyLoading, setEmergencyLoading] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [dash, members, remit, timeline, fx] = await Promise.allSettled([
        apiGet<DashboardData>("v1/family/dashboard"),
        apiGet<FamilyMember[]>("v1/family/members"),
        kkGet<{ months: RemittanceMonth[] }>("v1/diaspora/remittance-history?months=6"),
        kkGet<{ entries: TimelineEntry[] }>("v1/wallets/timeline?limit=10"),
        kkGet<{ mid: number; buy: number; sell: number; updatedAt: string }>("v1/fx/rates/live?from=USD&to=HTG"),
      ]);
      if (dash.status === "fulfilled") setDashboard(dash.value);
      if (members.status === "fulfilled") setFamily(members.value);
      if (remit.status === "fulfilled") setRemittanceData(remit.value.months ?? []);
      if (timeline.status === "fulfilled") setRecentActivity(timeline.value.entries ?? []);
      if (fx.status === "fulfilled") setFxRate({ mid: fx.value.mid, buy: fx.value.buy });
    } catch (e: unknown) {
      console.error("Failed to load diaspora dashboard:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);


  async function handleRefresh() {
    setRefreshing(true);
    await load(true);
  }

  async function handleAddFamily() {
    if (!addPhone) return;
    setAddLoading(true);
    try {
      await kkPost("v1/family/link", {
        phoneOrHandle: addPhone,
        nickname: addNickname || undefined,
        relationship: addRelationship || undefined,
      });
      setShowAddForm(false);
      setAddPhone(""); setAddNickname(""); setAddRelationship("");
      toast.show("Family member added!", "success");
      load(true);
    } catch (e: unknown) {
      const message = typeof e === "object" && e && "message" in e ? (e as any).message : undefined;
      toast.show(message || "Failed to add family member", "error");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleToggleFavorite(member: FamilyMember) {
    try {
      await kkPatch(`v1/family/${member.id}`, { isFavorite: !member.isFavorite });
      setFamily((prev) => prev.map((m) => m.id === member.id ? { ...m, isFavorite: !m.isFavorite } : m));
      toast.show(member.isFavorite ? "Removed from favorites" : "Added to favorites!", "success");
    } catch (e: unknown) {
      const message = typeof e === "object" && e && "message" in e ? (e as any).message : undefined;
      toast.show(message || "Failed to update", "error");
    }
  }

  async function handleEmergencySend() {
    const amt = parseFloat(emergencyAmount);
    if (!amt || amt <= 0) return;
    setEmergencyLoading(true);
    try {
      await kkPost("v1/family/emergency-send", { amountUsd: amt });
      toast.show("Emergency funds sent!", "success");
      setEmergencyModal(false);
      setEmergencyAmount("");
      load(true);
    } catch (e: unknown) {
      const message = typeof e === "object" && e && "message" in e ? (e as any).message : undefined;
      toast.show(message || "Emergency send failed. Check emergency contact is set.", "error");
    } finally {
      setEmergencyLoading(false);
    }
  }

  const sortedFamily = [...family].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    const nameA = a.nickname || a.familyUser.firstName || "";
    const nameB = b.nickname || b.familyUser.firstName || "";
    return nameA.localeCompare(nameB);
  });

  const balance = dashboard?.balance ?? 0;
  const totalSent = dashboard?.totalSentToFamily ?? 0;
  const familyCount = dashboard?.familyCount ?? 0;
  const pendingRequests = dashboard?.pendingRequests ?? [];

  const animBalance = useCountUp(loading ? 0 : balance);
  const animSent = useCountUp(loading ? 0 : totalSent);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Bonjou" : hour < 17 ? "Bon apremidi" : "Bonswa";
  const name = profile.firstName ? `, ${profile.firstName}` : "";

  // Map real API remittance data to chart format (rename savedVsWesternUnion → saved)
  const chartData = remittanceData.map((r) => ({
    month: r.month,
    sent: r.sent,
    saved: r.savedVsWesternUnion,
  }));

  // Map real timeline entries to activity display format
  const activityItems = recentActivity.slice(0, 5).map((entry, i) => ({
    id: entry.id,
    name: entry.counterpart?.name || "Transfer",
    type: entry.type === "send" ? "Sent" : entry.type === "receive" ? "Received" : "Transfer",
    amount: entry.amount,
    currency: entry.currency || "USD",
    date: new Date(entry.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    color: getMemberColor(i),
  }));

  return (
    <div className="space-y-5 pb-8" data-dashboard="diaspora">

      {/* ── TOP HEADER ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest mb-1"
            style={{ color: D.muted }}>
            <Globe className="h-3 w-3" />
            KobKlein Diaspora
          </div>
          <h1 className="text-2xl font-black" style={{ color: D.text }}>
            {greeting}{name}! 👋
          </h1>
          <p className="text-xs mt-0.5" style={{ color: D.dimmed }}>
            Your family in Haiti is connected
          </p>
        </div>

        {/* Badges + refresh */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1.5">
            {profile.planName ? (
              <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full"
                style={{ background: `${D.gold}25`, color: D.gold, border: `1px solid ${D.gold}40` }}>
                <Crown className="h-2.5 w-2.5" />{profile.planName}
              </span>
            ) : (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: D.panel, color: D.muted, border: `1px solid ${D.border}` }}>Free</span>
            )}
            {profile.kycTier >= 2 && (
              <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full"
                style={{ background: "rgba(16,185,129,0.12)", color: "#10B981", border: "1px solid rgba(16,185,129,0.2)" }}>
                <CheckCircle2 className="h-2.5 w-2.5" />Verified
              </span>
            )}
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleRefresh}
            className="p-1.5 rounded-lg transition-colors"
            style={{ background: D.panel, border: `1px solid ${D.border}`, color: D.muted }}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </motion.button>
        </div>
      </motion.div>

      {/* ── PENDING REQUESTS BANNER ─────────────────────────────────── */}
      <AnimatePresence>
        {pendingRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl border border-amber-500/[0.25] overflow-hidden"
            style={{ background: "rgba(245,158,11,0.06)" }}
          >
            <div className="p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <Bell className="h-4 w-4 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#F0F1F5]">
                  {pendingRequests.length} Family Request{pendingRequests.length > 1 ? "s" : ""}
                </p>
                <p className="text-xs text-amber-400/70">
                  {pendingRequests.map(r => r.requester.firstName || "Family").join(", ")} need{pendingRequests.length === 1 ? "s" : ""} support
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/send")}
                className="text-xs font-bold px-3 py-1.5 rounded-xl"
                style={{ background: `linear-gradient(135deg, ${D.goldL}, ${D.gold})`, color: D.bg }}
              >
                Review
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── K-ID Identity Card ────────────────────────────────────────── */}
      <KIdCard compact profile={profile} />

      {/* ── MAIN CONTENT: 2-col on md+ ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-5">

        {/* LEFT COLUMN */}
        <div className="space-y-5">

          {/* ── BALANCE HERO CARD ────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="relative rounded-3xl overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${D.bg} 0%, ${D.bg2} 40%, ${D.bg3} 70%, ${D.bg} 100%)`,
              boxShadow: `0 24px 60px -12px rgba(0,0,0,0.7), 0 0 0 1px ${D.border}`,
            }}
          >
            {/* Ambient glows */}
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20 pointer-events-none"
              style={{ background: `radial-gradient(circle, ${D.gold} 0%, transparent 70%)`, transform: "translate(30%, -30%)" }} />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10 pointer-events-none"
              style={{ background: `radial-gradient(circle, ${D.accent} 0%, transparent 70%)`, transform: "translate(-20%, 20%)" }} />

            <div className="relative p-5">
              {/* Row 1: Label + actions */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] font-bold" style={{ color: D.muted }}>Global Reserve Balance</p>
                  {dashboard && (
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px]" style={{ color: D.dimmed }}>≈ HTG</span>
                      <span className="text-[10px] font-bold" style={{ color: D.muted }}>
                        {(balance * (fxRate?.mid ?? 130)).toLocaleString("fr-HT")}
                      </span>
                      {fxRate && (
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                          style={{ background: `${D.success}18`, color: D.success, border: `1px solid ${D.success}25` }}
                        >
                          1 USD = {fxRate.mid.toFixed(1)} HTG
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setHideBalance(b => !b)}
                    className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] transition-colors"
                  >
                    {hideBalance
                      ? <EyeOff className="h-3.5 w-3.5" style={{ color: D.muted }} />
                      : <Eye className="h-3.5 w-3.5" style={{ color: D.muted }} />}
                  </button>
                </div>
              </div>

              {/* Balance display */}
              <div className="mb-5">
                <AnimatePresence mode="wait">
                  {hideBalance ? (
                    <motion.p
                      key="hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-4xl font-black tracking-widest"
                      style={{ color: D.muted }}
                    >
                      ●●●●●●
                    </motion.p>
                  ) : (
                    <motion.div
                      key="shown"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <span
                        className="text-4xl font-black tabular-nums"
                        style={{
                          background: `linear-gradient(135deg, ${D.goldL}, ${D.gold}, ${D.goldD})`,
                          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                        }}
                      >
                        ${loading ? "—" : animBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-lg font-bold ml-2" style={{ color: `${D.gold}80` }}>USD</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Stat pills */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: "K-Link Family", value: loading ? "—" : familyCount.toString(), icon: Users, color: D.accent },
                  { label: "Today's Transfers", value: loading ? "—" : `$${animSent.toLocaleString()}`, icon: Send, color: D.gold },
                  { label: "Family Connect", value: pendingRequests.length.toString(), icon: Clock, color: pendingRequests.length > 0 ? "#F59E0B" : D.dimmed },
                ].map((s) => (
                  <div key={s.label}
                    className="rounded-xl px-3 py-2 flex flex-col gap-1"
                    style={{ background: `${D.panel}CC`, border: `1px solid ${D.border2}` }}>
                    <s.icon className="h-3.5 w-3.5" style={{ color: s.color }} />
                    <p className="text-sm font-black tabular-nums" style={{ color: D.text }}>{s.value}</p>
                    <p className="text-[9px] uppercase tracking-wide font-bold" style={{ color: D.dimmed }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Emergency Send — Voye Pou Yo */}
              <motion.button
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setEmergencyModal(true)}
                className="flex items-center justify-between w-full rounded-2xl px-4 py-3 mb-3 transition-all"
                style={{
                  background: "linear-gradient(135deg, rgba(220,38,38,0.10), rgba(201,168,76,0.06))",
                  border: "1px solid rgba(220,38,38,0.22)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(220,38,38,0.14)", border: "1px solid rgba(220,38,38,0.28)" }}>
                    <Siren className="h-4 w-4 text-red-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-[#F87171]">Voye Pou Yo — Emergency Send</p>
                    <p className="text-[9px]" style={{ color: D.dimmed }}>
                      Instant · No PIN · Daily limit $200 · Emergency contact only
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-red-400 shrink-0" />
              </motion.button>

              {/* Quick Actions */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Transfer", icon: Send, href: "/send", gold: true },
                  { label: "Schedule", icon: Calendar, href: "/recurring", gold: false },
                  { label: "Wallet", icon: Wallet, href: "/wallet", gold: false },
                  { label: "Family", icon: Users, href: "/manage-family", gold: false },
                ].map((a) => (
                  <motion.button
                    key={a.label}
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push(a.href)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all"
                    style={a.gold
                      ? { background: `linear-gradient(135deg, ${D.goldL}30, ${D.gold}18)`, border: `1px solid ${D.gold}50` }
                      : { background: `${D.panel}AA`, border: `1px solid ${D.border2}` }}
                  >
                    <a.icon className="h-4 w-4" style={{ color: a.gold ? D.gold : D.accent }} />
                    <span className="text-[9px] font-bold uppercase tracking-wide"
                      style={{ color: a.gold ? D.gold : D.muted }}>
                      {a.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── FAMILY WALLET + ACTIVITY TABS ───────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl overflow-hidden"
            style={{ background: `linear-gradient(160deg, ${D.card} 0%, ${D.bg} 100%)`, border: `1px solid ${D.border}` }}
          >
            {/* Tab bar */}
            <div className="flex" style={{ borderBottom: `1px solid ${D.border2}` }}>
              {[
                { key: "family", label: "Family Wallet", icon: Heart },
                { key: "activity", label: "Recent Activity", icon: Receipt },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key as any)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-bold transition-all border-b-2"
                  style={activeTab === t.key
                    ? { borderBottomColor: D.gold, color: D.gold }
                    : { borderBottomColor: "transparent", color: D.dimmed }}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-4">
              <AnimatePresence mode="wait">
                {/* FAMILY TAB */}
                {activeTab === "family" && (
                  <motion.div
                    key="family"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-3"
                  >
                    {/* Header row */}
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] uppercase tracking-[0.15em] font-bold" style={{ color: D.dimmed }}>
                        {familyCount} member{familyCount !== 1 ? "s" : ""} linked
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowAddForm(v => !v)}
                        className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all"
                        style={{ background: `${D.gold}18`, color: D.gold, border: `1px solid ${D.gold}30` }}
                      >
                        {showAddForm ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                        {showAddForm ? "Cancel" : "Add"}
                      </motion.button>
                    </div>

                    {/* Add Form */}
                    <AnimatePresence>
                      {showAddForm && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="rounded-2xl p-4 space-y-3"
                            style={{ background: D.panel, border: `1px solid ${D.border}` }}>
                            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: D.muted }}>Link Family Member</p>
                            {[
                              { ph: "Phone or K-Tag (@handle)", val: addPhone, set: setAddPhone, type: "text" },
                              { ph: "Nickname (e.g. Manman)", val: addNickname, set: setAddNickname, type: "text" },
                            ].map((f, i) => (
                              <input
                                key={i}
                                type={f.type}
                                placeholder={f.ph}
                                value={f.val}
                                onChange={e => f.set(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                                style={{ background: D.panel2, border: `1px solid ${D.border}`, color: D.text }}
                              />
                            ))}
                            <select
                              value={addRelationship}
                              onChange={e => setAddRelationship(e.target.value)}
                              title="Select relationship"
                              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
                              style={{ background: D.panel2, border: `1px solid ${D.border}`, color: D.text }}
                            >
                              <option value="">Relationship</option>
                              {Object.entries(RELATIONSHIP_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                              ))}
                            </select>
                            <motion.button
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={handleAddFamily}
                              disabled={!addPhone || addLoading}
                              className="w-full py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                              style={{ background: `linear-gradient(135deg, ${D.goldL}, ${D.gold})`, color: D.bg }}
                            >
                              {addLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                              Add to K-Link
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Family List */}
                    {loading ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: D.panel }} />
                        ))}
                      </div>
                    ) : sortedFamily.length === 0 ? (
                      <div className="py-8 flex flex-col items-center gap-3 text-center">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                          style={{ background: `${D.accent}14`, border: `1px solid ${D.border}` }}>
                          <Globe className="h-6 w-6" style={{ color: `${D.accent}80` }} />
                        </div>
                        <p className="text-sm" style={{ color: D.dimmed }}>No family linked yet</p>
                        <p className="text-xs" style={{ color: D.accentDim }}>Add your family in Haiti for easy transfers</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {sortedFamily.map((member, idx) => {
                          const col = getMemberColor(idx);
                          const initials = getInitials(member);
                          const lastSent = member.recentTransfers[0];
                          return (
                            <motion.div
                              key={member.id}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.04 }}
                              className="flex items-center gap-3 p-3 rounded-2xl transition-colors"
                              style={{ background: D.panel, border: `1px solid ${D.border2}` }}
                            >
                              {/* Avatar */}
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0"
                                style={{ background: `linear-gradient(135deg, ${col.from}, ${col.to})` }}>
                                {initials}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-bold truncate" style={{ color: D.text }}>
                                    {member.nickname || member.familyUser.firstName || "Family"}
                                  </span>
                                  {member.relationship && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0"
                                      style={{ background: `${col.from}18`, color: col.from }}>
                                      {RELATIONSHIP_LABELS[member.relationship] || member.relationship}
                                    </span>
                                  )}
                                  {member.isFavorite && (
                                    <Star className="h-3 w-3 shrink-0" style={{ color: D.gold, fill: D.gold }} />
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <p className="text-xs truncate" style={{ color: D.dimmed }}>
                                    {member.familyUser.handle ? `@${member.familyUser.handle}` : member.familyUser.phone || ""}
                                  </p>
                                  {lastSent && (
                                    <p className="text-[10px] shrink-0" style={{ color: D.accentDim }}>
                                      Last: ${lastSent.amount}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => handleToggleFavorite(member)}
                                  className="p-1.5 rounded-lg transition-colors"
                                  style={{ background: `${D.accent}12` }}
                                >
                                  <Star className="h-3.5 w-3.5"
                                    style={{ color: member.isFavorite ? D.gold : D.dimmed, fill: member.isFavorite ? D.gold : "none" }} />
                                </button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => router.push(
                                    `/send?recipientId=${member.familyUser.id}&name=${encodeURIComponent(
                                      member.nickname || member.familyUser.firstName || "Family"
                                    )}`
                                  )}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-[10px] transition-all"
                                  style={{ background: `linear-gradient(135deg, ${D.goldL}, ${D.gold})`, color: D.bg }}
                                >
                                  <Send className="h-3 w-3" />
                                  Send
                                </motion.button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ACTIVITY TAB */}
                {activeTab === "activity" && (
                  <motion.div
                    key="activity"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-2"
                  >
                    {activityItems.length === 0 ? (
                      <div className="py-8 text-center text-sm" style={{ color: D.dimmed }}>No recent activity</div>
                    ) : (
                      activityItems.map((a, i) => (
                        <motion.div
                          key={a.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="flex items-center gap-3 p-3 rounded-2xl"
                          style={{ background: D.panel, border: `1px solid ${D.border2}` }}
                        >
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0"
                            style={{ background: `linear-gradient(135deg, ${a.color.from}, ${a.color.to})` }}>
                            {a.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold" style={{ color: D.text }}>{a.type}</p>
                            <p className="text-xs" style={{ color: D.dimmed }}>→ {a.name}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-black" style={{ color: D.gold }}>+${a.amount}</p>
                            <p className="text-[10px]" style={{ color: D.accentDim }}>{a.date}</p>
                          </div>
                        </motion.div>
                      ))
                    )}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => router.push("/wallet")}
                      className="w-full py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      style={{ color: D.muted, border: `1px solid ${D.border2}` }}
                    >
                      View Full History <ChevronRight className="h-3.5 w-3.5" />
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* ── QUICK NAV ────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-3 gap-3"
          >
            {[
              { label: "Transfer Money", sub: "Instant transfer", href: "/send", icon: Send, color: D.gold },
              { label: "Schedule", sub: "Recurring remit", href: "/recurring", icon: Calendar, color: D.accent },
              { label: "Wallet", sub: "Balance & history", href: "/wallet", icon: Wallet, color: "#9F8AE0" },
            ].map((item) => (
              <motion.button
                key={item.href}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push(item.href)}
                className="flex flex-col gap-2.5 p-4 rounded-2xl text-left transition-all"
                style={{ background: D.card, border: `1px solid ${D.border2}` }}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: `${item.color}18`, border: `1px solid ${item.color}25` }}>
                  <item.icon className="h-4 w-4" style={{ color: item.color }} />
                </div>
                <div>
                  <p className="text-xs font-bold" style={{ color: D.text }}>{item.label}</p>
                  <p className="text-[10px]" style={{ color: D.dimmed }}>{item.sub}</p>
                </div>
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-5">

          {/* ── LIVE FX RATE CARD ────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${D.card} 0%, ${D.bg} 100%)`, border: `1px solid ${D.border}` }}
          >
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${D.success}14`, border: `1px solid ${D.success}22` }}>
                  <TrendingUp className="h-3.5 w-3.5" style={{ color: D.success }} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] font-bold" style={{ color: D.dimmed }}>Live Exchange Rate</p>
                  {fxRate ? (
                    <p className="text-sm font-black tabular-nums" style={{ color: D.text }}>
                      1 USD ={" "}
                      <span style={{ color: D.gold }}>{fxRate.mid.toFixed(2)} HTG</span>
                    </p>
                  ) : (
                    <p className="text-sm font-black" style={{ color: D.dimmed }}>Loading…</p>
                  )}
                </div>
              </div>
              {fxRate && (
                <div className="text-right">
                  <p className="text-[9px] font-bold px-2 py-1 rounded-full"
                    style={{ background: `${D.success}14`, color: D.success, border: `1px solid ${D.success}22` }}>
                    Buy {fxRate.buy.toFixed(1)}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* ── REMITTANCE INSIGHTS ──────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl overflow-hidden"
            style={{ background: `linear-gradient(160deg, ${D.card} 0%, ${D.bg} 100%)`, border: `1px solid ${D.border}` }}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-bold text-[#E0E4EE]">Remittance Insights</p>
                <span className="text-[10px]" style={{ color: D.dimmed }}>Last 6 months</span>
              </div>
              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-2xl font-black tabular-nums"
                    style={{
                      background: "linear-gradient(135deg, #E2CA6E, #C9A84C)",
                      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                    }}>
                    ${loading ? "—" : animSent.toLocaleString()}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: D.dimmed }}>Total Remitted</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black" style={{ color: D.success }}>
                    ${loading ? "—" : Math.round(totalSent * 0.14).toLocaleString()}
                  </p>
                  <p className="text-[10px]" style={{ color: D.dimmed }}>Fees Saved vs WU</p>
                </div>
              </div>

              {/* Bar chart */}
              <div className="h-36">
                {chartData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-xs" style={{ color: D.dimmed }}>
                    No remittance data yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barGap={2} barCategoryGap="25%">
                      <XAxis dataKey="month" tick={{ fontSize: 9, fill: D.dimmed }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: `${D.accent}0D` }} />
                      <Bar dataKey="sent" radius={[4, 4, 0, 0]} maxBarSize={20}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={i === chartData.length - 1 ? D.gold : D.accent} fillOpacity={i === chartData.length - 1 ? 1 : 0.5} />
                        ))}
                      </Bar>
                      <Bar dataKey="saved" radius={[4, 4, 0, 0]} fill={D.gold} fillOpacity={0.25} maxBarSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-2">
                {[
                  { color: D.accent, label: "Remitted" },
                  { color: D.gold,   label: "This month" },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-sm" style={{ background: l.color }} />
                    <span className="text-[10px]" style={{ color: D.dimmed }}>{l.label}</span>
                  </div>
                ))}
              </div>

              {/* Savings callout */}
              <div className="mt-3 rounded-xl px-3 py-2.5 flex items-center gap-2"
                style={{ background: `${D.success}0F`, border: `1px solid ${D.success}20` }}>
                <Sparkles className="h-3.5 w-3.5 shrink-0" style={{ color: D.success }} />
                <p className="text-[11px]" style={{ color: `${D.success}CC` }}>
                  You saved <span className="font-bold" style={{ color: D.success }}>${Math.round(totalSent * 0.14).toLocaleString()}</span> this month vs Western Union
                </p>
              </div>
            </div>
          </motion.div>

          {/* ── RECIIT ACTIVITY ──────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-3xl overflow-hidden"
            style={{ background: `linear-gradient(160deg, ${D.card} 0%, ${D.bg} 100%)`, border: `1px solid ${D.border}` }}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold" style={{ color: D.text }}>Family Transfer Requests</p>
                <button
                  onClick={() => router.push("/wallet")}
                  className="p-1 rounded-lg transition-colors"
                  style={{ color: D.dimmed }}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {activityItems.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: D.dimmed }}>No recent transfers</p>
              ) : (
                <div className="space-y-3">
                  {activityItems.map((a, i) => (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.06 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0"
                        style={{ background: `linear-gradient(135deg, ${a.color.from}, ${a.color.to})` }}>
                        {a.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold" style={{ color: D.text }}>{a.type}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="h-2.5 w-2.5" style={{ color: D.accentDim }} />
                          <p className="text-[10px]" style={{ color: D.dimmed }}>{a.name} · Haiti</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-black" style={{ color: D.gold }}>+${a.amount} {a.currency}</p>
                        <p className="text-[10px]" style={{ color: D.accentDim }}>{a.date}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* ── DESTINATION TRACKER ──────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl overflow-hidden"
            style={{ background: `linear-gradient(160deg, ${D.card} 0%, ${D.bg} 100%)`, border: `1px solid ${D.border}` }}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold" style={{ color: D.text }}>Destination Tracker</p>
                <button
                  onClick={() => router.push("/manage-family")}
                  className="text-[10px] flex items-center gap-1 transition-colors"
                  style={{ color: D.dimmed }}
                >
                  View All <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              {sortedFamily.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: D.dimmed }}>Link family to track destinations</p>
              ) : (
                <div className="space-y-4">
                  {sortedFamily.slice(0, 3).map((m, i) => {
                    const col = getMemberColor(i);
                    const sent = m.recentTransfers.reduce((s, t) => s + t.amount, 0) || (200 - i * 50);
                    const goal = sent * 1.5;
                    const pct = Math.min(Math.round((sent / goal) * 100), 100);
                    return (
                      <div key={m.id} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black text-white"
                              style={{ background: `linear-gradient(135deg, ${col.from}, ${col.to})` }}>
                              {getInitials(m)}
                            </div>
                            <span className="text-xs font-bold" style={{ color: D.text }}>
                              {m.nickname || m.familyUser.firstName || "Family"}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black" style={{ color: D.text }}>${sent}</span>
                            <span className="text-[10px]" style={{ color: D.dimmed }}> / ${goal}</span>
                          </div>
                        </div>
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: D.panel2 }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: "easeOut" }}
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, ${col.from}, ${col.to})` }}
                          />
                        </div>
                        <p className="text-[10px] text-[#3A5A4A]">
                          Monthly goal — {pct}% reached
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>

          {/* ── BANNERS ──────────────────────────────────────────────── */}
          {profile.kycTier < 2 && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => router.push("/verify")}
              className="w-full rounded-2xl overflow-hidden text-left"
              style={{ background: `linear-gradient(135deg, ${D.accent}14, ${D.accent}06)`, border: `1px solid ${D.accent}30` }}
            >
              <div className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${D.accent}18` }}>
                  <Shield className="h-4 w-4" style={{ color: D.accent }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold" style={{ color: D.text }}>
                    {profile.kycTier === 0 ? "Verify Your Identity" : "Complete Full Verification"}
                  </p>
                  <p className="text-xs" style={{ color: D.dimmed }}>Unlock higher remittance limits</p>
                </div>
                <ArrowUpRight className="h-4 w-4" style={{ color: D.accent }} />
              </div>
            </motion.button>
          )}

          {!profile.planSlug && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => router.push("/settings/plan")}
              className="w-full rounded-2xl overflow-hidden text-left"
              style={{ background: `linear-gradient(135deg, ${D.gold}14, ${D.gold}06)`, border: `1px solid ${D.gold}30` }}
            >
              <div className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${D.gold}18` }}>
                  <Crown className="h-4 w-4" style={{ color: D.gold }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold" style={{ color: D.text }}>Diaspora Plus</p>
                  <p className="text-xs" style={{ color: D.dimmed }}>Lower FX fees · Priority support · More</p>
                </div>
                <ArrowUpRight className="h-4 w-4" style={{ color: D.gold }} />
              </div>
            </motion.button>
          )}
        </div>
      </div>

      {/* ── EMERGENCY SEND MODAL (Voye Pou Yo) ─────────────────────── */}
      <AnimatePresence>
        {emergencyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(4,8,20,0.90)", backdropFilter: "blur(12px)" }}
            onClick={() => setEmergencyModal(false)}
          >
            <motion.div
              initial={{ y: 40, scale: 0.95, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 40, scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
              className="w-full max-w-sm rounded-3xl overflow-hidden"
              style={{
                background: "linear-gradient(160deg, #0A1628 0%, #050E1F 100%)",
                border: "1px solid rgba(220,38,38,0.22)",
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-5 pt-5 pb-4"
                style={{ borderBottom: "1px solid rgba(220,38,38,0.12)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.32)" }}
                  >
                    <Siren className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-[#F87171]">Emergency Send</p>
                    <p className="text-[10px] text-[#5A6B82]">Voye Pou Yo — No PIN required</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEmergencyModal(false)}
                  className="p-1.5 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <X className="h-4 w-4 text-[#5A6B82]" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Info banner */}
                <div
                  className="flex items-start gap-2 rounded-xl px-3 py-2.5"
                  style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)" }}
                >
                  <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-[#7A8394] leading-relaxed">
                    Sends immediately to your{" "}
                    <span className="font-bold text-red-400">emergency contact</span> in Haiti.
                    Daily limit: <span className="font-bold text-[#F87171]">$200 USD</span>.
                    No confirmation PIN required. Ensure your emergency contact is set in Family settings.
                  </p>
                </div>

                {/* Amount input */}
                <div>
                  <label className="text-[10px] uppercase tracking-[0.12em] font-bold text-[#4A5A72] mb-2 block">
                    Amount (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#5A6B82]">$</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={emergencyAmount}
                      onChange={e => setEmergencyAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 rounded-xl text-sm font-bold outline-none"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(220,38,38,0.22)",
                        color: "#E0E4EE",
                      }}
                      min="1"
                      max="200"
                    />
                  </div>
                  {fxRate && emergencyAmount && parseFloat(emergencyAmount) > 0 && (
                    <p className="text-[10px] mt-1.5" style={{ color: D.dimmed }}>
                      ≈{" "}
                      <span className="font-bold" style={{ color: D.muted }}>
                        {(parseFloat(emergencyAmount) * fxRate.mid).toLocaleString("fr-HT")} HTG
                      </span>{" "}
                      at {fxRate.mid.toFixed(1)} rate
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <motion.button
                    type="button"
                    onClick={() => setEmergencyModal(false)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="h-11 rounded-2xl font-bold text-sm transition-all"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#5A6B82",
                    }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={handleEmergencySend}
                    disabled={!emergencyAmount || parseFloat(emergencyAmount) <= 0 || emergencyLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="h-11 rounded-2xl font-bold text-sm disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg, #EF4444, #DC2626)", color: "white" }}
                  >
                    {emergencyLoading
                      ? <RefreshCw className="h-4 w-4 animate-spin" />
                      : <Siren className="h-4 w-4" />}
                    Send Now
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
