"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, ArrowLeft, CheckCircle2, Loader2, MessageSquare, Snowflake, XCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { kkGet, kkPost } from "@/lib/kobklein-api";

// ── Types ─────────────────────────────────────────────────────────────────────

type CaseMessage = {
  id: string;
  authorRole: string;
  authorUserId?: string;
  message: string;
  createdAt: string;
};

type CaseAction = {
  id: string;
  actionType: string;
  actorUserId?: string;
  meta?: Record<string, unknown>;
  createdAt: string;
};

type CaseData = {
  id: string;
  caseType: string;
  status: string;
  priority: string;
  description: string;
  reporterUserId?: string;
  referenceType?: string;
  referenceId?: string;
  createdAt: string;
  messages?: CaseMessage[];
  actions?: CaseAction[];
};

// ── Label maps ────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  wrong_recipient: "Wrong Recipient",
  unauthorized: "Unauthorized Transaction",
  merchant_dispute: "Merchant Dispute",
};

const ACTION_LABELS: Record<string, string> = {
  freeze_account: "Account Frozen",
  unfreeze_account: "Account Unfrozen",
  request_info: "Info Requested",
  mark_fraud: "Marked as Fraud",
  refund_recommendation: "Refund Recommended",
  close_case: "Case Closed",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(d: string): string {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type StatusStyle = { dot: string; text: string; bg: string; border: string; label: string };
type PriorityStyle = { dot: string; text: string; bg: string; border: string };

function statusStyle(s: string): StatusStyle {
  const map: Record<string, StatusStyle> = {
    open:          { dot: "bg-kob-gold",    text: "text-kob-gold",    bg: "bg-kob-gold/10",    border: "border-kob-gold/25",    label: "Open" },
    investigating: { dot: "bg-sky-400",     text: "text-sky-400",     bg: "bg-sky-500/10",     border: "border-sky-500/25",     label: "Investigating" },
    pending_user:  { dot: "bg-yellow-400",  text: "text-yellow-300",  bg: "bg-yellow-500/10",  border: "border-yellow-500/25",  label: "Pending User" },
    pending_admin: { dot: "bg-yellow-400",  text: "text-yellow-300",  bg: "bg-yellow-500/10",  border: "border-yellow-500/25",  label: "Pending Admin" },
    resolved:      { dot: "bg-emerald-400", text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/25", label: "Resolved" },
    rejected:      { dot: "bg-kob-muted",   text: "text-kob-muted",   bg: "bg-white/5",        border: "border-white/10",       label: "Rejected" },
  };
  return map[s] ?? { dot: "bg-kob-muted", text: "text-kob-muted", bg: "bg-white/5", border: "border-white/10", label: s };
}

function priorityStyle(p: string): PriorityStyle {
  if (p === "critical" || p === "high") return { dot: "bg-red-500", text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/25" };
  if (p === "normal") return { dot: "bg-kob-gold", text: "text-kob-gold", bg: "bg-kob-gold/10", border: "border-kob-gold/25" };
  return { dot: "bg-sky-400", text: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/25" };
}

function authorColor(role: string): string {
  if (role === "admin") return "border-l-kob-gold bg-kob-gold/3";
  if (role === "user") return "border-l-sky-500 bg-sky-500/3";
  return "border-l-white/20";
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CaseDetailPage() {
  const params = useParams<{ id: string }>();
  const caseId = params.id;

  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [resolutionText, setResolutionText] = useState("");
  const [rejectReasonText, setRejectReasonText] = useState("");
  const [showResolve, setShowResolve] = useState(false);
  const [showReject, setShowReject] = useState(false);

  const fetchCase = useCallback(async () => {
    try {
      const data = await kkGet<CaseData>(`v1/admin/cases/${caseId}`);
      setCaseData(data ?? null);
    } catch {
      setCaseData(null);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => { fetchCase(); }, [fetchCase]);

  async function handleAction(action: string, endpoint: string, body?: Record<string, unknown>) {
    setActionLoading(action);
    setActionMessage(null);
    try {
      await kkPost(endpoint, body ?? {});
      setActionMessage({ text: `${action} completed`, ok: true });
      setShowResolve(false);
      setShowReject(false);
      setResolutionText("");
      setRejectReasonText("");
      await fetchCase();
    } catch (e: unknown) {
      setActionMessage({ text: e instanceof Error ? e.message : "Action failed", ok: false });
    } finally {
      setActionLoading(null);
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-kob-gold" />
        <span className="text-sm text-kob-muted">Loading case…</span>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="space-y-5">
        <Link href="/cases" className="inline-flex items-center gap-2 text-xs text-kob-muted hover:text-kob-text transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Cases
        </Link>
        <div className="rounded-2xl border border-red-500/25 bg-red-500/5 px-5 py-8 text-center">
          <p className="text-sm text-red-400 font-medium">Failed to load case data</p>
        </div>
      </div>
    );
  }

  const sta = statusStyle(caseData.status);
  const pri = priorityStyle(caseData.priority);
  const isClosed = caseData.status === "resolved" || caseData.status === "rejected";

  return (
    <div className="space-y-5">

      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex items-start gap-4">
        <Link
          href="/cases"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-kob-muted hover:text-kob-text hover:border-white/20 transition-all shrink-0 mt-0.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Cases
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-kob-text tracking-tight">
              Case <span className="font-mono text-kob-muted">#{caseData.id.slice(0, 8)}</span>
            </h1>
            {/* Priority badge */}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide ${pri.text} ${pri.bg} ${pri.border}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${pri.dot}`} />
              {caseData.priority}
            </span>
            {/* Status badge */}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide ${sta.text} ${sta.bg} ${sta.border}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${sta.dot}`} />
              {sta.label}
            </span>
          </div>
          <p className="text-xs text-kob-muted">
            {TYPE_LABELS[caseData.caseType] ?? caseData.caseType}
            {" · "}Opened {timeAgo(caseData.createdAt)}
          </p>
        </div>
      </div>

      {/* ── Main layout ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Left col: Summary + Messages ─────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Case Summary */}
          <div className="rounded-2xl border border-white/8 bg-[#080E20] p-5 space-y-4">
            <p className="text-xs font-semibold text-kob-muted uppercase tracking-widest">Case Summary</p>

            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {[
                { label: "Type",    value: TYPE_LABELS[caseData.caseType] ?? caseData.caseType },
                { label: "Reporter", value: caseData.reporterUserId ? `${caseData.reporterUserId.slice(0, 8)}…` : "System", mono: true },
                ...(caseData.referenceType ? [{ label: "Reference", value: `${caseData.referenceType} #${caseData.referenceId?.slice(0, 8)}` }] : []),
                { label: "Created", value: new Date(caseData.createdAt).toLocaleString() },
              ].map((f) => (
                <div key={f.label}>
                  <p className="text-[10px] font-medium text-kob-muted uppercase tracking-widest mb-0.5">{f.label}</p>
                  <p className={`text-sm text-kob-body ${f.mono ? "font-mono" : ""}`}>{f.value}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-[10px] font-medium text-kob-muted uppercase tracking-widest mb-1.5">Description</p>
              <div className="rounded-xl bg-kob-panel/60 border border-white/6 px-4 py-3">
                <p className="text-sm text-kob-body leading-relaxed">{caseData.description || "No description provided."}</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="rounded-2xl border border-white/8 bg-[#080E20] p-5 space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-kob-muted" />
              <p className="text-xs font-semibold text-kob-muted uppercase tracking-widest">Messages</p>
              {caseData.messages && caseData.messages.length > 0 && (
                <span className="ml-auto text-[10px] text-kob-muted">{caseData.messages.length} message{caseData.messages.length > 1 ? "s" : ""}</span>
              )}
            </div>

            {!caseData.messages?.length ? (
              <div className="text-center py-6">
                <p className="text-xs text-kob-muted">No messages yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {caseData.messages.map((msg) => (
                  <div key={msg.id} className={`rounded-xl border-l-2 px-4 py-3 ${authorColor(msg.authorRole)}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-kob-text">{msg.authorRole}</span>
                      {msg.authorUserId && (
                        <span className="text-[10px] font-mono text-kob-muted">{msg.authorUserId.slice(0, 8)}…</span>
                      )}
                      <span className="ml-auto text-[10px] text-kob-muted">{timeAgo(msg.createdAt)}</span>
                    </div>
                    <p className="text-sm text-kob-body leading-relaxed">{msg.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right col: Actions + History ─────────────────── */}
        <div className="space-y-4">

          {/* Actions panel */}
          <div className="rounded-2xl border border-white/8 bg-[#080E20] p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-kob-muted" />
              <p className="text-xs font-semibold text-kob-muted uppercase tracking-widest">Actions</p>
            </div>

            {isClosed ? (
              <p className="text-xs text-kob-muted text-center py-3">Case is {caseData.status} — no further actions</p>
            ) : (
              <div className="space-y-2">

                {/* Freeze account — unauthorized only */}
                {caseData.caseType === "unauthorized" && caseData.status === "open" && (
                  <button
                    type="button"
                    disabled={actionLoading !== null}
                    onClick={() => handleAction("Freeze Account", `v1/admin/cases/${caseId}/freeze`)}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-red-500/12 border border-red-500/25 text-xs font-semibold text-red-400 hover:bg-red-500/22 hover:border-red-500/40 transition-all disabled:opacity-40"
                  >
                    {actionLoading === "Freeze Account"
                      ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Freezing…</>
                      : <><Snowflake className="h-3.5 w-3.5" />Freeze Account</>
                    }
                  </button>
                )}

                {/* Request Info */}
                <button
                  type="button"
                  disabled={actionLoading !== null}
                  onClick={() => handleAction("Request Info", `v1/admin/cases/${caseId}/request-info`)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-kob-muted hover:text-kob-text hover:border-white/20 transition-all disabled:opacity-40"
                >
                  {actionLoading === "Request Info"
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Requesting…</>
                    : "Request Info"
                  }
                </button>

                {/* Resolve Case */}
                {!showResolve ? (
                  <button
                    type="button"
                    disabled={actionLoading !== null}
                    onClick={() => { setShowResolve(true); setShowReject(false); }}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-500/12 border border-emerald-500/25 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/22 hover:border-emerald-500/40 transition-all disabled:opacity-40"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Resolve Case
                  </button>
                ) : (
                  <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3 space-y-2">
                    <p className="text-[10px] font-medium text-kob-muted">Resolution notes</p>
                    <textarea
                      rows={3}
                      value={resolutionText}
                      onChange={(e) => setResolutionText(e.target.value)}
                      placeholder="Describe the resolution…"
                      className="w-full resize-none rounded-xl bg-kob-panel/60 border border-white/10 text-xs text-kob-text placeholder:text-kob-muted px-3 py-2 outline-none focus:border-emerald-500/40 transition-colors"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={actionLoading !== null || !resolutionText.trim()}
                        onClick={() => handleAction("Resolve Case", `v1/admin/cases/${caseId}/resolve`, { resolution: resolutionText.trim() })}
                        className="flex-1 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/30 transition-all disabled:opacity-40"
                      >
                        {actionLoading === "Resolve Case" ? "Resolving…" : "Confirm"}
                      </button>
                      <button type="button" onClick={() => { setShowResolve(false); setResolutionText(""); }} className="px-3 py-2 rounded-lg text-xs text-kob-muted hover:text-kob-text transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Reject Case */}
                {!showReject ? (
                  <button
                    type="button"
                    disabled={actionLoading !== null}
                    onClick={() => { setShowReject(true); setShowResolve(false); }}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-kob-muted hover:text-red-400 hover:border-red-500/25 hover:bg-red-500/5 transition-all disabled:opacity-40"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject Case
                  </button>
                ) : (
                  <div className="rounded-xl border border-red-500/25 bg-red-500/5 p-3 space-y-2">
                    <p className="text-[10px] font-medium text-kob-muted">Rejection reason</p>
                    <textarea
                      rows={3}
                      value={rejectReasonText}
                      onChange={(e) => setRejectReasonText(e.target.value)}
                      placeholder="Reason for rejection…"
                      className="w-full resize-none rounded-xl bg-kob-panel/60 border border-white/10 text-xs text-kob-text placeholder:text-kob-muted px-3 py-2 outline-none focus:border-red-500/40 transition-colors"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={actionLoading !== null || !rejectReasonText.trim()}
                        onClick={() => handleAction("Reject Case", `v1/admin/cases/${caseId}/reject`, { reason: rejectReasonText.trim() })}
                        className="flex-1 py-2 rounded-lg bg-red-500/15 border border-red-500/25 text-xs font-semibold text-red-400 hover:bg-red-500/25 transition-all disabled:opacity-40"
                      >
                        {actionLoading === "Reject Case" ? "Rejecting…" : "Confirm"}
                      </button>
                      <button type="button" onClick={() => { setShowReject(false); setRejectReasonText(""); }} className="px-3 py-2 rounded-lg text-xs text-kob-muted hover:text-kob-text transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline feedback */}
                {actionMessage && (
                  <p className={`text-[10px] text-center font-medium py-1 ${actionMessage.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {actionMessage.text}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action history timeline */}
          <div className="rounded-2xl border border-white/8 bg-[#080E20] p-5 space-y-4">
            <p className="text-xs font-semibold text-kob-muted uppercase tracking-widest">Action History</p>

            {!caseData.actions?.length ? (
              <p className="text-xs text-kob-muted text-center py-3">No actions yet</p>
            ) : (
              <div className="relative space-y-0">
                {/* Vertical line */}
                <div className="absolute left-3 top-2 bottom-2 w-px bg-white/8" />

                {caseData.actions.map((action, i) => (
                  <div key={action.id} className={`relative pl-8 ${i < (caseData.actions?.length ?? 0) - 1 ? "pb-4" : ""}`}>
                    {/* Dot */}
                    <div className="absolute left-1.5 top-1 h-3 w-3 rounded-full bg-kob-gold/20 border border-kob-gold/40 flex items-center justify-center">
                      <div className="h-1 w-1 rounded-full bg-kob-gold" />
                    </div>
                    <p className="text-xs font-semibold text-kob-text">
                      {ACTION_LABELS[action.actionType] ?? action.actionType}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-kob-muted">{timeAgo(action.createdAt)}</span>
                      {action.actorUserId && (
                        <span className="text-[10px] font-mono text-kob-muted">{action.actorUserId.slice(0, 8)}…</span>
                      )}
                    </div>
                    {action.meta && Object.keys(action.meta).length > 0 && (
                      <p className="text-[10px] text-kob-muted mt-0.5">
                        {Object.entries(action.meta).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
