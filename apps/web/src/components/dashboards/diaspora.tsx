"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { apiGet } from "@/lib/api";
import { KIdCard } from "@/components/kid-card";
import { kkPost, kkPatch } from "@/lib/kobklein-api";
import { useToast } from "@kobklein/ui";
import {
  ArrowUpRight, Calendar, CheckCircle2, Crown, Globe, Heart,
  Plus, Send, Shield, Star, Users, Wallet, Zap, TrendingUp,
  RefreshCw, Eye, EyeOff, ChevronRight, Bell, Receipt,
  ArrowDownLeft, ArrowUpLeft, MoreHorizontal, MapPin,
  Sparkles, Clock, DollarSign, X,
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RELATIONSHIP_LABELS: Record<string, string> = {
  parent: "Manman/Papa", child: "Pitit", sibling: "Frè/Sè",
  spouse: "Mari/Madanm", cousin: "Kouzen/Kouzin", other: "Fanmi",
};

const FAMILY_EMOJIS: Record<string, string> = {
  parent: "👩", child: "👧", sibling: "🧑", spouse: "💑", cousin: "🤝", other: "👤",
};

const MEMBER_COLORS = [
  { from: "#C9A84C", to: "#9F7F2C" },
  { from: "#0D9E8A", to: "#0B7A6A" },
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

// Remittance bar chart mock data (last 6 months)
const MONTHS = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs border border-[#0D9E8A]/[0.15]"
      style={{ background: "#0B1A16" }}>
      <p className="text-[#7A9A8A] mb-1">{label}</p>
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

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [dash, members] = await Promise.all([
        apiGet<DashboardData>("v1/family/dashboard"),
        apiGet<FamilyMember[]>("v1/family/members"),
      ]);
      setDashboard(dash);
      setFamily(members);
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

  // Mock remittance chart data seeded from total sent
  const chartSeed = totalSent || 850;
  const remittanceData = MONTHS.map((m, i) => ({
    month: m,
    sent: Math.round(chartSeed * (0.4 + Math.random() * 0.6) * (i === 5 ? 1 : 0.6 + i * 0.08)),
    saved: Math.round(chartSeed * 0.12 * (0.5 + i * 0.1)),
  }));

  // Mock Reciit (recent) activity seeded from family
  const mockActivity = sortedFamily.slice(0, 3).map((m, i) => ({
    id: m.id,
    name: m.nickname || m.familyUser.firstName || "Family",
    type: i === 0 ? "Monthly Support" : i === 1 ? "Tuition" : "Business Transfer",
    amount: m.recentTransfers[0]?.amount ?? (150 - i * 50),
    currency: "USD",
    date: "Feb 23, 2026",
    color: getMemberColor(i),
  }));

  return (
    <div className="space-y-5 pb-8">

      {/* ── TOP HEADER ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <div className="flex items-center gap-1.5 text-[10px] text-[#5A7A6A] font-bold uppercase tracking-widest mb-1">
            <Globe className="h-3 w-3" />
            KobKlein Diaspora
          </div>
          <h1 className="text-2xl font-black text-[#F0F1F5]">
            {greeting}{name}! 👋
          </h1>
          <p className="text-xs text-[#5A6B82] mt-0.5">
            Your family in Haiti is connected
          </p>
        </div>

        {/* Badges + refresh */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1.5">
            {profile.planName ? (
              <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full"
                style={{ background: "rgba(201,168,76,0.15)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.25)" }}>
                <Crown className="h-2.5 w-2.5" />{profile.planName}
              </span>
            ) : (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#122B22] text-[#5A7A6A] border border-[#0D9E8A]/[0.12]">Free</span>
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
            className="p-1.5 rounded-lg bg-[#0E2018] border border-[#0D9E8A]/[0.12] text-[#5A7A6A] hover:text-[#0D9E8A] transition-colors"
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
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-[#050F0C]"
                style={{ background: "linear-gradient(135deg, #E2CA6E, #C9A84C)" }}
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
              background: "linear-gradient(135deg, #071A14 0%, #0B2A20 40%, #0E3028 70%, #071A14 100%)",
              boxShadow: "0 24px 60px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(13,158,138,0.15)",
            }}
          >
            {/* Ambient glows */}
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20 pointer-events-none"
              style={{ background: "radial-gradient(circle, #0D9E8A 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10 pointer-events-none"
              style={{ background: "radial-gradient(circle, #C9A84C 0%, transparent 70%)", transform: "translate(-20%, 20%)" }} />

            <div className="relative p-5">
              {/* Row 1: Label + actions */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-[#5A7A6A] font-bold">Total Balance</p>
                  {dashboard && (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-[#4A6A5A]">≈ HTG</span>
                      <span className="text-[10px] font-bold text-[#5A7A6A]">
                        {(balance * 130).toLocaleString("fr-HT")}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setHideBalance(b => !b)}
                    className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] transition-colors"
                  >
                    {hideBalance
                      ? <EyeOff className="h-3.5 w-3.5 text-[#5A7A6A]" />
                      : <Eye className="h-3.5 w-3.5 text-[#5A7A6A]" />}
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
                      className="text-4xl font-black text-[#5A7A6A] tracking-widest"
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
                          background: "linear-gradient(135deg, #E2CA6E, #C9A84C, #A08030)",
                          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                        }}
                      >
                        ${loading ? "—" : animBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-lg font-bold text-[#C9A84C]/50 ml-2">USD</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Stat pills */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: "K-Link Family", value: loading ? "—" : familyCount.toString(), icon: Users, color: "#0D9E8A" },
                  { label: "Total Sent", value: loading ? "—" : `$${animSent.toLocaleString()}`, icon: Send, color: "#C9A84C" },
                  { label: "Pending", value: pendingRequests.length.toString(), icon: Clock, color: pendingRequests.length > 0 ? "#F59E0B" : "#5A7A6A" },
                ].map((s) => (
                  <div key={s.label}
                    className="rounded-xl px-3 py-2 flex flex-col gap-1"
                    style={{ background: "rgba(13,158,138,0.06)", border: "1px solid rgba(13,158,138,0.10)" }}>
                    <s.icon className="h-3.5 w-3.5" style={{ color: s.color }} />
                    <p className="text-sm font-black text-[#E0E4EE] tabular-nums">{s.value}</p>
                    <p className="text-[9px] text-[#4A6A5A] uppercase tracking-wide font-bold">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Send", icon: Send, href: "/send", gold: true },
                  { label: "Wallet", icon: Wallet, href: "/wallet", gold: false },
                  { label: "Recurring", icon: Calendar, href: "/recurring", gold: false },
                  { label: "Family", icon: Users, href: "/manage-family", gold: false },
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

          {/* ── FAMILY WALLET + ACTIVITY TABS ───────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl overflow-hidden border border-[#0D9E8A]/[0.12]"
            style={{ background: "linear-gradient(160deg, #0B1A16 0%, #081410 100%)" }}
          >
            {/* Tab bar */}
            <div className="flex border-b border-[#0D9E8A]/[0.08]">
              {[
                { key: "family", label: "Family Wallet", icon: Heart },
                { key: "activity", label: "Recent Activity", icon: Receipt },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key as any)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-bold transition-all border-b-2 ${
                    activeTab === t.key
                      ? "border-[#C9A84C] text-[#C9A84C]"
                      : "border-transparent text-[#4A6A5A] hover:text-[#7A9A8A]"
                  }`}
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
                      <p className="text-[10px] uppercase tracking-[0.15em] text-[#4A6A5A] font-bold">
                        {familyCount} member{familyCount !== 1 ? "s" : ""} linked
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowAddForm(v => !v)}
                        className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all"
                        style={{ background: "rgba(201,168,76,0.1)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.2)" }}
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
                          <div className="rounded-2xl p-4 space-y-3 border border-[#0D9E8A]/[0.12]"
                            style={{ background: "#0E2018" }}>
                            <p className="text-xs font-bold text-[#5A7A6A] uppercase tracking-wider">Link Family Member</p>
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
                                className="w-full px-3 py-2.5 rounded-xl text-sm text-[#E0E4EE] placeholder-[#3A5A4A] outline-none"
                                style={{ background: "#122B22", border: "1px solid rgba(13,158,138,0.12)" }}
                              />
                            ))}
                            <select
                              value={addRelationship}
                              onChange={e => setAddRelationship(e.target.value)}
                              title="Select relationship"
                              className="w-full px-3 py-2.5 rounded-xl text-sm text-[#E0E4EE] outline-none cursor-pointer"
                              style={{ background: "#122B22", border: "1px solid rgba(13,158,138,0.12)" }}
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
                              className="w-full py-2.5 rounded-xl font-bold text-sm text-[#050F0C] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                              style={{ background: "linear-gradient(135deg, #E2CA6E, #C9A84C)" }}
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
                          <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "#0E2018" }} />
                        ))}
                      </div>
                    ) : sortedFamily.length === 0 ? (
                      <div className="py-8 flex flex-col items-center gap-3 text-center">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                          style={{ background: "rgba(13,158,138,0.08)", border: "1px solid rgba(13,158,138,0.12)" }}>
                          <Globe className="h-6 w-6 text-[#0D9E8A]/50" />
                        </div>
                        <p className="text-sm text-[#4A6A5A]">No family linked yet</p>
                        <p className="text-xs text-[#3A5A4A]">Add your family in Haiti for easy transfers</p>
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
                              className="flex items-center gap-3 p-3 rounded-2xl border border-[#0D9E8A]/[0.08] transition-colors hover:border-[#0D9E8A]/[0.15]"
                              style={{ background: "#0E2018" }}
                            >
                              {/* Avatar */}
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0"
                                style={{ background: `linear-gradient(135deg, ${col.from}, ${col.to})` }}>
                                {initials}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-bold text-[#E0E4EE] truncate">
                                    {member.nickname || member.familyUser.firstName || "Family"}
                                  </span>
                                  {member.relationship && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0"
                                      style={{ background: `${col.from}18`, color: col.from }}>
                                      {RELATIONSHIP_LABELS[member.relationship] || member.relationship}
                                    </span>
                                  )}
                                  {member.isFavorite && (
                                    <Star className="h-3 w-3 text-[#C9A84C] fill-[#C9A84C] shrink-0" />
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <p className="text-xs text-[#4A6A5A] truncate">
                                    {member.familyUser.handle ? `@${member.familyUser.handle}` : member.familyUser.phone || ""}
                                  </p>
                                  {lastSent && (
                                    <p className="text-[10px] text-[#3A5A4A] shrink-0">
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
                                  style={{ background: "rgba(13,158,138,0.06)" }}
                                >
                                  <Star className={`h-3.5 w-3.5 ${member.isFavorite ? "text-[#C9A84C] fill-[#C9A84C]" : "text-[#3A5A4A]"}`} />
                                </button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => router.push(
                                    `/send?recipientId=${member.familyUser.id}&name=${encodeURIComponent(
                                      member.nickname || member.familyUser.firstName || "Family"
                                    )}`
                                  )}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-[10px] text-[#050F0C] transition-all"
                                  style={{ background: "linear-gradient(135deg, #E2CA6E, #C9A84C)" }}
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
                    {mockActivity.length === 0 ? (
                      <div className="py-8 text-center text-[#4A6A5A] text-sm">No recent activity</div>
                    ) : (
                      mockActivity.map((a, i) => (
                        <motion.div
                          key={a.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="flex items-center gap-3 p-3 rounded-2xl border border-[#0D9E8A]/[0.08]"
                          style={{ background: "#0E2018" }}
                        >
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0"
                            style={{ background: `linear-gradient(135deg, ${a.color.from}, ${a.color.to})` }}>
                            {a.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[#E0E4EE]">{a.type}</p>
                            <p className="text-xs text-[#4A6A5A]">→ {a.name}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-black text-[#C9A84C]">+${a.amount}</p>
                            <p className="text-[10px] text-[#3A5A4A]">{a.date}</p>
                          </div>
                        </motion.div>
                      ))
                    )}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => router.push("/wallet")}
                      className="w-full py-3 rounded-2xl text-xs font-bold text-[#5A7A6A] border border-[#0D9E8A]/[0.10] hover:border-[#0D9E8A]/[0.20] hover:text-[#0D9E8A] transition-all flex items-center justify-center gap-1.5"
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
              { label: "K-Pay Send", sub: "Instant transfer", href: "/send", icon: Send, color: "#C9A84C" },
              { label: "Scheduled", sub: "Recurring remit", href: "/recurring", icon: Calendar, color: "#0D9E8A" },
              { label: "Wallet", sub: "Balance & history", href: "/wallet", icon: Wallet, color: "#6366F1" },
            ].map((item) => (
              <motion.button
                key={item.href}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push(item.href)}
                className="flex flex-col gap-2.5 p-4 rounded-2xl border border-[#0D9E8A]/[0.10] hover:border-[#0D9E8A]/[0.20] text-left transition-all"
                style={{ background: "#0B1A16" }}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: `${item.color}18`, border: `1px solid ${item.color}25` }}>
                  <item.icon className="h-4 w-4" style={{ color: item.color }} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#E0E4EE]">{item.label}</p>
                  <p className="text-[10px] text-[#4A6A5A]">{item.sub}</p>
                </div>
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-5">

          {/* ── REMITTANCE INSIGHTS ──────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl overflow-hidden border border-[#0D9E8A]/[0.12]"
            style={{ background: "linear-gradient(160deg, #0B1A16 0%, #081410 100%)" }}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-bold text-[#E0E4EE]">Remittance Insights</p>
                <span className="text-[10px] text-[#4A6A5A]">Last 6 months</span>
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
                  <p className="text-[10px] text-[#4A6A5A] mt-0.5">Total Remitted</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-400">
                    ${loading ? "—" : Math.round(totalSent * 0.14).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-[#4A6A5A]">Fees Saved vs WU</p>
                </div>
              </div>

              {/* Bar chart */}
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={remittanceData} barGap={2} barCategoryGap="25%">
                    <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#4A6A5A" }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(13,158,138,0.05)" }} />
                    <Bar dataKey="sent" radius={[4, 4, 0, 0]} maxBarSize={20}>
                      {remittanceData.map((_, i) => (
                        <Cell key={i} fill={i === remittanceData.length - 1 ? "#C9A84C" : "#0D9E8A"} fillOpacity={i === remittanceData.length - 1 ? 1 : 0.5} />
                      ))}
                    </Bar>
                    <Bar dataKey="saved" radius={[4, 4, 0, 0]} fill="#C9A84C" fillOpacity={0.25} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-2">
                {[
                  { color: "#0D9E8A", label: "Remitted" },
                  { color: "#C9A84C", label: "This month" },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-sm" style={{ background: l.color }} />
                    <span className="text-[10px] text-[#4A6A5A]">{l.label}</span>
                  </div>
                ))}
              </div>

              {/* Savings callout */}
              <div className="mt-3 rounded-xl px-3 py-2.5 flex items-center gap-2"
                style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.12)" }}>
                <Sparkles className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <p className="text-[11px] text-emerald-400/80">
                  You saved <span className="font-bold text-emerald-400">${Math.round(totalSent * 0.14).toLocaleString()}</span> this month vs Western Union
                </p>
              </div>
            </div>
          </motion.div>

          {/* ── RECIIT ACTIVITY ──────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-3xl overflow-hidden border border-[#0D9E8A]/[0.12]"
            style={{ background: "linear-gradient(160deg, #0B1A16 0%, #081410 100%)" }}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-[#E0E4EE]">Reciit Activity</p>
                <button
                  onClick={() => router.push("/wallet")}
                  className="p-1 rounded-lg text-[#4A6A5A] hover:text-[#0D9E8A] transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {mockActivity.length === 0 ? (
                <p className="text-xs text-[#4A6A5A] text-center py-4">No recent transfers</p>
              ) : (
                <div className="space-y-3">
                  {mockActivity.map((a, i) => (
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
                        <p className="text-xs font-bold text-[#E0E4EE]">{a.type}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="h-2.5 w-2.5 text-[#3A5A4A]" />
                          <p className="text-[10px] text-[#4A6A5A]">{a.name} · Haiti</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-[#C9A84C]">+${a.amount} {a.currency}</p>
                        <p className="text-[10px] text-[#3A5A4A]">{a.date}</p>
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
            className="rounded-3xl overflow-hidden border border-[#0D9E8A]/[0.12]"
            style={{ background: "linear-gradient(160deg, #0B1A16 0%, #081410 100%)" }}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-[#E0E4EE]">Destination Tracker</p>
                <button
                  onClick={() => router.push("/manage-family")}
                  className="text-[10px] text-[#4A6A5A] hover:text-[#0D9E8A] transition-colors flex items-center gap-1"
                >
                  View All <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              {sortedFamily.length === 0 ? (
                <p className="text-xs text-[#4A6A5A] text-center py-4">Link family to track destinations</p>
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
                            <span className="text-xs font-bold text-[#C0C8D0]">
                              {m.nickname || m.familyUser.firstName || "Family"}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-[#E0E4EE]">${sent}</span>
                            <span className="text-[10px] text-[#4A6A5A]"> / ${goal}</span>
                          </div>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-[#122B22] overflow-hidden">
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
              className="w-full rounded-2xl overflow-hidden border border-[#0D9E8A]/[0.20] text-left"
              style={{ background: "linear-gradient(135deg, rgba(13,158,138,0.08), rgba(13,158,138,0.03))" }}
            >
              <div className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0D9E8A]/10 flex items-center justify-center shrink-0">
                  <Shield className="h-4 w-4 text-[#0D9E8A]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#E0E4EE]">
                    {profile.kycTier === 0 ? "Verify Your Identity" : "Complete Full Verification"}
                  </p>
                  <p className="text-xs text-[#4A6A5A]">Unlock higher remittance limits</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-[#0D9E8A]" />
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
              className="w-full rounded-2xl overflow-hidden border border-[#C9A84C]/[0.20] text-left"
              style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.08), rgba(201,168,76,0.03))" }}
            >
              <div className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center shrink-0">
                  <Crown className="h-4 w-4 text-[#C9A84C]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#E0E4EE]">Diaspora Plus</p>
                  <p className="text-xs text-[#4A6A5A]">Lower FX fees · Priority support · More</p>
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
