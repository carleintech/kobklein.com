"use client";

import {
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Smartphone,
  Trash2,
  UserCheck,
  UserCog,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ApiError, kkDelete, kkGet, kkPatch, kkPost } from "@/lib/kobklein-api";

// ── Types ─────────────────────────────────────────────────────────────────────

type UserResult = {
  id: string;
  kId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  handle?: string;
  email?: string;
  role: string;
  kycTier: number;
  kycStatus?: string;
  isFrozen: boolean;
  freezeReason?: string;
  createdAt?: string;
  profilePhotoUrl?: string;
  country?: string;
  onboardingComplete?: boolean;
  deviceCount?: number;
  flagCount?: number;
};

type Stats = {
  total: number;
  active: number;
  frozen: number;
  pendingKyc: number;
  newToday: number;
  byRole: Record<string, number>;
};

type ListResponse = {
  ok: boolean;
  users: UserResult[];
  total: number;
  page: number;
  pages: number;
  limit: number;
};

// ── Style helpers ─────────────────────────────────────────────────────────────

const ROLE_STYLE: Record<string, { text: string; bg: string }> = {
  client:      { text: "text-sky-400",    bg: "bg-sky-500/10 border-sky-500/25"      },
  diaspora:    { text: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/25" },
  merchant:    { text: "text-kob-gold",   bg: "bg-kob-gold/10 border-kob-gold/25"    },
  distributor: { text: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/25" },
  admin:       { text: "text-red-400",    bg: "bg-red-500/10 border-red-500/25"      },
};

const TIER_STYLE: Record<number, { text: string; bg: string }> = {
  0: { text: "text-kob-muted",   bg: "bg-white/5 border-white/10"               },
  1: { text: "text-sky-400",     bg: "bg-sky-500/10 border-sky-500/20"          },
  2: { text: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20"  },
  3: { text: "text-kob-gold",    bg: "bg-kob-gold/10 border-kob-gold/20"        },
};

const ROLES = ["client", "diaspora", "merchant", "distributor", "admin"] as const;

function roleStyle(role: string) {
  return ROLE_STYLE[role] ?? { text: "text-kob-muted", bg: "bg-white/5 border-white/10" };
}
function tierStyle(tier: number) {
  return TIER_STYLE[tier] ?? TIER_STYLE[1];
}
function initials(u: UserResult): string {
  return ((u.firstName?.[0] ?? "") + (u.lastName?.[0] ?? "")).toUpperCase() || "?";
}
function fmtDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// ── Broadcast / Notify Modal ──────────────────────────────────────────────────

function BroadcastModal({ user, onClose }: { user: UserResult; onClose: () => void }) {
  const [subject,  setSubject]  = useState("");
  const [message,  setMessage]  = useState("");
  const [channel,  setChannel]  = useState<"push" | "email" | "sms">("push");
  const [sending,  setSending]  = useState(false);
  const [success,  setSuccess]  = useState("");
  const [error,    setError]    = useState("");

  const rs = roleStyle(user.role);

  async function handleSend() {
    if (!subject.trim() || !message.trim()) return;
    setSending(true); setError(""); setSuccess("");
    try {
      await kkPost(`v1/admin/users/${user.id}/notify`, {
        subject: subject.trim(),
        message: message.trim(),
        channel,
      });
      setSuccess(`Message sent via ${channel.toUpperCase()}!`);
      setSubject(""); setMessage("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-kob-gold/20 bg-[#0A1020] shadow-2xl shadow-black/60 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${rs.bg}`}>
              {user.profilePhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.profilePhotoUrl} alt={initials(user)}
                  className="w-full h-full rounded-xl object-cover" />
              ) : (
                <span className={`text-xs font-bold ${rs.text}`}>{initials(user)}</span>
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-kob-text">{user.firstName} {user.lastName}</p>
              <p className="text-[11px] text-kob-muted font-mono">{user.email || user.phone}</p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 text-kob-muted hover:text-kob-text transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Channel selector */}
          <div className="space-y-1.5">
            <p className="text-[10px] text-kob-muted uppercase tracking-widest font-semibold">
              Delivery Channel
            </p>
            <div className="flex gap-2">
              {(["push", "email", "sms"] as const).map((c) => (
                <button key={c} type="button" onClick={() => setChannel(c)}
                  className={`flex-1 py-1.5 rounded-xl border text-[11px] font-semibold uppercase tracking-wide transition-all ${
                    channel === c
                      ? "bg-kob-gold/10 border-kob-gold/30 text-kob-gold"
                      : "bg-white/5 border-white/10 text-kob-muted hover:text-kob-text"
                  }`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <label htmlFor="notify-subject"
              className="text-[10px] text-kob-muted uppercase tracking-widest font-semibold">
              Subject
            </label>
            <input id="notify-subject" type="text" value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Important account notice"
              className="w-full h-9 rounded-xl bg-white/5 border border-white/10 focus:border-kob-gold/40 focus:outline-none px-3 text-xs text-kob-text placeholder:text-kob-muted/60 transition-colors" />
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <label htmlFor="notify-message"
              className="text-[10px] text-kob-muted uppercase tracking-widest font-semibold">
              Message
            </label>
            <textarea id="notify-message" rows={4} value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here…"
              className="w-full rounded-xl bg-white/5 border border-white/10 focus:border-kob-gold/40 focus:outline-none px-3 py-2.5 text-xs text-kob-text placeholder:text-kob-muted/60 transition-colors resize-none" />
          </div>

          {/* Feedback */}
          {(success || error) && (
            <div className={`px-3 py-2 rounded-xl text-[11px] font-medium border ${
              error
                ? "bg-red-500/8 border-red-500/20 text-red-400"
                : "bg-emerald-500/8 border-emerald-500/20 text-emerald-400"
            }`}>
              {error || success}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button type="button"
              disabled={sending || !subject.trim() || !message.trim()}
              onClick={handleSend}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-kob-gold text-kob-black text-[12px] font-bold hover:bg-kob-gold-light transition-all disabled:opacity-40">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
              {sending ? "Sending…" : "Send Message"}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-white/10 text-[12px] text-kob-muted hover:text-kob-text transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Stats Bar ─────────────────────────────────────────────────────────────────

function StatsBar({ stats }: { stats: Stats | null }) {
  if (!stats) return null;

  const cards = [
    { label: "Total Users", value: stats.total,      color: "text-kob-gold",    border: "border-kob-gold/15"    },
    { label: "Active",      value: stats.active,     color: "text-emerald-400", border: "border-emerald-500/15" },
    { label: "Frozen",      value: stats.frozen,     color: "text-red-400",     border: "border-red-500/15"     },
    { label: "KYC Pending", value: stats.pendingKyc, color: "text-yellow-400",  border: "border-yellow-500/15"  },
    { label: "New Today",   value: stats.newToday,   color: "text-sky-400",     border: "border-sky-500/15"     },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((c) => (
        <div key={c.label}
          className={`rounded-2xl border ${c.border} bg-[#080E20] px-4 py-3 space-y-1`}>
          <p className="text-[10px] text-kob-muted uppercase tracking-widest font-semibold">
            {c.label}
          </p>
          <p className={`text-2xl font-bold tabular-nums ${c.color}`}>
            {c.value.toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── User Row ──────────────────────────────────────────────────────────────────

type WalletInfo = { id: string; currency: string; balance: number };

function UserRow({
  user,
  onAction,
  onNotify,
}: {
  user: UserResult;
  onAction: () => void;
  onNotify: (u: UserResult) => void;
}) {
  const [expanded, setExpanded]         = useState<"role" | "wallet" | "delete" | "kyc" | null>(null);
  const [newRole, setNewRole]           = useState(user.role);
  const [submitting, setSubmitting]     = useState<"freeze" | "role" | "wallet" | "delete" | "kyc_approve" | "kyc_reject" | null>(null);
  const [error, setError]               = useState("");
  const [success, setSuccess]           = useState("");
  const [wallets, setWallets]           = useState<WalletInfo[]>([]);
  const [walletLoading, setWalletLoading] = useState(false);
  const [adjustCurrency, setAdjustCurrency]     = useState("HTG");
  const [adjustDirection, setAdjustDirection]   = useState<"credit" | "debit">("credit");
  const [adjustAmount, setAdjustAmount]         = useState("");
  const [adjustReason, setAdjustReason]         = useState("");
  const [kycRejectReason, setKycRejectReason]   = useState("");

  const rs = roleStyle(user.role);
  const ts = tierStyle(user.kycTier);

  function togglePanel(panel: "role" | "wallet" | "delete" | "kyc") {
    const next = expanded === panel ? null : panel;
    setExpanded(next);
    setError(""); setSuccess("");
    if (next === "wallet") loadWallets();
  }

  async function loadWallets() {
    setWalletLoading(true);
    try {
      const data = await kkGet<{ wallets: WalletInfo[] }>(`v1/admin/users/${user.id}/wallets`);
      setWallets(data?.wallets ?? []);
      if (data?.wallets?.length) setAdjustCurrency(data.wallets[0].currency);
    } catch { /* silent */ }
    finally { setWalletLoading(false); }
  }

  async function handleFreeze() {
    setSubmitting("freeze"); setError(""); setSuccess("");
    try {
      await kkPost("v1/admin/users/freeze", {
        userId: user.id,
        frozen: !user.isFrozen,
      });
      setSuccess(user.isFrozen ? "Account unfrozen successfully" : "Account frozen successfully");
      onAction();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally { setSubmitting(null); }
  }

  async function handleSetRole() {
    if (!newRole || newRole === user.role) return;
    setSubmitting("role"); setError(""); setSuccess("");
    try {
      await kkPost("v1/admin/users/set-role", { userId: user.id, role: newRole });
      setSuccess(`Role updated to "${newRole}"`);
      setExpanded(null); onAction();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Role update failed");
    } finally { setSubmitting(null); }
  }

  async function handleWalletAdjust() {
    if (!adjustAmount || !adjustReason) return;
    setSubmitting("wallet"); setError(""); setSuccess("");
    try {
      const res = await kkPost<{ newBalance: number }>("v1/admin/wallets/adjust", {
        userId: user.id,
        currency: adjustCurrency,
        direction: adjustDirection,
        amount: Number(adjustAmount),
        reason: adjustReason,
      });
      setSuccess(
        `${adjustDirection === "credit" ? "+" : "-"}${adjustAmount} ${adjustCurrency} · new balance: ${res.newBalance}`,
      );
      setAdjustAmount(""); setAdjustReason("");
      await loadWallets();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Adjustment failed");
    } finally { setSubmitting(null); }
  }

  async function handleDelete() {
    setSubmitting("delete"); setError(""); setSuccess("");
    try {
      await kkDelete(`v1/admin/users/${user.id}`);
      setSuccess("Account deleted successfully");
      setExpanded(null); onAction();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally { setSubmitting(null); }
  }

  async function handleKycApprove() {
    setSubmitting("kyc_approve"); setError(""); setSuccess("");
    try {
      await kkPatch(`v1/kyc/admin/${user.id}/approve`);
      setSuccess("KYC approved — user upgraded to Tier 2 ✓");
      setExpanded(null); onAction();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Approve failed");
    } finally { setSubmitting(null); }
  }

  async function handleKycReject() {
    if (!kycRejectReason.trim()) return;
    setSubmitting("kyc_reject"); setError(""); setSuccess("");
    try {
      await kkPatch(`v1/kyc/admin/${user.id}/reject`, { reason: kycRejectReason.trim() });
      setSuccess("KYC rejected — user notified");
      setKycRejectReason(""); setExpanded(null); onAction();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Reject failed");
    } finally { setSubmitting(null); }
  }

  return (
    <div className={`rounded-2xl border bg-[#080E20] overflow-hidden transition-colors ${
      expanded ? "border-kob-gold/20" : "border-white/8 hover:border-white/12"
    }`}>
      {/* ── Main row ── */}
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Avatar */}
        <div className={`h-11 w-11 rounded-xl border flex items-center justify-center shrink-0 overflow-hidden ${rs.bg}`}>
          {user.profilePhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.profilePhotoUrl} alt={initials(user)}
              className="w-full h-full object-cover" />
          ) : (
            <span className={`text-sm font-bold ${rs.text}`}>{initials(user)}</span>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Name + K-ID + handle + flags */}
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-kob-text">
              {user.firstName} {user.lastName}
            </p>
            {user.kId && (
              <span className="px-2 py-0.5 rounded-md border border-kob-gold/30 bg-kob-gold/8 text-[10px] font-mono font-semibold text-kob-gold">
                {user.kId}
              </span>
            )}
            {user.handle && (
              <span className="text-[11px] text-kob-muted font-mono">@{user.handle}</span>
            )}
            {!!user.flagCount && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-red-500/30 bg-red-500/10 text-[10px] font-semibold text-red-400">
                <ShieldAlert className="h-3 w-3" />
                {user.flagCount} flag{user.flagCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Contact */}
          <div className="flex items-center gap-3 text-[11px] font-mono text-kob-muted">
            {user.phone && <span>{user.phone}</span>}
            {user.email && <span className="truncate max-w-48">{user.email}</span>}
            {user.country && <span>{user.country}</span>}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold capitalize ${rs.bg} ${rs.text}`}>
              {user.role}
            </span>
            <span className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold ${ts.bg} ${ts.text}`}>
              KYC T{user.kycTier}{user.kycStatus === "pending" ? " (pending)" : ""}
            </span>
            {user.isFrozen ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-red-500/30 bg-red-500/10 text-[10px] font-semibold text-red-400">
                <ShieldX className="h-3 w-3" /> Frozen
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-emerald-500/25 bg-emerald-500/10 text-[10px] font-semibold text-emerald-400">
                <ShieldCheck className="h-3 w-3" /> Active
              </span>
            )}
            {!user.onboardingComplete && (
              <span className="px-2 py-0.5 rounded-md border border-yellow-500/25 bg-yellow-500/8 text-[10px] font-semibold text-yellow-400">
                Onboarding
              </span>
            )}
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 text-[9px] font-mono text-kob-muted/40">
            <span className="truncate max-w-56">{user.id}</span>
            {user.createdAt && <span>Joined {fmtDate(user.createdAt)}</span>}
            {user.deviceCount !== undefined && (
              <span>{user.deviceCount} device{user.deviceCount !== 1 ? "s" : ""}</span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end max-w-xs">
          {/* Freeze / Unfreeze */}
          <button
            type="button"
            disabled={submitting !== null}
            onClick={handleFreeze}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all disabled:opacity-40 ${
              user.isFrozen
                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20"
                : "bg-white/5 border-white/10 text-kob-muted hover:text-red-400 hover:border-red-500/25 hover:bg-red-500/8"
            }`}
          >
            {submitting === "freeze" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : user.isFrozen ? (
              <ShieldCheck className="h-3.5 w-3.5" />
            ) : (
              <ShieldX className="h-3.5 w-3.5" />
            )}
            {user.isFrozen ? "Unfreeze" : "Freeze"}
          </button>

          {/* Notify */}
          <button
            type="button"
            onClick={() => onNotify(user)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-semibold text-kob-muted hover:text-kob-gold hover:border-kob-gold/25 hover:bg-kob-gold/8 transition-all"
          >
            <Bell className="h-3.5 w-3.5" />
            Notify
          </button>

          {/* KYC Verify */}
          <button
            type="button"
            disabled={submitting !== null}
            onClick={() => togglePanel("kyc")}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all disabled:opacity-40 ${
              expanded === "kyc"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : user.kycStatus === "pending"
                  ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400 animate-pulse"
                  : user.kycStatus === "approved"
                    ? "bg-emerald-500/8 border-emerald-500/20 text-emerald-400"
                    : "bg-white/5 border-white/10 text-kob-muted hover:text-emerald-400 hover:border-emerald-500/25"
            }`}
          >
            {(submitting === "kyc_approve" || submitting === "kyc_reject") ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <UserCheck className="h-3.5 w-3.5" />
            )}
            KYC{user.kycStatus === "pending" ? " !" : ""}
          </button>

          {/* Role */}
          <button
            type="button"
            disabled={submitting !== null}
            onClick={() => togglePanel("role")}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all disabled:opacity-40 ${
              expanded === "role"
                ? "bg-kob-gold/10 border-kob-gold/30 text-kob-gold"
                : "bg-white/5 border-white/10 text-kob-muted hover:text-kob-text hover:border-white/20"
            }`}
          >
            <UserCog className="h-3.5 w-3.5" />
            Role
          </button>

          {/* Wallet */}
          <button
            type="button"
            disabled={submitting !== null}
            onClick={() => togglePanel("wallet")}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all disabled:opacity-40 ${
              expanded === "wallet"
                ? "bg-sky-500/10 border-sky-500/30 text-sky-400"
                : "bg-white/5 border-white/10 text-kob-muted hover:text-kob-text hover:border-white/20"
            }`}
          >
            <Wallet className="h-3.5 w-3.5" />
            Wallet
          </button>

          {/* Devices */}
          <Link
            href={`/users/${user.id}/devices`}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-semibold text-kob-muted hover:text-kob-text hover:border-white/20 transition-all"
          >
            <Smartphone className="h-3.5 w-3.5" />
            {user.deviceCount ?? 0}
          </Link>

          {/* Delete */}
          <button
            type="button"
            disabled={submitting !== null}
            onClick={() => togglePanel("delete")}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all disabled:opacity-40 ${
              expanded === "delete"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-white/5 border-white/10 text-kob-muted hover:text-red-400 hover:border-red-500/25 hover:bg-red-500/8"
            }`}
          >
            {submitting === "delete" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* ── Inline feedback ── */}
      {(success || error) && (
        <div className={`mx-5 mb-3 px-3 py-2 rounded-xl text-[11px] font-medium border ${
          error
            ? "bg-red-500/8 border-red-500/20 text-red-400"
            : "bg-emerald-500/8 border-emerald-500/20 text-emerald-400"
        }`}>
          {error ? <ShieldX className="inline h-3 w-3 mr-1" /> : <Check className="inline h-3 w-3 mr-1" />}
          {error || success}
        </div>
      )}

      {/* ── Role panel ── */}
      {expanded === "role" && (
        <div className="px-5 pb-5 pt-0 border-t border-kob-gold/10">
          <div className="pt-4 space-y-3">
            <p className="text-[10px] text-kob-gold/70 uppercase tracking-widest font-semibold">
              Change Role — {user.firstName} {user.lastName}
            </p>
            <div className="flex items-center gap-3">
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="flex-1 max-w-52 h-9 rounded-xl bg-white/5 border border-white/10 focus:border-kob-gold/40 focus:outline-none px-3 text-xs text-kob-text appearance-none transition-colors"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r} className="bg-[#0F1626]">
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={submitting !== null || newRole === user.role}
                onClick={handleSetRole}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-kob-gold text-kob-black text-[11px] font-bold hover:bg-kob-gold-light transition-all disabled:opacity-40"
              >
                {submitting === "role" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <UserCog className="h-3.5 w-3.5" />
                )}
                Update Role
              </button>
              <button
                type="button"
                onClick={() => { setExpanded(null); setNewRole(user.role); }}
                className="px-3 py-2 rounded-xl border border-white/8 text-[11px] text-kob-muted hover:text-kob-text transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Wallet panel ── */}
      {expanded === "wallet" && (
        <div className="px-5 pb-5 pt-0 border-t border-sky-500/10">
          <div className="pt-4 space-y-3">
            <p className="text-[10px] text-sky-400/70 uppercase tracking-widest font-semibold">
              Manual Wallet Adjustment
            </p>
            {walletLoading ? (
              <div className="flex items-center gap-2 text-xs text-kob-muted">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading wallets…
              </div>
            ) : wallets.length === 0 ? (
              <p className="text-xs text-kob-muted">No wallets found for this user.</p>
            ) : (
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <p className="text-[9px] text-kob-muted uppercase tracking-wider">Currency</p>
                  <select
                    value={adjustCurrency}
                    onChange={(e) => setAdjustCurrency(e.target.value)}
                    className="h-9 rounded-xl bg-white/5 border border-white/10 focus:border-sky-400/40 focus:outline-none px-3 text-xs text-kob-text appearance-none transition-colors"
                  >
                    {wallets.map((w) => (
                      <option key={w.currency} value={w.currency} className="bg-[#0F1626]">
                        {w.currency} — bal: {w.balance.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] text-kob-muted uppercase tracking-wider">Direction</p>
                  <div className="flex gap-1.5">
                    {(["credit", "debit"] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setAdjustDirection(d)}
                        className={`px-3 py-2 rounded-xl border text-[11px] font-semibold capitalize transition-all ${
                          adjustDirection === d
                            ? d === "credit"
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : "bg-red-500/10 border-red-500/30 text-red-400"
                            : "bg-white/5 border-white/10 text-kob-muted"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-kob-muted uppercase tracking-wider">Amount</label>
                  <input
                    type="number" min="0.01" step="0.01"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-28 h-9 rounded-xl bg-white/5 border border-white/10 focus:border-sky-400/40 focus:outline-none px-3 text-xs text-kob-text transition-colors"
                  />
                </div>
                <div className="flex-1 min-w-40 space-y-1">
                  <label className="text-[9px] text-kob-muted uppercase tracking-wider">Reason (required)</label>
                  <input
                    type="text"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder="e.g. Refund for error TX-123"
                    className="w-full h-9 rounded-xl bg-white/5 border border-white/10 focus:border-sky-400/40 focus:outline-none px-3 text-xs text-kob-text transition-colors"
                  />
                </div>
                <button
                  type="button"
                  disabled={submitting !== null || !adjustAmount || !adjustReason}
                  onClick={handleWalletAdjust}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500/10 border border-sky-500/25 text-[11px] font-bold text-sky-400 hover:bg-sky-500/20 transition-all disabled:opacity-40"
                >
                  {submitting === "wallet" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Wallet className="h-3.5 w-3.5" />
                  )}
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── KYC panel ── */}
      {expanded === "kyc" && (
        <div className="px-5 pb-5 pt-0 border-t border-emerald-500/10">
          <div className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-emerald-400/70 uppercase tracking-widest font-semibold">
                KYC Identity Verification — {user.firstName} {user.lastName}
              </p>
              <div className="flex items-center gap-2">
                {/* Current tier badge */}
                <span className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold ${tierStyle(user.kycTier).bg} ${tierStyle(user.kycTier).text}`}>
                  Tier {user.kycTier}
                </span>
                {/* Current status badge */}
                {user.kycStatus === "approved" && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-emerald-500/25 bg-emerald-500/10 text-[10px] font-semibold text-emerald-400">
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </span>
                )}
                {user.kycStatus === "pending" && (
                  <span className="px-2 py-0.5 rounded-md border border-yellow-500/25 bg-yellow-500/10 text-[10px] font-semibold text-yellow-400">
                    ⏳ Pending Review
                  </span>
                )}
                {user.kycStatus === "rejected" && (
                  <span className="px-2 py-0.5 rounded-md border border-red-500/25 bg-red-500/10 text-[10px] font-semibold text-red-400">
                    Rejected
                  </span>
                )}
                {(!user.kycStatus || user.kycStatus === "none") && (
                  <span className="px-2 py-0.5 rounded-md border border-white/15 bg-white/5 text-[10px] font-semibold text-kob-muted">
                    Unverified
                  </span>
                )}
              </div>
            </div>

            {/* Already approved */}
            {user.kycStatus === "approved" ? (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <p className="text-xs text-emerald-400 font-medium">
                  This user is already KYC verified at Tier {user.kycTier}.
                </p>
              </div>
            ) : (
              <>
                {/* Approve button */}
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    disabled={submitting !== null}
                    onClick={handleKycApprove}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[12px] font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-40"
                  >
                    {submitting === "kyc_approve" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" />
                    )}
                    Approve KYC — Upgrade to Tier 2
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpanded(null)}
                    className="px-3 py-2 rounded-xl border border-white/8 text-[11px] text-kob-muted hover:text-kob-text transition-colors"
                  >
                    Cancel
                  </button>
                </div>

                {/* Reject section */}
                <div className="space-y-2 pt-1">
                  <p className="text-[10px] text-red-400/60 uppercase tracking-widest font-semibold">
                    Or Reject with Reason
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={kycRejectReason}
                      onChange={(e) => setKycRejectReason(e.target.value)}
                      placeholder="e.g. Document not clear, please resubmit"
                      className="flex-1 h-9 rounded-xl bg-white/5 border border-white/10 focus:border-red-400/40 focus:outline-none px-3 text-xs text-kob-text placeholder:text-kob-muted/50 transition-colors"
                    />
                    <button
                      type="button"
                      disabled={submitting !== null || !kycRejectReason.trim()}
                      onClick={handleKycReject}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-[11px] font-bold text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-40"
                    >
                      {submitting === "kyc_reject" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ShieldX className="h-3.5 w-3.5" />
                      )}
                      Reject
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Delete panel ── */}
      {expanded === "delete" && (
        <div className="px-5 pb-5 pt-0 border-t border-red-500/10">
          <div className="pt-4 space-y-3">
            <p className="text-[10px] text-red-400/70 uppercase tracking-widest font-semibold">
              Delete Account — Irreversible
            </p>
            <p className="text-xs text-kob-muted">
              This will anonymize all PII and freeze the account for{" "}
              <span className="text-kob-text font-medium">
                {user.firstName} {user.lastName}
              </span>
              . Wallet history is preserved for compliance.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={submitting !== null}
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-[11px] font-bold text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-40"
              >
                {submitting === "delete" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Confirm Delete
              </button>
              <button
                type="button"
                onClick={() => setExpanded(null)}
                className="px-3 py-2 rounded-xl border border-white/8 text-[11px] text-kob-muted hover:text-kob-text transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const LIMIT = 25;

export default function UsersPage() {
  const [users, setUsers]   = useState<UserResult[]>([]);
  const [stats, setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiDown, setApiDown] = useState(false);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [pages, setPages]   = useState(1);

  // Filters
  const [role, setRole]       = useState("all");
  const [status, setStatus]   = useState("all");
  const [kycTier, setKycTier] = useState("all");
  const [sort, setSort]       = useState("newest");
  const [q, setQ]             = useState("");
  const [qInput, setQInput]   = useState("");

  // Broadcast modal
  const [notifyTarget, setNotifyTarget] = useState<UserResult | null>(null);

  // ── Data fetchers ──────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    try {
      const data = await kkGet<Stats>("v1/admin/users/stats");
      setStats(data);
    } catch { /* silent */ }
  }, []);

  const fetchUsers = useCallback(async (opts: {
    role?: string; status?: string; kycTier?: string; sort?: string; q?: string; page?: number;
  }) => {
    setLoading(true); setApiDown(false);

    const params = new URLSearchParams();
    if (opts.role    && opts.role    !== "all") params.set("role",    opts.role);
    if (opts.status  && opts.status  !== "all") params.set("status",  opts.status);
    if (opts.kycTier && opts.kycTier !== "all") params.set("kycTier", opts.kycTier);
    if (opts.sort)                               params.set("sort",    opts.sort ?? "newest");
    if (opts.q && opts.q.length >= 2)            params.set("q",       opts.q);
    params.set("page",  String(opts.page ?? 1));
    params.set("limit", String(LIMIT));

    try {
      const data = await kkGet<ListResponse>(`v1/admin/users/list?${params.toString()}`);
      setUsers(data?.users ?? []);
      setTotal(data?.total ?? 0);
      setPage(data?.page ?? 1);
      setPages(data?.pages ?? 1);
    } catch (e: unknown) {
      if (e instanceof ApiError && e.isApiUnavailable) setApiDown(true);
      else setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchStats();
    fetchUsers({ sort: "newest" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Apply filters helper ───────────────────────────────────────────────────

  function applyFilters(
    overrides: Partial<{
      role: string; status: string; kycTier: string; sort: string; q: string; page: number;
    }> = {},
  ) {
    const nr = overrides.role    ?? role;
    const ns = overrides.status  ?? status;
    const nk = overrides.kycTier ?? kycTier;
    const no = overrides.sort    ?? sort;
    const nq = overrides.q       ?? q;
    const np = overrides.page    ?? 1;

    if ("role"    in overrides) setRole(nr);
    if ("status"  in overrides) setStatus(ns);
    if ("kycTier" in overrides) setKycTier(nk);
    if ("sort"    in overrides) setSort(no);
    if ("q"       in overrides) setQ(nq);
    setPage(np);

    fetchUsers({ role: nr, status: ns, kycTier: nk, sort: no, q: nq, page: np });
  }

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    applyFilters({ q: qInput, page: 1 });
  }

  function handleRefresh() {
    fetchStats();
    fetchUsers({ role, status, kycTier, sort, q, page });
  }

  // ── CSV export ─────────────────────────────────────────────────────────────

  function exportCsv() {
    const headers = [
      "ID", "K-ID", "First Name", "Last Name", "Email", "Phone", "Handle",
      "Role", "KYC Tier", "KYC Status", "Frozen", "Country", "Joined",
    ];
    const rows = users.map((u) => [
      u.id, u.kId ?? "", u.firstName ?? "", u.lastName ?? "",
      u.email ?? "", u.phone ?? "", u.handle ?? "",
      u.role, String(u.kycTier), u.kycStatus ?? "",
      u.isFrozen ? "Yes" : "No", u.country ?? "",
      u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `kobklein-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const from = total === 0 ? 0 : (page - 1) * LIMIT + 1;
  const to   = Math.min(page * LIMIT, total);

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-kob-text tracking-tight">
            User Control Center
          </h1>
          <p className="text-xs text-kob-muted mt-0.5">
            {total > 0
              ? `${total.toLocaleString()} accounts registered`
              : "Manage all platform users"}{" "}
            · freeze · reassign roles · adjust wallets · send direct messages
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={users.length === 0}
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-[11px] font-semibold text-kob-muted hover:text-kob-text hover:border-white/20 transition-all disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-[11px] font-semibold text-kob-muted hover:text-kob-text hover:border-white/20 transition-all disabled:opacity-40"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Stats bar ──────────────────────────────────────────────────── */}
      <StatsBar stats={stats} />

      {/* ── API offline banner ─────────────────────────────────────────── */}
      {apiDown && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/25 bg-red-500/8">
          <span className="h-2 w-2 rounded-full bg-red-400 shrink-0" />
          <p className="text-xs text-red-400 font-medium">
            API is unreachable — user data may be unavailable
          </p>
        </div>
      )}

      {/* ── Filters ────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/8 bg-[#080E20] p-4 space-y-3">
        {/* Search row */}
        <form onSubmit={handleSearch} className="flex items-center gap-3">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-kob-muted pointer-events-none" />
            <input
              type="search"
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              placeholder="Search K-ID, phone, @handle, name, email…"
              className="w-full h-9 rounded-xl bg-white/5 border border-white/10 focus:border-kob-gold/40 focus:outline-none pl-9 pr-3 text-xs text-kob-text placeholder:text-kob-muted/60 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-kob-gold text-kob-black text-[11px] font-bold hover:bg-kob-gold-light transition-all disabled:opacity-40"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5" />
            )}
            {loading ? "Loading…" : "Search"}
          </button>
          {q && (
            <button
              type="button"
              onClick={() => { setQInput(""); applyFilters({ q: "", page: 1 }); }}
              className="flex items-center gap-1 px-3 py-2 rounded-xl border border-white/10 text-[11px] text-kob-muted hover:text-kob-text transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </form>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-[11px] text-kob-muted/70 shrink-0">
            <Filter className="h-3.5 w-3.5" />
            <span className="font-semibold uppercase tracking-widest text-[10px]">Filters</span>
          </div>

          {/* Role */}
          <select
            value={role}
            onChange={(e) => applyFilters({ role: e.target.value, page: 1 })}
            className="h-8 rounded-xl bg-white/5 border border-white/10 focus:border-kob-gold/40 focus:outline-none px-3 text-[11px] text-kob-text appearance-none transition-colors cursor-pointer"
          >
            <option value="all"         className="bg-[#0F1626]">All Roles</option>
            <option value="client"      className="bg-[#0F1626]">Client</option>
            <option value="diaspora"    className="bg-[#0F1626]">Diaspora</option>
            <option value="merchant"    className="bg-[#0F1626]">Merchant</option>
            <option value="distributor" className="bg-[#0F1626]">Distributor</option>
            <option value="admin"       className="bg-[#0F1626]">Admin</option>
          </select>

          {/* Status */}
          <select
            value={status}
            onChange={(e) => applyFilters({ status: e.target.value, page: 1 })}
            className="h-8 rounded-xl bg-white/5 border border-white/10 focus:border-kob-gold/40 focus:outline-none px-3 text-[11px] text-kob-text appearance-none transition-colors cursor-pointer"
          >
            <option value="all"    className="bg-[#0F1626]">All Status</option>
            <option value="active" className="bg-[#0F1626]">Active Only</option>
            <option value="frozen" className="bg-[#0F1626]">Frozen Only</option>
          </select>

          {/* KYC */}
          <select
            value={kycTier}
            onChange={(e) => applyFilters({ kycTier: e.target.value, page: 1 })}
            className="h-8 rounded-xl bg-white/5 border border-white/10 focus:border-kob-gold/40 focus:outline-none px-3 text-[11px] text-kob-text appearance-none transition-colors cursor-pointer"
          >
            <option value="all"     className="bg-[#0F1626]">All KYC</option>
            <option value="pending" className="bg-[#0F1626]">Pending KYC</option>
            <option value="0"       className="bg-[#0F1626]">KYC Tier 0</option>
            <option value="1"       className="bg-[#0F1626]">KYC Tier 1</option>
            <option value="2"       className="bg-[#0F1626]">KYC Tier 2</option>
            <option value="3"       className="bg-[#0F1626]">KYC Tier 3</option>
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => applyFilters({ sort: e.target.value, page: 1 })}
            className="h-8 rounded-xl bg-white/5 border border-white/10 focus:border-kob-gold/40 focus:outline-none px-3 text-[11px] text-kob-text appearance-none transition-colors cursor-pointer"
          >
            <option value="newest" className="bg-[#0F1626]">Newest First</option>
            <option value="oldest" className="bg-[#0F1626]">Oldest First</option>
            <option value="name"   className="bg-[#0F1626]">Name A–Z</option>
          </select>
        </div>
      </div>

      {/* ── Loading skeleton ────────────────────────────────────────────── */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/8 bg-[#080E20] h-24 animate-pulse" />
          ))}
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────── */}
      {!loading && users.length === 0 && !apiDown && (
        <div className="rounded-2xl border border-white/8 bg-[#080E20] flex flex-col items-center justify-center py-16 gap-3">
          <Users className="h-10 w-10 text-kob-muted/40" />
          <p className="text-sm font-semibold text-kob-text">No users found</p>
          <p className="text-xs text-kob-muted">Try adjusting your filters or search query</p>
        </div>
      )}

      {/* ── Results ─────────────────────────────────────────────────────── */}
      {!loading && users.length > 0 && (
        <>
          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] text-kob-muted uppercase tracking-widest">
              Showing {from}–{to} of {total.toLocaleString()} users
            </p>
            {pages > 1 && (
              <p className="text-[10px] text-kob-muted">
                Page {page} / {pages}
              </p>
            )}
          </div>

          <div className="space-y-3">
            {users.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                onAction={handleRefresh}
                onNotify={setNotifyTarget}
              />
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => applyFilters({ page: page - 1 })}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-[11px] font-semibold text-kob-muted hover:text-kob-text hover:border-white/20 transition-all disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </button>
              <span className="text-xs text-kob-muted tabular-nums">
                Page <span className="text-kob-text font-semibold">{page}</span> of {pages}
              </span>
              <button
                type="button"
                disabled={page >= pages || loading}
                onClick={() => applyFilters({ page: page + 1 })}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-[11px] font-semibold text-kob-muted hover:text-kob-text hover:border-white/20 transition-all disabled:opacity-40"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Broadcast modal ─────────────────────────────────────────────── */}
      {notifyTarget && (
        <BroadcastModal user={notifyTarget} onClose={() => setNotifyTarget(null)} />
      )}
    </div>
  );
}
