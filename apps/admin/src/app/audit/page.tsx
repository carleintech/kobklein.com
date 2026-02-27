"use client";

import {
  Activity,
  ArrowRightLeft,
  Clock,
  FileText,
  Filter,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { kkGet } from "@/lib/kobklein-api";

// ── Types ─────────────────────────────────────────────────────────────────────

type ActorUser = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
};

type AuditLog = {
  id: string;
  eventType: string;
  amount?: number;
  currency?: string;
  actorUser?: ActorUser;
  fromWalletId?: string;
  toWalletId?: string;
  referenceId?: string;
  createdAt: string;
};

// ── Style maps ────────────────────────────────────────────────────────────────

const EVENT_STYLE: Record<string, { text: string; bg: string; label: string }> =
  {
    transfer_sent: {
      text: "text-sky-400",
      bg: "bg-sky-500/10 border-sky-500/25",
      label: "Transfer Sent",
    },
    merchant_payment: {
      text: "text-kob-gold",
      bg: "bg-kob-gold/10 border-kob-gold/25",
      label: "Merchant Payment",
    },
    merchant_withdrawal: {
      text: "text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/25",
      label: "Merch Withdrawal",
    },
    float_transfer: {
      text: "text-violet-400",
      bg: "bg-violet-500/10 border-violet-500/25",
      label: "Float Transfer",
    },
    admin_float_refill: {
      text: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/25",
      label: "Float Refill",
    },
    transfer_reversal: {
      text: "text-red-400",
      bg: "bg-red-500/10 border-red-500/25",
      label: "Reversal",
    },
    withdrawal_requested: {
      text: "text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/25",
      label: "Withdrawal Req",
    },
    withdrawal_approved: {
      text: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/25",
      label: "Withdrawal OK",
    },
    distributor_approved: {
      text: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/25",
      label: "Dist Approved",
    },
    distributor_suspended: {
      text: "text-red-400",
      bg: "bg-red-500/10 border-red-500/25",
      label: "Dist Suspended",
    },
    commission_payout: {
      text: "text-kob-gold",
      bg: "bg-kob-gold/10 border-kob-gold/25",
      label: "Commission Payout",
    },
    kyc_approved: {
      text: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/25",
      label: "KYC Approved",
    },
    kyc_rejected: {
      text: "text-red-400",
      bg: "bg-red-500/10 border-red-500/25",
      label: "KYC Rejected",
    },
  };

