"use client";

// ─── Emergency Controls — Super Admin Only ────────────────────────────────────
// Route: /emergency  |  Role: super_admin ONLY
// All actions are dual-logged, time-stamped, and require a reason.
// This page controls system-wide kill switches and emergency protocols.

import { useEffect, useState } from "react";
import { kkGet, kkPost } from "@/lib/kobklein-api";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe,
  Lock,
  MapPin,
  RefreshCw,
  Shield,
  ShieldOff,
  Unplug,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ControlStatus = "operational" | "active" | "halted" | "frozen" | "degraded";
type DangerLevel  = "critical" | "high" | "medium";

interface EmergencyControl {
  id: string;
  label: string;
  description: string;
  status: ControlStatus;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  danger: DangerLevel;
  lastActionAt: string | null;
  lastActionBy: string | null;
}

interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  reason: string;
  isReversal: boolean;
}

// ── Initial state ─────────────────────────────────────────────────────────────

const INITIAL_CONTROLS: EmergencyControl[] = [
  {
    id: "global_freeze",
    label: "Global Transaction Freeze",
    description: "Immediately halts ALL transactions across the entire network. No cash-in, cash-out, or transfers can be processed.",
    status: "operational", icon: Globe,    color: "text-red-400",    danger: "critical",
    lastActionAt: null, lastActionBy: null,
  },
  {
    id: "fx_halt",
    label: "FX Rate Halt",
    description: "Freezes all foreign exchange rate updates. Current rates are locked. No new conversions at updated rates.",
    status: "operational", icon: RefreshCw, color: "text-orange-400", danger: "high",
    lastActionAt: null, lastActionBy: null,
  },
  {
    id: "payout_freeze",
    label: "Payout & Settlement Freeze",
    description: "Halts all pending payouts and inter-bank settlements. Queued disbursements are placed in hold state.",
    status: "operational", icon: Lock,      color: "text-orange-400", danger: "high",
    lastActionAt: null, lastActionBy: null,
  },
  {
    id: "kyc_lockout",
    label: "KYC Approval Lockout",
    description: "Suspends all KYC approvals and identity verifications. Pending applications are paused network-wide.",
    status: "operational", icon: Shield,    color: "text-yellow-400", danger: "high",
    lastActionAt: null, lastActionBy: null,
  },
  {
    id: "notif_blackout",
    label: "Notification Blackout",
    description: "Blocks all outbound notifications (SMS, push, email). Useful during a security incident to prevent attacker-triggered alerts.",
    status: "operational", icon: WifiOff,   color: "text-yellow-400", danger: "medium",
    lastActionAt: null, lastActionBy: null,
  },
  {
    id: "api_readonly",
    label: "API Read-Only Mode",
    description: "Puts the entire API into read-only mode. All write operations return 503. Data is safe; no mutations allowed.",
    status: "operational", icon: Unplug,    color: "text-purple-400", danger: "critical",
    lastActionAt: null, lastActionBy: null,
  },
];

