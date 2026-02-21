"use client";

import "./recurring-effects.css";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { kkGet, kkPost } from "@/lib/kobklein-api";
import { useToast } from "@kobklein/ui";
import {
  AlertTriangle, Calendar, ChevronRight, Clock, Crown,
  Loader2, Pause, Play, Plus, RefreshCcw, Trash2,
  TrendingUp, Zap, CheckCircle2, XCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Schedule = {
  id: string;
  amountUsd: number;
  frequency: string;
  status: string;
  nextRunAt: string;
  lastRunAt: string | null;
  failureCount: number;
  note: string | null;
  recipient?: {
    id: string;
    firstName?: string;
    lastName?: string;
    kId?: string;
    phone?: string;
  };
  recipientUserId?: string;
  createdAt: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const FREQ_LABELS: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 Weeks",
  monthly: "Monthly",
};

const FREQ_ICON: Record<string, string> = {
  weekly: "7d",
  biweekly: "14d",
  monthly: "30d",
};

function recipientName(s: Schedule): string {
  if (s.recipient?.firstName) {
    const last = s.recipient.lastName ? ` ${s.recipient.lastName[0]}.` : "";
    return s.recipient.firstName + last;
  }
  if (s.recipient?.kId) return `@${s.recipient.kId}`;
  if (s.recipient?.phone) return s.recipient.phone;
  if (s.recipientUserId) return s.recipientUserId.slice(0, 8) + "…";
  return "Recipient";
}

function recipientInitials(s: Schedule): string {
  const name = recipientName(s);
  return name.replace("@", "").slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  ["#C9A84C", "#9F7F2C"],
  ["#3B82F6", "#1D4ED8"],
  ["#10B981", "#059669"],
  ["#8B5CF6", "#7C3AED"],
  ["#F97316", "#EA580C"],
];

function avatarGrad(name: string) {
  const [a, b] = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ─── Status pill ──────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    active:   { bg: "bg-[#10B981]/10",  text: "text-[#10B981]", dot: "bg-[#10B981]", label: "Active" },
    paused:   { bg: "bg-[#F59E0B]/10",  text: "text-[#F59E0B]", dot: "bg-[#F59E0B]", label: "Paused" },
    failed:   { bg: "bg-red-500/10",    text: "text-red-400",   dot: "bg-red-400",   label: "Failed" },
    canceled: { bg: "bg-[#3A4558]/40",  text: "text-[#5A6B82]", dot: "bg-[#3A4558]", label: "Canceled" },
  };
  const c = config[status] || config.canceled;
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${c.bg} ${c.text}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${c.dot} ${status === "active" ? "animate-pulse" : ""}`} />
      {c.label}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center text-center py-16 gap-5"
    >
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.12), rgba(201,168,76,0.04))", border: "1px solid rgba(201,168,76,0.18)" }}>
        <Calendar className="h-9 w-9 text-[#C9A84C]" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-[#F0F1F5]">No Scheduled Transfers</h3>
        <p className="text-sm text-[#5A6B82] mt-1 max-w-xs">
          Set up automatic recurring remittances to your family — weekly, biweekly, or monthly.
        </p>
      </div>
      <motion.button
        onClick={onCreate}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className="flex items-center gap-2 px-6 h-12 rounded-2xl font-bold text-sm text-[#060D1F]"
        style={{ background: "linear-gradient(135deg, #E2CA6E 0%, #C9A84C 50%, #9F7F2C 100%)", boxShadow: "0 8px 24px -4px rgba(201,168,76,0.4)" }}
      >
        <Plus className="h-4 w-4" />
        Create First Schedule
      </motion.button>
    </motion.div>
  );
}

// ─── Delete confirm modal ─────────────────────────────────────────────────────
function CancelModal({
  name, onConfirm, onCancel, loading,
}: { name: string; onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{ background: "rgba(6,13,31,0.85)", backdropFilter: "blur(8px)" }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 40 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl bg-[#111D33] border border-white/[0.08] p-6 flex flex-col gap-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <Trash2 className="h-6 w-6 text-red-400" />
          </div>
          <div>
            <p className="text-base font-bold text-[#F0F1F5]">Cancel Schedule?</p>
            <p className="text-xs text-[#5A6B82] mt-0.5">This cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-[#7A8394]">
          The recurring transfer to <span className="text-[#F0F1F5] font-medium">{name}</span> will be permanently canceled. No future payments will be sent.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="h-11 rounded-xl bg-[#162038] border border-white/[0.07] text-sm font-bold text-[#B8BCC8] hover:text-[#F0F1F5] transition-all"
          >
            Keep It
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="h-11 rounded-xl bg-red-500/15 border border-red-500/20 text-sm font-bold text-red-400 hover:bg-red-500/25 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="h-4 w-4" /> Cancel</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Schedule card ────────────────────────────────────────────────────────────
function ScheduleCard({
  s, onPause, onResume, onCancel, actionId,
}: {
  s: Schedule;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  actionId: string | null;
}) {
  const name = recipientName(s);
  const initials = recipientInitials(s);
  const loading = actionId === s.id;
  const days = s.nextRunAt ? daysUntil(s.nextRunAt) : null;
  const isCanceled = s.status === "canceled";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      layout
      className={`rounded-2xl border overflow-hidden transition-all ${
        isCanceled ? "opacity-50" : ""
      }`}
      style={{
        background: "#0E1829",
        borderColor: s.status === "active" ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.06)",
      }}
    >
      {/* Active pulse bar */}
      {s.status === "active" && (
        <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, #10B981, #C9A84C, #10B981)", backgroundSize: "200%", animation: "shimmer 3s linear infinite" }} />
      )}

      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
            style={{ background: avatarGrad(name) }}
          >
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold text-[#F0F1F5] truncate">{name}</span>
              <StatusPill status={s.status} />
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs text-[#5A6B82] flex items-center gap-1">
                <RefreshCcw className="h-3 w-3" />
                {FREQ_LABELS[s.frequency] || s.frequency}
              </span>
              {s.note && (
                <span className="text-xs text-[#4A5A72] truncate max-w-[100px]">· {s.note}</span>
              )}
            </div>
          </div>

          {/* Amount */}
          <div className="text-right shrink-0">
            <div className="text-xl font-black text-[#F0F1F5]">
              ${Number(s.amountUsd).toFixed(0)}
              <span className="text-xs font-normal text-[#5A6B82] ml-1">USD</span>
            </div>
            <div className="text-[10px] text-[#3A4558] mt-0.5 font-mono uppercase tracking-wide">
              {FREQ_ICON[s.frequency] || "–"}
            </div>
          </div>
        </div>

        {/* Next run banner */}
        {s.status === "active" && s.nextRunAt && days !== null && (
          <div className="mt-3 rounded-xl bg-[#162038] border border-white/[0.05] px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[#7A8394]">
              <Clock className="h-3.5 w-3.5 text-[#C9A84C]" />
              Next transfer
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#B8BCC8]">
                {new Date(s.nextRunAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                days <= 1 ? "bg-[#C9A84C]/15 text-[#C9A84C]" :
                days <= 3 ? "bg-[#F59E0B]/15 text-[#F59E0B]" :
                "bg-[#162038] text-[#5A6B82]"
              }`}>
                {days === 0 ? "Today!" : days === 1 ? "Tomorrow" : `${days}d`}
              </span>
            </div>
          </div>
        )}

        {/* Failure warning */}
        {s.failureCount > 0 && s.status !== "canceled" && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-red-400 bg-red-500/8 rounded-xl px-3 py-2 border border-red-500/10">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {s.failureCount} failed attempt{s.failureCount > 1 ? "s" : ""} — check your balance
          </div>
        )}

        {/* Actions */}
        {!isCanceled && (
          <div className="mt-3 flex gap-2">
            {s.status === "active" && (
              <button
                onClick={() => onPause(s.id)}
                disabled={loading}
                className="flex-1 h-9 rounded-xl bg-[#162038] border border-white/[0.06] text-xs font-bold text-[#7A8394] hover:text-[#B8BCC8] hover:bg-[#1A2640] transition-all flex items-center justify-center gap-1.5"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Pause className="h-3.5 w-3.5" /> Pause</>}
              </button>
            )}
            {(s.status === "paused" || s.status === "failed") && (
              <button
                onClick={() => onResume(s.id)}
                disabled={loading}
                className="flex-1 h-9 rounded-xl text-xs font-bold text-[#060D1F] transition-all flex items-center justify-center gap-1.5"
                style={{ background: "linear-gradient(135deg, #E2CA6E, #C9A84C)", boxShadow: loading ? "none" : "0 4px 12px -2px rgba(201,168,76,0.35)" }}
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Play className="h-3.5 w-3.5" /> Resume</>}
              </button>
            )}
            <button
              onClick={() => onCancel(s.id)}
              disabled={loading}
              aria-label="Cancel schedule"
              title="Cancel schedule"
              className="h-9 w-9 rounded-xl bg-red-500/8 border border-red-500/12 flex items-center justify-center text-red-400 hover:bg-red-500/15 transition-all shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Stats strip ──────────────────────────────────────────────────────────────
