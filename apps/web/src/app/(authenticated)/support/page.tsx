"use client";

import {
  CheckCircle,
  Clock,
  HeadphonesIcon,
  Loader2,
  MessageSquare,
  Plus,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const CATEGORIES = ["general", "payment", "kyc", "account", "technical", "other"] as const;
const PRIORITIES = ["low", "normal", "high", "urgent"] as const;

type Ticket = {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  agentNotes: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const STATUS_STYLE: Record<string, { text: string; bg: string; icon: React.ElementType }> = {
  open:        { text: "text-orange-400",  bg: "bg-orange-500/10 border-orange-500/25",  icon: Clock },
  in_progress: { text: "text-[#A596C9]",   bg: "bg-[#A596C9]/10 border-[#A596C9]/25",  icon: Loader2 },
  resolved:    { text: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/25", icon: CheckCircle },
  closed:      { text: "text-kob-muted",   bg: "bg-white/5 border-white/10",              icon: XCircle },
};

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`/api/kobklein/${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? "Request failed");
  return json as T;
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<string>("general");
  const [priority, setPriority] = useState<string>("normal");

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ tickets: Ticket[] }>("v1/support/tickets");
      setTickets(data.tickets ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    setSubmitting(true);
    setFormError("");
    try {
      await apiFetch("v1/support/tickets", {
        method: "POST",
        body: JSON.stringify({ subject: subject.trim(), body: body.trim(), category, priority }),
      });
      setFormSuccess("Ticket submitted! We'll get back to you within 24 hours.");
      setSubject(""); setBody(""); setCategory("general"); setPriority("normal");
      setShowForm(false);
      await loadTickets();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  const openCount = tickets.filter((t) => t.status === "open" || t.status === "in_progress").length;

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center">
            <HeadphonesIcon className="h-5 w-5 text-kob-gold" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-kob-text">Support</h1>
            <p className="text-xs text-kob-muted">
              {openCount > 0 ? `${openCount} active ticket${openCount !== 1 ? "s" : ""}` : "No open tickets"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => { setShowForm((v) => !v); setFormError(""); setFormSuccess(""); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-kob-gold text-kob-black text-xs font-bold hover:bg-kob-gold-light transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          New Ticket
        </button>
      </div>

      {/* Success banner */}
      {formSuccess && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-500/25 bg-emerald-500/8">
          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-400">{formSuccess}</p>
        </div>
      )}

      {/* New ticket form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl p-5 space-y-4" style={{ background: "var(--dash-shell-bg, #1C0A35)", border: "1px solid rgba(212,175,55,0.15)" }}>
          <p className="text-sm font-semibold text-kob-text">New Support Ticket</p>

          <div className="space-y-1.5">
            <label htmlFor="sup-subject" className="text-xs text-kob-muted">Subject</label>
            <input
              id="sup-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of your issue"
              maxLength={200}
              required
              className="w-full h-10 rounded-xl bg-white/5 border border-white/10 focus:border-kob-gold/40 focus:outline-none px-3 text-sm text-kob-text placeholder:text-kob-muted/50 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="sup-category" className="text-xs text-kob-muted">Category</label>
              <select
                id="sup-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 focus:border-kob-gold/40 focus:outline-none px-3 text-sm text-kob-text appearance-none transition-colors capitalize"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-transparent capitalize">{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="sup-priority" className="text-xs text-kob-muted">Priority</label>
              <select
                id="sup-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 focus:border-kob-gold/40 focus:outline-none px-3 text-sm text-kob-text appearance-none transition-colors capitalize"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p} className="bg-transparent capitalize">{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="sup-body" className="text-xs text-kob-muted">Message</label>
            <textarea
              id="sup-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Describe your issue in detail…"
              rows={4}
              maxLength={4000}
              required
              className="w-full rounded-xl bg-white/5 border border-white/10 focus:border-kob-gold/40 focus:outline-none px-3 py-2.5 text-sm text-kob-text placeholder:text-kob-muted/50 resize-none transition-colors"
            />
          </div>

          {formError && (
            <p className="text-xs text-red-400 bg-red-500/8 border border-red-500/20 rounded-xl px-3 py-2">{formError}</p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting || !subject.trim() || !body.trim()}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-kob-gold text-kob-black text-xs font-bold hover:bg-kob-gold-light transition-colors disabled:opacity-40"
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
              {submitting ? "Submitting…" : "Submit Ticket"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl border border-white/10 text-xs text-kob-muted hover:text-kob-text transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Ticket list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-kob-gold" />
          <span className="text-sm text-kob-muted">Loading tickets…</span>
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-2xl flex flex-col items-center justify-center py-16 gap-3" style={{ background: "var(--dash-shell-bg, #1C0A35)", border: "1px solid var(--dash-shell-border, rgba(165,150,201,0.22))" }}>
          <HeadphonesIcon className="h-10 w-10 text-kob-muted/30" />
          <p className="text-sm font-semibold text-kob-text">No support tickets yet</p>
          <p className="text-xs text-kob-muted">Open a ticket and we'll respond within 24 hours</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const ss = STATUS_STYLE[ticket.status] ?? STATUS_STYLE.open;
            const Icon = ss.icon;
            return (
              <div key={ticket.id} className="rounded-2xl p-4 space-y-2" style={{ background: "var(--dash-shell-bg, #1C0A35)", border: "1px solid var(--dash-shell-border, rgba(165,150,201,0.22))" }}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 h-6 w-6 rounded-lg border flex items-center justify-center shrink-0 ${ss.bg}`}>
                    <Icon className={`h-3.5 w-3.5 ${ss.text} ${ticket.status === "in_progress" ? "animate-spin" : ""}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-kob-text">{ticket.subject}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold ${ss.bg} ${ss.text}`}>
                        {ticket.status.replace("_", " ")}
                      </span>
                      <span className="text-[10px] text-kob-muted capitalize">{ticket.category}</span>
                      <span className="text-[10px] text-kob-muted">·</span>
                      <span className="text-[10px] text-kob-muted">{timeAgo(ticket.createdAt)}</span>
                    </div>
                  </div>
                </div>
                {ticket.agentNotes && (
                  <div className="ml-9 px-3 py-2.5 rounded-xl border border-kob-gold/15 bg-kob-gold/5">
                    <p className="text-[10px] text-kob-gold/70 uppercase tracking-wider mb-1">Support Response</p>
                    <p className="text-xs text-kob-muted">{ticket.agentNotes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