const MOCK_AUDIT: AuditEntry[] = [
  {
    id: "a1",
    action: "Global Transaction Freeze — ACTIVATED",
    actor: "superadmin@kobklein.com",
    timestamp: "2026-02-15T14:32:00Z",
    reason: "Suspicious mass withdrawal pattern detected by AML system",
    isReversal: false,
  },
  {
    id: "a2",
    action: "Global Transaction Freeze — REVERSED",
    actor: "superadmin@kobklein.com",
    timestamp: "2026-02-15T16:45:00Z",
    reason: "Pattern confirmed as false positive — cleared by compliance team",
    isReversal: true,
  },
  {
    id: "a3",
    action: "FX Rate Halt — ACTIVATED",
    actor: "superadmin@kobklein.com",
    timestamp: "2026-01-20T09:15:00Z",
    reason: "Extreme USD/HTG volatility — protecting users from rate shock",
    isReversal: false,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function dangerBadge(danger: DangerLevel) {
  const map: Record<DangerLevel, string> = {
    critical: "text-red-400 bg-red-400/10 border-red-400/25",
    high:     "text-orange-400 bg-orange-400/10 border-orange-400/25",
    medium:   "text-yellow-400 bg-yellow-400/10 border-yellow-400/25",
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${map[danger]}`}>
      {danger}
    </span>
  );
}

function controlStatusBadge(status: ControlStatus) {
  const map: Record<ControlStatus, { label: string; cls: string }> = {
    operational: { label: "Operational", cls: "text-emerald-400 bg-emerald-400/10 border-emerald-400/25" },
    active:      { label: "● ACTIVE",    cls: "text-red-400 bg-red-400/10 border-red-400/25" },
    halted:      { label: "HALTED",      cls: "text-red-400 bg-red-400/10 border-red-400/25" },
    frozen:      { label: "FROZEN",      cls: "text-blue-400 bg-blue-400/10 border-blue-400/25" },
    degraded:    { label: "Degraded",    cls: "text-yellow-400 bg-yellow-400/10 border-yellow-400/25" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${cls}`}>
      {label}
    </span>
  );
}

function fmtTimestamp(iso: string | null) {
  if (!iso) return "Never triggered";
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Confirmation Modal ─────────────────────────────────────────────────────────

function ConfirmModal({
  control, activating, reason, onReasonChange, onConfirm, onCancel, loading,
}: {
  control: EmergencyControl;
  activating: boolean;
  reason: string;
  onReasonChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const Icon = control.icon;
  const action      = activating ? "ACTIVATE" : "REVERSE";
  const actionColor = activating
    ? "bg-red-500 hover:bg-red-600 disabled:bg-red-500/40"
    : "bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/40";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.80)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-lg rounded-2xl border p-6"
        style={{ background: "#0F1626", borderColor: "rgba(255,255,255,0.10)" }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-red-500/15 border border-red-500/25">
            <AlertOctagon className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <p className="text-white font-bold">Emergency Action Confirmation</p>
            <p className="text-xs text-white/40">This action is audit-logged and cannot be hidden</p>
          </div>
        </div>

        <div className="rounded-xl p-4 mb-4 border border-white/6" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Icon className={`h-4 w-4 ${control.color}`} />
            <p className="text-white font-semibold text-sm">{control.label}</p>
            {dangerBadge(control.danger)}
          </div>
          <p className="text-xs text-white/40">{control.description}</p>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-white/60 mb-2">
            Reason / Incident Reference <span className="text-red-400">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Describe the incident or reason for this emergency action…"
            rows={3}
            className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder:text-white/25 outline-none border border-white/8 focus:border-[#C9A84C]/40 resize-none transition-colors"
            style={{ background: "rgba(255,255,255,0.04)" }}
          />
        </div>

        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg mb-5 border border-red-500/20"
          style={{ background: "rgba(239,68,68,0.05)" }}
        >
          <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
          <p className="text-xs text-red-400/80">
            This action will be recorded with your identity, timestamp, and reason. It cannot be deleted from the audit log.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-10 rounded-lg text-sm font-semibold text-white/60 border border-white/10 hover:border-white/20 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!reason.trim() || loading}
            className={`flex-1 h-10 rounded-lg text-sm font-bold text-white transition-colors disabled:cursor-not-allowed ${actionColor}`}
          >
            {loading ? "Processing…" : `Confirm ${action}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function EmergencyPage() {
  const [controls, setControls]       = useState<EmergencyControl[]>(INITIAL_CONTROLS);
  const [auditLog, setAuditLog]       = useState<AuditEntry[]>(MOCK_AUDIT);
  const [confirmTarget, setConfirmTarget] = useState<{ control: EmergencyControl; activating: boolean } | null>(null);
  const [reason, setReason]           = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [apiError, setApiError]       = useState<string | null>(null);

  const anyActive = controls.some((c) => c.status !== "operational");

  // ── Load real status from API on mount ──────────────────────────────────────
  useEffect(() => {
    void (async () => {
      try {
        const res = await kkGet<{
          ok:        boolean;
          controls:  Record<string, boolean>;
          anyActive: boolean;
          checkedAt: string;
        }>("admin/emergency/status");

        if (res.ok) {
          setControls((prev) =>
            prev.map((c) => ({
              ...c,
              status: res.controls[c.id] ? "active" : "operational",
            })),
          );
        }
      } catch {
        // Keep INITIAL_CONTROLS (all operational) as fallback — API may require super_admin JWT
      }
    })();
  }, []);

  function handleToggle(control: EmergencyControl) {
    setConfirmTarget({ control, activating: control.status === "operational" });
    setReason("");
    setApiError(null);
  }

  async function handleConfirm() {
    if (!confirmTarget || !reason.trim() || actionLoading) return;
    const { control, activating } = confirmTarget;
    const now = new Date().toISOString();

    setActionLoading(true);
    setApiError(null);

    try {
      // Call real backend — activate or reverse
      if (activating) {
        await kkPost("admin/emergency/activate", { controlId: control.id, reason });
      } else {
        await kkPost("admin/emergency/reverse", { controlId: control.id, reason });
      }

      // Update local state after successful API call
      setControls((prev) =>
        prev.map((c) =>
          c.id === control.id
            ? { ...c, status: activating ? "active" : "operational", lastActionAt: now, lastActionBy: "You" }
            : c,
        ),
      );

      setAuditLog((prev) => [
        {
          id:        `a${Date.now()}`,
          action:    `${control.label} — ${activating ? "ACTIVATED" : "REVERSED"}`,
          actor:     "You (super_admin)",
          timestamp: now,
          reason,
          isReversal: !activating,
        },
        ...prev,
      ]);

      setConfirmTarget(null);
      setReason("");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Action failed — check your connection.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Zap className="h-5 w-5 text-red-400" />
          <h1 className="text-xl font-bold text-white tracking-tight">Emergency Controls</h1>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border border-red-500/25 text-red-400 bg-red-500/8">
            SUPER ADMIN ONLY
          </span>
        </div>
        <p className="text-sm text-white/40">
          System-wide kill switches · Incident response · All actions permanently audit-logged
        </p>
      </div>

      {/* ── System Status Banner ── */}
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
          anyActive
            ? "border-red-500/30 bg-red-500/6"
            : "border-emerald-500/20 bg-emerald-500/5"
        }`}
      >
        {anyActive ? (
          <AlertOctagon className="h-5 w-5 text-red-400 shrink-0" />
        ) : (
          <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
        )}
        <div>
          <p className={`text-sm font-bold ${anyActive ? "text-red-400" : "text-emerald-400"}`}>
            {anyActive
              ? "⚠ EMERGENCY CONTROLS ACTIVE — Network impacted"
              : "All Systems Operational"}
          </p>
          <p className="text-xs text-white/40">
            {anyActive
              ? "One or more emergency controls are engaged. Communicate status to operations team immediately."
              : "No emergency controls are active. KobKlein network is fully operational."}
          </p>
        </div>
      </div>

      {/* ── Kill Switches ── */}
      <div>
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Kill Switches</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {controls.map((control) => {
            const Icon = control.icon;
            const isActive = control.status !== "operational";
            return (
              <div
                key={control.id}
                className={`rounded-xl p-5 border transition-all ${
                  isActive
                    ? "border-red-500/30"
                    : "border-white/6 hover:border-white/10"
                }`}
                style={isActive ? { background: "rgba(239,68,68,0.04)" } : { background: "rgba(255,255,255,0.02)" }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${isActive ? "bg-red-500/15 border border-red-500/25" : "bg-white/5 border border-white/8"}`}>
                      <Icon className={`h-4 w-4 ${isActive ? "text-red-400" : control.color}`} />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{control.label}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {controlStatusBadge(control.status)}
                        {dangerBadge(control.danger)}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-white/40 mb-4 leading-relaxed">{control.description}</p>

                {control.lastActionAt && (
                  <div className="flex items-center gap-1.5 mb-3 text-[10px] text-white/30">
                    <Clock className="h-3 w-3" />
                    <span>Last: {fmtTimestamp(control.lastActionAt)} by {control.lastActionBy}</span>
                  </div>
                )}

                <button
                  onClick={() => handleToggle(control)}
                  className={`w-full h-9 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? "bg-emerald-600/80 hover:bg-emerald-600 text-white border border-emerald-500/30"
                      : "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 hover:border-red-500/40"
                  }`}
                >
                  {isActive ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <Wifi className="h-3.5 w-3.5" /> Reverse / Restore
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      <ShieldOff className="h-3.5 w-3.5" /> Activate Emergency Control
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Region-Specific Freeze ── */}
      <div>
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Regional Controls</h2>
        <div
          className="rounded-xl p-5 border border-white/6"
          style={{ background: "rgba(255,255,255,0.02)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-blue-400" />
            <p className="text-white font-semibold text-sm">Region-Specific Transaction Freeze</p>
            <span className="text-[10px] text-white/30 border border-white/10 px-1.5 py-0.5 rounded">Surgical — no global impact</span>
          </div>
          <p className="text-xs text-white/40 mb-4">
            Freeze transactions for a specific region without impacting the rest of the network.
            Less disruptive than a global freeze.
          </p>
          <div className="flex gap-3">
            <select
              className="flex-1 h-9 px-3 rounded-lg text-sm text-white/70 outline-none border border-white/8 focus:border-[#C9A84C]/40 transition-colors"
              style={{ background: "rgba(255,255,255,0.04)" }}
              defaultValue=""
            >
              <option value="" disabled style={{ background: "#0F1626" }}>Select Region…</option>
              {["Port-au-Prince", "Cap-Haïtien", "Gonaïves", "Les Cayes", "Jacmel", "Saint-Marc"].map((r) => (
                <option key={r} style={{ background: "#0F1626" }}>{r}</option>
              ))}
            </select>
            <button className="px-4 h-9 rounded-lg text-xs font-bold text-red-400 border border-red-500/25 bg-red-500/10 hover:bg-red-500/20 transition-colors whitespace-nowrap">
              Freeze Region
            </button>
          </div>
        </div>
      </div>

      {/* ── Emergency Audit Log ── */}
      <div>
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
          Emergency Action Log
          <span className="ml-2 text-white/20 normal-case font-normal">Immutable — cannot be deleted or modified</span>
        </h2>
        <div className="rounded-xl border border-white/6 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
          {auditLog.length === 0 ? (
            <div className="py-10 text-center text-sm text-white/30">
              No emergency actions recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-white/4">
              {auditLog.map((entry) => (
                <div key={entry.id} className="px-4 py-3 flex items-start gap-3">
                  <div className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${entry.isReversal ? "bg-emerald-400/15" : "bg-red-400/15"}`}>
                    {entry.isReversal ? (
                      <CheckCircle className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 text-red-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{entry.action}</p>
                    <p className="text-xs text-white/40 mt-0.5 italic">"{entry.reason}"</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-white/30">{entry.actor}</span>
                      <span className="text-[10px] text-white/20">·</span>
                      <span className="text-[10px] text-white/30">{fmtTimestamp(entry.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Confirm Modal ── */}
      {confirmTarget && (
        <ConfirmModal
          control={confirmTarget.control}
          activating={confirmTarget.activating}
          reason={reason}
          onReasonChange={setReason}
          onConfirm={() => void handleConfirm()}
          onCancel={() => { setConfirmTarget(null); setApiError(null); }}
          loading={actionLoading}
        />
      )}

      {/* API error toast */}
      {apiError && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 text-sm text-red-400"
          style={{ background: "#0F1626" }}
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {apiError}
          <button onClick={() => setApiError(null)} className="ml-2 text-white/40 hover:text-white/60 text-xs">✕</button>
        </div>
      )}
    </div>
  );
}
