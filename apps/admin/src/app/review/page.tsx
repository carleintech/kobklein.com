"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, RefreshCw, ShieldCheck, User, XCircle } from "lucide-react";
import { kkGet, kkPost } from "@/lib/kobklein-api";

// ── Types ─────────────────────────────────────────────────────────────────────

type Transfer = {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  type: string;
  status: string;
  riskScore?: number;
  riskLevel?: string;
  riskReasons?: string[];
  createdAt: string;
  sender?: { kId?: string; firstName?: string; lastName?: string; phone?: string };
};

type Stats = { pendingReview: number; approvedToday: number; blockedToday: number };

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function timeAgo(d: string): string {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function initials(t: Transfer["sender"]): string {
  const f = t?.firstName?.[0] ?? "";
  const l = t?.lastName?.[0] ?? "";
  return (f + l).toUpperCase() || "??";
}

type RiskTheme = { border: string; bg: string; badge: string; badgeText: string; scoreBar: string; label: string };

function riskTheme(level?: string): RiskTheme {
  if (level === "high") return {
    border: "border-red-500/40",
    bg: "bg-red-500/5",
    badge: "bg-red-500/15 border-red-500/25 text-red-300",
    badgeText: "High",
    scoreBar: "bg-red-500",
    label: "text-red-400",
  };
  if (level === "medium") return {
    border: "border-kob-gold/35",
    bg: "bg-kob-gold/5",
    badge: "bg-kob-gold/15 border-kob-gold/25 text-kob-gold",
    badgeText: "Medium",
    scoreBar: "bg-kob-gold",
    label: "text-kob-gold",
  };
  return {
    border: "border-white/8",
    bg: "",
    badge: "bg-white/8 border-white/10 text-kob-muted",
    badgeText: level ? level.charAt(0).toUpperCase() + level.slice(1) : "Low",
    scoreBar: "bg-emerald-500",
    label: "text-emerald-400",
  };
}

// ── Queue Card ────────────────────────────────────────────────────────────────

type QueueCardProps = {
  transfer: Transfer;
  actionLoading: boolean;
  error: string | null;
  rejectReason: string;
  onReasonChange: (v: string) => void;
  onApprove: () => void;
  onReject: () => void;
};

function QueueCard({ transfer: t, actionLoading, error, rejectReason, onReasonChange, onApprove, onReject }: QueueCardProps) {
  const theme = riskTheme(t.riskLevel);
  const score = t.riskScore ?? 0;
  const senderName = [t.sender?.firstName, t.sender?.lastName].filter(Boolean).join(" ") || "Unknown sender";

  return (
    <div className={`rounded-2xl border overflow-hidden ${theme.border} ${theme.bg} bg-[#080E20]`}>
      {/* Risk score accent line at top */}
      {t.riskLevel === "high" && (
        <div className="h-px bg-linear-to-r from-red-500/60 via-red-400/30 to-transparent" />
      )}
      {t.riskLevel === "medium" && (
        <div className="h-px bg-linear-to-r from-kob-gold/60 via-kob-gold/30 to-transparent" />
      )}

      <div className="p-5 grid grid-cols-1 lg:grid-cols-[1fr_auto_200px] gap-5">

        {/* ── Left: Transfer details ── */}
        <div className="space-y-3">
          {/* Amount + badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xl font-bold text-kob-text tabular-nums">{fmt(t.amount)}</span>
            <span className="text-base font-semibold text-kob-gold">{t.currency}</span>
            <span className="px-2 py-0.5 rounded-md bg-white/6 border border-white/10 text-[10px] font-semibold text-kob-muted uppercase tracking-wide">
              {t.type}
            </span>
            {t.riskLevel && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide ${theme.badge}`}>
                <AlertTriangle className="h-2.5 w-2.5" />
                {theme.badgeText}
              </span>
            )}
          </div>

          {/* Sender */}
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center text-[10px] font-bold text-kob-gold shrink-0">
              {initials(t.sender)}
            </div>
            <div>
              <p className="text-sm font-medium text-kob-text">{senderName}</p>
              <div className="flex items-center gap-2 text-[10px] text-kob-muted">
                {t.sender?.kId && <span className="font-mono">{t.sender.kId}</span>}
                {t.sender?.phone && <span>{t.sender.phone}</span>}
              </div>
            </div>
          </div>

          {/* Risk reasons */}
          {t.riskReasons && t.riskReasons.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {t.riskReasons.map((r) => (
                <span key={r} className={`px-2 py-0.5 rounded-md border text-[10px] font-medium ${theme.badge}`}>
                  {r}
                </span>
              ))}
            </div>
          )}

          {/* Timestamp */}
          <p className="text-[10px] text-kob-muted">{timeAgo(t.createdAt)}</p>
        </div>

        {/* ── Middle: Risk score visual ── */}
        <div className="hidden lg:flex flex-col items-center justify-center gap-2 px-4 border-x border-white/6 min-w-28">
          <User className="h-4 w-4 text-kob-muted" />
          {t.riskScore != null ? (
            <>
              <div className="relative h-16 w-16">
                <svg viewBox="0 0 100 100" className="-rotate-90 w-full h-full" aria-label="Risk score ring">
                  <title>Risk score ring</title>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke={t.riskLevel === "high" ? "#ef4444" : t.riskLevel === "medium" ? "#C9A84C" : "#1F6F4A"}
                    strokeWidth="10"
                    strokeDasharray={`${(score / 100) * 264} 264`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-sm font-bold ${theme.label}`}>{score}</span>
                </div>
              </div>
              <p className="text-[10px] text-kob-muted">Risk Score</p>
            </>
          ) : (
            <p className="text-[10px] text-kob-muted text-center">No score</p>
          )}
        </div>

        {/* ── Right: Actions ── */}
        <div className="flex flex-col gap-2">
          {/* Approve */}
          <button
            type="button"
            onClick={onApprove}
            disabled={actionLoading}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/25 hover:border-emerald-500/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {actionLoading ? "Approving…" : "Approve"}
          </button>

          {/* Reject */}
          <div className="space-y-1.5">
            <textarea
              rows={2}
              placeholder="Rejection reason (required)"
              value={rejectReason}
              onChange={(e) => onReasonChange(e.target.value)}
              className="w-full resize-none rounded-xl bg-kob-panel/60 border border-white/10 text-xs text-kob-text placeholder:text-kob-muted px-3 py-2 outline-none focus:border-red-500/40 transition-colors"
            />
            <button
              type="button"
              onClick={onReject}
              disabled={actionLoading || !rejectReason.trim()}
              className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-red-500/12 border border-red-500/22 text-sm font-semibold text-red-400 hover:bg-red-500/22 hover:border-red-500/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <XCircle className="h-4 w-4 shrink-0" />
              {actionLoading ? "Rejecting…" : "Reject"}
            </button>
          </div>

          {/* Inline error */}
          {error && (
            <p className="text-[10px] text-red-400 text-center leading-snug">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-[#080E20] p-4 flex items-center gap-4">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-medium text-kob-muted uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-bold tabular-nums text-kob-text leading-tight">{value}</p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ReviewPage() {
  const [items, setItems] = useState<Transfer[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pending, st] = await Promise.all([
        kkGet<{ items?: Transfer[]; transfers?: Transfer[] }>("v1/admin/transfers/pending"),
        kkGet<Stats>("v1/admin/transfers/stats"),
      ]);
      setItems(pending?.items ?? pending?.transfers ?? []);
      setStats(st ?? null);
    } catch {
      // silently retry
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(id: string) {
    setActionLoading(id);
    setErrors((p) => ({ ...p, [id]: "" }));
    try {
      await kkPost(`v1/admin/transfers/${id}/approve`, { note: "Approved via admin" });
      await load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Approve failed";
      setErrors((p) => ({ ...p, [id]: msg }));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(id: string) {
    const reason = rejectReasons[id]?.trim();
    if (!reason) {
      setErrors((p) => ({ ...p, [id]: "Rejection reason is required" }));
      return;
    }
    setActionLoading(id);
    setErrors((p) => ({ ...p, [id]: "" }));
    try {
      await kkPost(`v1/admin/transfers/${id}/reject`, { reason });
      await load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Reject failed";
      setErrors((p) => ({ ...p, [id]: msg }));
    } finally {
      setActionLoading(null);
    }
  }

  // Sort: high risk first
  const sorted = [...items].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.riskLevel as keyof typeof order] ?? 3) - (order[b.riskLevel as keyof typeof order] ?? 3);
  });

  return (
    <div className="space-y-5">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-kob-text tracking-tight">Transfer Review Queue</h1>
          <p className="text-xs text-kob-muted mt-0.5">Approve or reject flagged transactions · sorted by risk</p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-kob-muted hover:text-kob-text hover:border-white/20 transition-all"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ── Stats ───────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Pending Review"
          value={stats?.pendingReview ?? items.length}
          icon={<Clock className="h-5 w-5 text-kob-gold" />}
          color="bg-kob-gold/10 border border-kob-gold/20"
        />
        <StatCard
          label="Approved Today"
          value={stats?.approvedToday ?? 0}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />}
          color="bg-emerald-500/10 border border-emerald-500/20"
        />
        <StatCard
          label="Blocked Today"
          value={stats?.blockedToday ?? 0}
          icon={<XCircle className="h-5 w-5 text-red-400" />}
          color="bg-red-500/10 border border-red-500/20"
        />
      </div>

      {/* ── Queue ───────────────────────────────────────────── */}
      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-[#080E20] flex flex-col items-center justify-center py-16 gap-3">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
          </div>
          <p className="text-sm font-semibold text-kob-text">Queue is clear</p>
          <p className="text-xs text-kob-muted">No pending transfers awaiting review</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* High-risk banner */}
          {sorted.some((t) => t.riskLevel === "high") && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/8 border border-red-500/20">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
              <p className="text-xs text-red-300 font-medium">
                {sorted.filter((t) => t.riskLevel === "high").length} high-risk transfer{sorted.filter((t) => t.riskLevel === "high").length > 1 ? "s" : ""} require immediate attention
              </p>
            </div>
          )}

          {sorted.map((t) => (
            <QueueCard
              key={t.id}
              transfer={t}
              actionLoading={actionLoading === t.id}
              error={errors[t.id] || null}
              rejectReason={rejectReasons[t.id] || ""}
              onReasonChange={(v) => setRejectReasons((p) => ({ ...p, [t.id]: v }))}
              onApprove={() => handleApprove(t.id)}
              onReject={() => handleReject(t.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