const EVENT_GROUPS: Record<string, string[]> = {
  transfers: ["transfer_sent", "transfer_reversal", "float_transfer"],
  payments: ["merchant_payment", "merchant_withdrawal"],
  withdrawals: ["withdrawal_requested", "withdrawal_approved"],
  admin: [
    "admin_float_refill",
    "distributor_approved",
    "distributor_suspended",
    "commission_payout",
    "kyc_approved",
    "kyc_rejected",
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function fmtAmount(amount?: number, currency?: string) {
  if (!amount) return null;
  return `${amount.toLocaleString("fr-HT")} ${currency ?? ""}`.trim();
}

function actorName(u?: ActorUser) {
  if (!u) return "System";
  const name =
    [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || "";
  return name || `user:${u.id.slice(0, 8)}`;
}

function eventStyle(type: string) {
  return (
    EVENT_STYLE[type] ?? {
      text: "text-kob-muted",
      bg: "bg-white/5 border-white/10",
      label: type.replace(/_/g, " "),
    }
  );
}

function isToday(d: string) {
  return new Date(d).toDateString() === new Date().toDateString();
}
function isThisWeek(d: string) {
  return new Date(d) >= new Date(Date.now() - 7 * 86400_000);
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-[#080E20] p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-kob-muted uppercase tracking-wider">
          {label}
        </span>
        <Icon size={14} className="text-kob-muted" />
      </div>
      <div className="text-2xl font-semibold text-kob-text">{value}</div>
      {sub && <div className="text-xs text-kob-muted mt-1">{sub}</div>}
    </div>
  );
}

// ── Log Row ───────────────────────────────────────────────────────────────────

function LogRow({ log }: { log: AuditLog }) {
  const es = eventStyle(log.eventType);
  const amt = fmtAmount(log.amount, log.currency);

  return (
    <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)] gap-4 px-4 py-3 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-start text-sm">
      {/* Event */}
      <div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${es.bg} ${es.text}`}
        >
          {es.label}
        </span>
      </div>

      {/* Actor */}
      <div className="truncate">
        <div className="text-kob-text truncate">{actorName(log.actorUser)}</div>
        {log.actorUser?.email && (
          <div className="text-kob-muted text-xs truncate">
            {log.actorUser.email}
          </div>
        )}
      </div>

      {/* Amount */}
      <div className="font-mono text-kob-text">
        {amt ? (
          <span className="text-kob-gold">{amt}</span>
        ) : (
          <span className="text-kob-muted">—</span>
        )}
      </div>

      {/* Wallets */}
      <div className="font-mono text-xs text-kob-muted space-y-0.5">
        {log.fromWalletId && (
          <div className="truncate">↑ {log.fromWalletId.slice(0, 10)}…</div>
        )}
        {log.toWalletId && (
          <div className="truncate">↓ {log.toWalletId.slice(0, 10)}…</div>
        )}
        {!log.fromWalletId && !log.toWalletId && <span>—</span>}
      </div>

      {/* Reference */}
      <div className="font-mono text-xs text-kob-muted truncate">
        {log.referenceId ? `${log.referenceId.slice(0, 10)}…` : "—"}
      </div>

      {/* Time */}
      <div className="text-right text-xs">
        <div className="text-kob-muted">{timeAgo(log.createdAt)}</div>
        <div className="text-kob-muted/60 mt-0.5">
          {new Date(log.createdAt).toLocaleTimeString("fr-HT")}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TAKE_OPTIONS = [50, 100, 200];
const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "transfers", label: "Transfers" },
  { key: "payments", label: "Payments" },
  { key: "withdrawals", label: "Withdrawals" },
  { key: "admin", label: "Admin" },
] as const;
type FilterKey = (typeof FILTER_TABS)[number]["key"];

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [take, setTake] = useState(50);
  const [filter, setFilter] = useState<FilterKey>("all");

  const load = useCallback(async (rows: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await kkGet<AuditLog[]>(`admin/audit?take=${rows}`);
      setLogs(data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(take);
  }, [load, take]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const todayCount = logs.filter((l) => isToday(l.createdAt)).length;
  const weekCount = logs.filter((l) => isThisWeek(l.createdAt)).length;

  const typeCounts = logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.eventType] = (acc[l.eventType] ?? 0) + 1;
    return acc;
  }, {});

  // ── Filter ─────────────────────────────────────────────────────────────────
  const visible = logs.filter((l) => {
    if (filter === "all") return true;
    return EVENT_GROUPS[filter]?.includes(l.eventType) ?? false;
  });

  const groupCount = (key: FilterKey) => {
    if (key === "all") return logs.length;
    return logs.filter((l) => EVENT_GROUPS[key]?.includes(l.eventType)).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-kob-text flex items-center gap-2">
            <ShieldCheck size={20} className="text-kob-gold" />
            Audit Trail
          </h1>
          <p className="text-sm text-kob-muted mt-0.5">
            Complete financial event history — immutable ledger
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Row count selector */}
          <div className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-[#080E20] px-2 py-1.5">
            <Filter size={12} className="text-kob-muted" />
            <select
              aria-label="Number of rows"
              value={take}
              onChange={(e) => setTake(Number(e.target.value))}
              className="bg-transparent text-xs text-kob-text focus:outline-none"
            >
              {TAKE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} rows
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => load(take)}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-[#080E20] px-3 py-1.5 text-xs text-kob-muted hover:text-kob-text hover:border-white/15 transition-colors disabled:opacity-40"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Today"
          value={todayCount}
          sub="events logged"
          icon={Clock}
        />
        <KpiCard
          label="This Week"
          value={weekCount}
          sub="events logged"
          icon={Activity}
        />
        <KpiCard
          label="Loaded"
          value={logs.length}
          sub={`of ${take} max`}
          icon={FileText}
        />
        <KpiCard
          label="Event Types"
          value={Object.keys(typeCounts).length}
          sub="distinct types"
          icon={ArrowRightLeft}
        />
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 rounded-xl border border-white/8 bg-[#080E20] p-1 w-fit">
        {FILTER_TABS.map((tab) => {
          const count = groupCount(tab.key);
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === tab.key
                  ? "bg-kob-gold text-[#080B14]"
                  : "text-kob-muted hover:text-kob-text"
              }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  filter === tab.key
                    ? "bg-black/20 text-[#080B14]"
                    : "bg-white/8 text-kob-muted"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Log table */}
      <div className="rounded-xl border border-white/8 bg-[#080E20] overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)] gap-4 px-4 py-2.5 border-b border-white/8 bg-white/[0.02]">
          {["Event", "Actor", "Amount", "Wallets", "Reference", "Time"].map(
            (h, i) => (
              <div
                key={"col-" + i}
                className="text-[10px] font-semibold uppercase tracking-widest text-kob-muted last:text-right"
              >
                {h}
              </div>
            ),
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-kob-muted">
            <RefreshCw size={20} className="animate-spin mr-2" />
            Loading audit trail…
          </div>
        ) : visible.length === 0 ? (
          <div className="py-16 text-center text-kob-muted text-sm">
            No events match the selected filter
          </div>
        ) : (
          visible.map((log) => <LogRow key={log.id} log={log} />)
        )}
      </div>

      <p className="text-xs text-kob-muted/60">
        Showing {visible.length} of {logs.length} loaded events — audit logs are
        immutable
      </p>
    </div>
  );
}
