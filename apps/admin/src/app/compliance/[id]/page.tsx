"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { kkGet, kkPost } from "@/lib/kobklein-api";
import {
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

type CaseDetail = {
  id: string;
  caseType: string;
  status: string;
  priority: string;
  subject: string;
  description: string;
  createdAt: string;
  closedAt: string | null;
  actions: { id: string; type: string; note: string; createdAt: string }[];
  messages: { id: string; body: string; createdAt: string }[];
};

type UserInfo = {
  id: string;
  kId: string;
  firstName: string;
  lastName: string;
  phone: string;
  kycTier: number;
  isFrozen: boolean;
};

type CaseResponse = { case: CaseDetail; user: UserInfo };

// ── Badge helpers ──────────────────────────────────────────────────────────────

function PriorityBadge({ p }: { p: string }) {
  const styles: Record<string, string> = {
    critical: "bg-red-500/15 text-red-400",
    high: "bg-yellow-500/15 text-yellow-400",
  };
  const s = styles[p] ?? "bg-white/8 text-kob-muted";
  const label = p.charAt(0).toUpperCase() + p.slice(1);
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${s}`}>
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s =
    status === "open" || status === "investigating"
      ? "bg-yellow-500/15 text-yellow-400"
      : "bg-white/8 text-kob-muted";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${s}`}>
      {status}
    </span>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function CaseDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await kkGet<CaseResponse>(`v1/admin/compliance/cases/${id}`);
      setCaseData(data?.case || null);
      setUser(data?.user || null);
    } catch (e) {
      console.error("Failed to load case:", e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleResolve(resolution: "clear" | "escalate" | "freeze") {
    setResolving(true);
    try {
      await kkPost(`v1/admin/compliance/cases/${id}/resolve`, {
        resolution,
        note: note || undefined,
      });
      setNote("");
      await load();
    } catch (e: unknown) {
      alert(`Resolution failed: ${e instanceof Error ? e.message : "unknown error"}`);
    } finally {
      setResolving(false);
    }
  }

  if (!caseData && !loading) {
    return (
      <div className="text-center text-kob-muted py-12">Case not found</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/compliance"
          className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/8 bg-[#080E20] text-kob-muted hover:text-kob-text hover:border-white/15 transition-colors"
        >
          <ArrowLeft size={14} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-kob-text">Case Detail</h1>
          <p className="text-sm text-kob-muted font-mono">{id}</p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-white/8 bg-[#080E20] px-3 py-1.5 text-xs text-kob-muted hover:text-kob-text hover:border-white/15 transition-colors disabled:opacity-40"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {caseData && (
        <>
          {/* Case Info */}
          <div className="rounded-xl border border-white/8 bg-[#080E20] p-5 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <ShieldAlert size={16} className="text-kob-gold" />
              <span className="font-medium text-kob-text">Case Information</span>
              <PriorityBadge p={caseData.priority} />
              <StatusBadge status={caseData.status} />
            </div>

            <div className="text-sm">
              <p className="font-medium text-kob-text">{caseData.subject}</p>
              <p className="text-kob-muted mt-1">{caseData.description}</p>
            </div>

            <div className="text-xs text-kob-muted">
              Created: {new Date(caseData.createdAt).toLocaleString()}
              {caseData.closedAt && (
                <span className="ml-4">
                  Closed: {new Date(caseData.closedAt).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* User Info */}
          {user && (
            <div className="rounded-xl border border-white/8 bg-[#080E20] p-5">
              <h3 className="font-medium text-kob-text mb-3">Related User</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-xs text-kob-muted block">Name</span>
                  <span className="text-kob-text">
                    {user.firstName} {user.lastName}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-kob-muted block">K-ID</span>
                  <span className="font-mono text-kob-text">{user.kId || "—"}</span>
                </div>
                <div>
                  <span className="text-xs text-kob-muted block">Phone</span>
                  <span className="text-kob-text">{user.phone}</span>
                </div>
                <div>
                  <span className="text-xs text-kob-muted block">Status</span>
                  <div className="flex gap-1.5 mt-0.5">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-white/8 text-kob-muted">
                      Tier {user.kycTier}
                    </span>
                    {user.isFrozen && (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-red-500/15 text-red-400">
                        Frozen
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          {caseData.actions.length > 0 && (
            <div className="rounded-xl border border-white/8 bg-[#080E20] p-5">
              <h3 className="font-medium text-kob-text mb-3">Action Timeline</h3>
              <div className="space-y-2">
                {caseData.actions.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-kob-gold shrink-0" />
                    <span className="text-kob-muted text-xs">
                      {new Date(a.createdAt).toLocaleString()}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-white/15 px-2 py-0.5 text-xs font-semibold text-kob-muted">
                      {a.type}
                    </span>
                    <span className="text-kob-text">{a.note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resolution Actions */}
          {(caseData.status === "open" ||
            caseData.status === "investigating") && (
            <div className="rounded-xl border border-white/8 bg-[#080E20] p-5">
              <h3 className="font-medium text-kob-text mb-3 flex items-center gap-2">
                <AlertTriangle size={16} className="text-kob-gold" />
                Resolve Case
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Resolution note (optional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-lg border border-white/8 bg-[#060912] text-kob-text placeholder:text-kob-muted px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-kob-gold/30"
                />
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleResolve("clear")}
                    disabled={resolving}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40"
                  >
                    <CheckCircle size={14} /> Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResolve("escalate")}
                    disabled={resolving}
                    className="rounded-lg border border-white/8 bg-[#080E20] text-kob-muted hover:text-kob-text hover:border-white/15 px-3 py-1.5 text-sm transition-colors disabled:opacity-40"
                  >
                    Escalate
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResolve("freeze")}
                    disabled={resolving}
                    className="rounded-lg bg-red-600/80 hover:bg-red-600 text-white px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40"
                  >
                    Freeze Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {loading && !caseData && (
        <div className="flex items-center justify-center py-16 text-kob-muted">
          <RefreshCw size={20} className="animate-spin mr-2" />
          Loading case…
        </div>
      )}
    </div>
  );
}
