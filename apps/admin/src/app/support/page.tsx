"use client";

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  HeadphonesIcon,
  Loader2,
  MessageSquare,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { kkGet, kkPost } from "@/lib/kobklein-api";

type TicketUser = {
  id: string;
  kId: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
};

type Ticket = {
  id: string;
  subject: string;
  body: string;
  category: string;
  priority: string;
  status: string;
  agentNotes: string | null;
  resolvedAt: string | null;
  createdAt: string;
  user: TicketUser;
};

type Stats = { open: number; inProgress: number; resolved: number; urgent: number; total: number };

const PRIORITY_STYLE: Record<string, { text: string; bg: string }> = {
  urgent: { text: "text-red-400",     bg: "bg-red-500/10 border-red-500/25" },
  high:   { text: "text-orange-400",  bg: "bg-orange-500/10 border-orange-500/25" },
  normal: { text: "text-sky-400",     bg: "bg-sky-500/10 border-sky-500/25" },
  low:    { text: "text-kob-muted",   bg: "bg-white/5 border-white/10" },
};

const STATUS_STYLE: Record<string, { text: string; bg: string }> = {
  open:        { text: "text-orange-400",  bg: "bg-orange-500/10 border-orange-500/25" },
  in_progress: { text: "text-sky-400",     bg: "bg-sky-500/10 border-sky-500/25" },
  resolved:    { text: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/25" },
  closed:      { text: "text-kob-muted",   bg: "bg-white/5 border-white/10" },
};

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function TicketRow({ ticket, onUpdate }: { ticket: Ticket; onUpdate: () => void }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(ticket.agentNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const ps = PRIORITY_STYLE[ticket.priority] ?? PRIORITY_STYLE.normal;
  const ss = STATUS_STYLE[ticket.status] ?? STATUS_STYLE.open;

  async function handleUpdate(status?: string) {
    setSaving(true);
    setMsg("");
    try {
      await kkPost(`v1/support/admin/tickets/${ticket.id}`, {
        ...(status ? { status } : {}),
        agentNotes: notes,
      });
      setMsg("Saved");
      onUpdate();
    } catch {
      setMsg("Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`border-b border-white/5 ${open ? "bg-white/[0.015]" : ""}`}>
      {/* Summary row */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_80px_80px_80px_70px] gap-4 px-4 py-3 hover:bg-white/[0.02] transition-colors items-center"
      >
        <div>
          <p className="text-sm text-kob-text truncate">{ticket.subject}</p>
          <p className="text-[10px] text-kob-muted mt-0.5">
            {ticket.user.firstName} {ticket.user.lastName}
            {ticket.user.kId && <span className="ml-1.5 font-mono text-kob-gold/70">{ticket.user.kId}</span>}
          </p>
        </div>
        <p className="text-xs text-kob-muted capitalize">{ticket.category}</p>
        <span className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-semibold capitalize ${ps.bg} ${ps.text}`}>
          {ticket.priority}
        </span>
        <span className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-semibold capitalize ${ss.bg} ${ss.text}`}>
          {ticket.status.replace("_", " ")}
        </span>
        <span className="text-xs text-kob-muted">{timeAgo(ticket.createdAt)}</span>
        <span className="text-[10px] text-kob-gold text-right">{open ? "Close ▲" : "View ▼"}</span>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="px-4 pb-5 pt-1 space-y-4">
          {/* Message */}
          <div className="rounded-xl border border-white/8 bg-[#080B14] p-4">
            <p className="text-[10px] text-kob-muted uppercase tracking-wider mb-2">User Message</p>
            <p className="text-sm text-kob-text whitespace-pre-wrap">{ticket.body}</p>
          </div>

          {/* Agent notes */}
          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-kob-muted uppercase tracking-widest">
              Agent Notes (internal)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add notes for this ticket…"
              className="w-full rounded-xl bg-white/5 border border-white/10 focus:border-kob-gold/40 focus:outline-none px-3 py-2.5 text-xs text-kob-text placeholder:text-kob-muted/50 resize-none transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {ticket.status !== "in_progress" && (
              <button
                type="button"
                disabled={saving}
                onClick={() => handleUpdate("in_progress")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/25 text-[11px] font-semibold text-sky-400 hover:bg-sky-500/20 transition-all disabled:opacity-40"
              >
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Clock className="h-3 w-3" />}
                Mark In Progress
              </button>
            )}
            {ticket.status !== "resolved" && (
              <button
                type="button"
                disabled={saving}
                onClick={() => handleUpdate("resolved")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-40"
              >
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                Resolve
              </button>
            )}
            {ticket.status !== "closed" && (
              <button
                type="button"
                disabled={saving}
                onClick={() => handleUpdate("closed")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-semibold text-kob-muted hover:text-red-400 hover:border-red-500/25 transition-all disabled:opacity-40"
              >
                <XCircle className="h-3 w-3" />
                Close
              </button>
            )}
            <button
              type="button"
              disabled={saving}
              onClick={() => handleUpdate()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-kob-gold/10 border border-kob-gold/25 text-[11px] font-semibold text-kob-gold hover:bg-kob-gold/20 transition-all disabled:opacity-40"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Save Notes
            </button>
            {msg && <span className={`text-[10px] font-medium ${msg === "Saved" ? "text-emerald-400" : "text-red-400"}`}>{msg}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

const STATUS_TABS = ["all", "open", "in_progress", "resolved", "closed"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

export default function SupportDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<StatusTab>("open");

  const load = useCallback(async (status: StatusTab) => {
    setLoading(true);
    try {
      const [s, t] = await Promise.all([
        kkGet<Stats>("v1/support/admin/stats"),
        kkGet<{ tickets: Ticket[]; total: number }>(
          `v1/support/admin/tickets?status=${status === "all" ? "" : status}&take=100`,
        ),
      ]);
      setStats(s);
      setTickets(t.tickets ?? []);
      setTotal(t.total ?? 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(tab); }, [load, tab]);

  const urgentCount = stats?.urgent ?? 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-kob-text tracking-tight flex items-center gap-2">
            <HeadphonesIcon className="h-5 w-5 text-kob-gold" />
            Support Dashboard
          </h1>
          <p className="text-xs text-kob-muted mt-0.5">Manage user support tickets · {total} total</p>
        </div>
        <button
          type="button"
          onClick={() => load(tab)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-kob-muted hover:text-kob-text transition-all disabled:opacity-40"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {urgentCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/25 bg-red-500/8">
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 animate-pulse" />
          <p className="text-xs text-red-400 font-semibold">
            {urgentCount} urgent ticket{urgentCount !== 1 ? "s" : ""} require immediate attention
          </p>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Open", value: stats?.open ?? "—", icon: MessageSquare, color: "text-orange-400" },
          { label: "In Progress", value: stats?.inProgress ?? "—", icon: Clock, color: "text-sky-400" },
          { label: "Resolved", value: stats?.resolved ?? "—", icon: CheckCircle, color: "text-emerald-400" },
          { label: "Urgent", value: urgentCount, icon: AlertTriangle, color: urgentCount > 0 ? "text-red-400" : "text-kob-muted" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-white/8 bg-[#080E20] p-4 flex items-center gap-3">
            <Icon className={`h-4 w-4 shrink-0 ${color}`} />
            <div>
              <p className="text-[9px] text-kob-muted uppercase tracking-widest">{label}</p>
              <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl border border-white/8 bg-[#080E20] p-1 w-fit">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setTab(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              tab === s ? "bg-kob-gold text-[#080B14]" : "text-kob-muted hover:text-kob-text"
            }`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/8 bg-[#080E20] overflow-hidden">
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_80px_80px_80px_70px] gap-4 px-4 py-2.5 border-b border-white/8 bg-white/[0.02]">
          {["Subject / User", "Category", "Priority", "Status", "Opened", ""].map((h, i) => (
            <div key={"col-" + i} className="text-[10px] font-semibold uppercase tracking-widest text-kob-muted">{h}</div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-kob-gold" />
            <span className="text-xs text-kob-muted">Loading tickets…</span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center text-kob-muted text-sm">No tickets in this category</div>
        ) : (
          tickets.map((t) => <TicketRow key={t.id} ticket={t} onUpdate={() => load(tab)} />)
        )}
      </div>
    </div>
  );
}
