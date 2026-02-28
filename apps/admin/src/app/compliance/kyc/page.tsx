"use client";

import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  RefreshCw,
  UserCheck,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { kkGet, kkPost } from "@/lib/kobklein-api";

// ── Types ─────────────────────────────────────────────────────────────────────

type KycUser = {
  id: string;
  kId: string;
  firstName: string;
  lastName: string;
  phone: string;
  kycTier: number;
  kycStatus: string;
};

type KycProfile = {
  id: string;
  userId: string;
  fullName: string | null;
  documentType: string | null;
  idNumber: string | null;
  documentUrl: string | null;
  selfieUrl: string | null;
  addressProof: string | null;
  submittedAt: string | null;
  user: KycUser;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const DOC_TYPE_LABELS: Record<string, string> = {
  national_id:      "National ID",
  passport:         "Passport",
  drivers_license:  "Driver License",
  drivers_licence:  "Driver License",
  residence_permit: "Residence Permit",
  voter_id:         "Voter ID",
};

function fmtDocType(raw: string | null): string {
  if (!raw) return "—";
  return DOC_TYPE_LABELS[raw] ?? raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return `${Math.floor(ms / 60_000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function initials(p: KycProfile): string {
  const fn = p.user.firstName?.[0] ?? "";
  const ln = p.user.lastName?.[0] ?? "";
  return (fn + ln).toUpperCase() || "?";
}

// ── KYC Card ──────────────────────────────────────────────────────────────────

function KycCard({
  profile,
  submitting,
  onApprove,
  onReject,
}: {
  profile: KycProfile;
  submitting: boolean;
  onApprove: (userId: string) => void;
  onReject: (userId: string, reason: string) => void;
}) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const { user: u } = profile;
  const docCount = [
    profile.documentUrl,
    profile.selfieUrl,
    profile.addressProof,
  ].filter(Boolean).length;

  function handleApprove() {
    onApprove(u.id);
  }

  function handleRejectSubmit() {
    if (!reason.trim()) {
      setError("Rejection reason is required");
      return;
    }
    setError("");
    onReject(u.id, reason.trim());
  }

  return (
    <div
      className={`rounded-2xl border bg-[#080E20] overflow-hidden transition-colors ${
        rejectOpen ? "border-red-500/20" : "border-white/8"
      }`}
    >
      {/* ── Main row ── */}
      <div className="flex items-start gap-4 p-5">
        {/* Avatar */}
        <div className="h-10 w-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-sky-400">
            {initials(profile)}
          </span>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Name + badges */}
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-kob-text">
              {u.firstName} {u.lastName}
            </p>
            {u.kId && (
              <span className="px-2 py-0.5 rounded-md border border-kob-gold/30 bg-kob-gold/8 text-[10px] font-mono font-semibold text-kob-gold">
                {u.kId}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-md border border-sky-500/25 bg-sky-500/10 text-[10px] font-semibold text-sky-400">
              Tier {u.kycTier}
            </span>
            <span className="px-2 py-0.5 rounded-md border border-orange-500/25 bg-orange-500/10 text-[10px] font-semibold text-orange-400 capitalize">
              {u.kycStatus}
            </span>
          </div>

          {/* Phone */}
          <p className="text-[11px] font-mono text-kob-muted">
            {u.phone || "—"}
          </p>

          {/* Document meta grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1.5">
            {[
              { label: "Full Name", value: profile.fullName },
              { label: "Doc Type", value: fmtDocType(profile.documentType) },
              { label: "ID Number", value: profile.idNumber || "—" },
              {
                label: "Submitted",
                value: profile.submittedAt
                  ? `${fmtDate(profile.submittedAt)} · ${timeAgo(profile.submittedAt)}`
                  : null,
              },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[9px] text-kob-muted uppercase tracking-widest mb-0.5">
                  {label}
                </p>
                <p className="text-[11px] text-kob-text font-mono truncate">
                  {value || "—"}
                </p>
              </div>
            ))}
          </div>

          {/* Document proof badges */}
          {docCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-kob-muted uppercase tracking-widest">
                Docs
              </span>
              {profile.documentUrl && (
                <span className="px-2 py-0.5 rounded-md border border-emerald-500/25 bg-emerald-500/10 text-[10px] font-semibold text-emerald-400">
                  ID Doc
                </span>
              )}
              {profile.selfieUrl && (
                <span className="px-2 py-0.5 rounded-md border border-emerald-500/25 bg-emerald-500/10 text-[10px] font-semibold text-emerald-400">
                  Selfie
                </span>
              )}
              {profile.addressProof && (
                <span className="px-2 py-0.5 rounded-md border border-emerald-500/25 bg-emerald-500/10 text-[10px] font-semibold text-emerald-400">
                  Address
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Approve */}
          <button
            type="button"
            disabled={submitting}
            onClick={handleApprove}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-40"
          >
            {submitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle className="h-3.5 w-3.5" />
            )}
            Approve
          </button>

          {/* Reject toggle */}
          <button
            type="button"
            disabled={submitting}
            onClick={() => {
              setRejectOpen((v) => !v);
              setError("");
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition-all disabled:opacity-40 ${
              rejectOpen
                ? "bg-red-500/15 border-red-500/30 text-red-400"
                : "bg-white/5 border-white/10 text-kob-muted hover:text-red-400 hover:border-red-500/25"
            }`}
          >
            <XCircle className="h-3.5 w-3.5" />
            Reject
            {rejectOpen ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>

      {/* ── Reject panel ── */}
      {rejectOpen && (
        <div className="px-5 pb-5 pt-0 border-t border-red-500/10">
          <div className="pt-4 space-y-3">
            <p className="text-[10px] text-red-400/80 uppercase tracking-widest font-semibold">
              Rejection Reason
            </p>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError("");
              }}
              placeholder="Explain why this KYC submission is being rejected…"
              className="w-full rounded-xl bg-white/4 border border-white/10 focus:border-red-500/40 focus:outline-none px-3 py-2.5 text-xs text-kob-text placeholder:text-kob-muted/50 resize-none transition-colors"
            />
            {error && <p className="text-[10px] text-red-400">{error}</p>}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={submitting || !reason.trim()}
                onClick={handleRejectSubmit}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-[11px] font-semibold text-red-400 hover:bg-red-500/25 transition-all disabled:opacity-40"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                Confirm Rejection
              </button>
              <button
                type="button"
                onClick={() => {
                  setRejectOpen(false);
                  setReason("");
                  setError("");
                }}
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

export default function KycReviewPage() {
  const [profiles, setProfiles] = useState<KycProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [actionError, setActionError] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await kkGet<{ profiles: KycProfile[] }>(
        "v1/admin/compliance/kyc-pending",
      );
      setProfiles(data?.profiles ?? []);
    } catch {
      // silent — empty state shown
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleApprove(userId: string) {
    setSubmitting(userId);
    setActionError((p) => ({ ...p, [userId]: "" }));
    try {
      await kkPost(`v1/admin/compliance/kyc/${userId}/approve`, {});
      await load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Approve failed";
      setActionError((p) => ({ ...p, [userId]: msg }));
    } finally {
      setSubmitting(null);
    }
  }

  async function handleReject(userId: string, reason: string) {
    setSubmitting(userId);
    setActionError((p) => ({ ...p, [userId]: "" }));
    try {
      await kkPost(`v1/admin/compliance/kyc/${userId}/reject`, { reason });
      await load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Reject failed";
      setActionError((p) => ({ ...p, [userId]: msg }));
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-kob-text tracking-tight">
            KYC Review Queue
          </h1>
          <p className="text-xs text-kob-muted mt-0.5">
            Review and approve pending identity verifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          {profiles.length > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-orange-500/15 border border-orange-500/25 text-[10px] font-bold text-orange-400">
              {profiles.length} pending
            </span>
          )}
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-kob-muted hover:text-kob-text transition-all disabled:opacity-40"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Loading ─────────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex items-center justify-center py-16 gap-2">
          <Clock className="h-4 w-4 animate-pulse text-kob-gold" />
          <span className="text-xs text-kob-muted">Loading submissions…</span>
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────── */}
      {!loading && profiles.length === 0 && (
        <div className="rounded-2xl border border-white/8 bg-[#080E20] flex flex-col items-center justify-center py-16 gap-3">
          <UserCheck className="h-10 w-10 text-emerald-400" />
          <p className="text-sm font-semibold text-kob-text">Queue is clear</p>
          <p className="text-xs text-kob-muted">
            No pending KYC submissions — all caught up
          </p>
        </div>
      )}

      {/* ── Profiles ────────────────────────────────────────────────────── */}
      {!loading && profiles.length > 0 && (
        <div className="space-y-3">
          {profiles.map((p) => (
            <div key={p.id}>
              <KycCard
                profile={p}
                submitting={submitting === p.user.id}
                onApprove={handleApprove}
                onReject={handleReject}
              />
              {actionError[p.user.id] && (
                <p className="mt-1 text-[10px] text-red-400 px-1">
                  {actionError[p.user.id]}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