function StatsStrip({ schedules }: { schedules: Schedule[] }) {
  const active = schedules.filter((s) => s.status === "active");
  const monthlyUsd = active.reduce((acc, s) => {
    const mults: Record<string, number> = { weekly: 4.33, biweekly: 2.17, monthly: 1 };
    return acc + s.amountUsd * (mults[s.frequency] || 1);
  }, 0);

  const stats = [
    { label: "Active", value: active.length, icon: CheckCircle2, color: "#10B981" },
    { label: "Monthly est.", value: `$${Math.round(monthlyUsd)}`, icon: TrendingUp, color: "#C9A84C" },
    { label: "Total", value: schedules.length, icon: Calendar, color: "#3B82F6" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="rounded-2xl bg-[#0E1829] border border-white/[0.06] p-3 text-center">
          <s.icon className="h-4 w-4 mx-auto mb-1" style={{ color: s.color }} />
          <div className="text-base font-black text-[#F0F1F5]">{s.value}</div>
          <div className="text-[10px] text-[#5A6B82] mt-0.5">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RecurringPage() {
  const router = useRouter();
  const toast = useToast();
  const [schedules, setSchedules]     = useState<Schedule[]>([]);
  const [loading, setLoading]         = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget]   = useState<Schedule | null>(null);
  const [filter, setFilter]           = useState<"all" | "active" | "paused" | "canceled">("all");

  const load = useCallback(async () => {
    try {
      const res = await kkGet<{ ok: boolean; schedules: Schedule[] } | Schedule[]>("v1/remittance/schedules");
      const list = Array.isArray(res) ? res : (res as any).schedules || [];
      setSchedules(list);
    } catch {
      toast.show("Failed to load schedules", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handlePause(id: string) {
    setActionLoading(id);
    try {
      await kkPost(`v1/remittance/schedule/${id}/pause`, {});
      toast.show("Schedule paused", "success");
      await load();
    } catch (e: any) {
      toast.show(e.message || "Failed to pause", "error");
    } finally { setActionLoading(null); }
  }

  async function handleResume(id: string) {
    setActionLoading(id);
    try {
      await kkPost(`v1/remittance/schedule/${id}/resume`, {});
      toast.show("Schedule resumed!", "success");
      await load();
    } catch (e: any) {
      toast.show(e.message || "Failed to resume", "error");
    } finally { setActionLoading(null); }
  }

  async function handleCancel() {
    if (!cancelTarget) return;
    setActionLoading(cancelTarget.id);
    try {
      await kkPost(`v1/remittance/schedule/${cancelTarget.id}/cancel`, {});
      toast.show("Schedule canceled", "success");
      setCancelTarget(null);
      await load();
    } catch (e: any) {
      toast.show(e.message || "Failed to cancel", "error");
    } finally { setActionLoading(null); }
  }

  const filtered = schedules.filter((s) => filter === "all" || s.status === filter);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center pt-32 gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
          className="w-10 h-10 rounded-full border-2 border-transparent"
          style={{ borderTopColor: "#C9A84C" }}
        />
        <p className="text-sm text-[#5A6B82]">Loading schedules…</p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-lg mx-auto flex flex-col gap-5 p-4 md:p-0">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-black text-[#F0F1F5]">Scheduled Transfers</h1>
            <p className="text-sm text-[#5A6B82] mt-0.5">Recurring family remittances</p>
          </div>
          <motion.button
            onClick={() => router.push("/recurring/create")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 px-4 h-10 rounded-xl font-bold text-sm text-[#060D1F]"
            style={{ background: "linear-gradient(135deg, #E2CA6E, #C9A84C)", boxShadow: "0 4px 14px -2px rgba(201,168,76,0.45)" }}
          >
            <Plus className="h-4 w-4" />
            New
          </motion.button>
        </motion.div>

        {/* Stats */}
        {schedules.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <StatsStrip schedules={schedules} />
          </motion.div>
        )}

        {/* Filter chips */}
        {schedules.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {(["all", "active", "paused", "canceled"] as const).map((f) => {
              const count = f === "all" ? schedules.length : schedules.filter((s) => s.status === f).length;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-bold transition-all shrink-0 border ${
                    filter === f
                      ? "border-[#C9A84C]/40 bg-[#C9A84C]/10 text-[#C9A84C]"
                      : "border-white/[0.06] bg-[#0E1829] text-[#5A6B82] hover:text-[#B8BCC8]"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                    filter === f ? "bg-[#C9A84C]/20" : "bg-[#162038]"
                  }`}>{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* List */}
        <AnimatePresence mode="popLayout">
          {schedules.length === 0 ? (
            <EmptyState key="empty" onCreate={() => router.push("/recurring/create")} />
          ) : filtered.length === 0 ? (
            <motion.div
              key="no-filtered"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center"
            >
              <XCircle className="h-8 w-8 mx-auto text-[#3A4558] mb-3" />
              <p className="text-sm text-[#5A6B82]">No {filter} schedules</p>
            </motion.div>
          ) : (
            <div key="list" className="flex flex-col gap-3">
              {filtered.map((s) => (
                <ScheduleCard
                  key={s.id}
                  s={s}
                  onPause={handlePause}
                  onResume={handleResume}
                  onCancel={(id) => setCancelTarget(schedules.find((x) => x.id === id) || null)}
                  actionId={actionLoading}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Upgrade prompt if many active */}
        {schedules.filter((s) => s.status === "active").length >= 1 && (
          <motion.button
            onClick={() => router.push("/settings/plan")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full rounded-2xl border border-[#C9A84C]/15 bg-gradient-to-r from-[#C9A84C]/5 to-transparent p-4 flex items-center gap-3 text-left hover:border-[#C9A84C]/30 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center shrink-0">
              <Crown className="h-5 w-5 text-[#C9A84C]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#B8BCC8]">Unlock Unlimited Schedules</p>
              <p className="text-xs text-[#5A6B82]">Upgrade to Premium for unlimited recurring transfers</p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#3A4558] group-hover:text-[#C9A84C] transition-colors shrink-0" />
          </motion.button>
        )}
      </div>

      {/* Cancel modal */}
      <AnimatePresence>
        {cancelTarget && (
          <CancelModal
            name={recipientName(cancelTarget)}
            onConfirm={handleCancel}
            onCancel={() => setCancelTarget(null)}
            loading={actionLoading === cancelTarget.id}
          />
        )}
      </AnimatePresence>
    </>
  );
}
