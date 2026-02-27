"use client";

import {
  CheckCircle,
  Loader2,
  Megaphone,
  Send,
} from "lucide-react";
import { useState } from "react";
import { kkPost } from "@/lib/kobklein-api";

const CHANNELS = ["push", "email", "sms"] as const;
const ROLES = ["", "client", "diaspora", "merchant", "distributor", "admin"] as const;
const ROLE_LABELS: Record<string, string> = {
  "": "All Users",
  client: "Clients",
  diaspora: "Diaspora",
  merchant: "Merchants",
  distributor: "Distributors",
  admin: "Admins",
};

type BroadcastResult = { queued: number; channel: string; targetRole: string };

export default function BroadcastPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState<"push" | "email" | "sms">("push");
  const [targetRole, setTargetRole] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [error, setError] = useState("");

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setSending(true);
    setResult(null);
    setError("");
    try {
      const res = await kkPost<BroadcastResult>("v1/admin/broadcast", {
        subject: subject.trim(),
        message: message.trim(),
        channel,
        ...(targetRole ? { targetRole } : {}),
      });
      setResult(res);
      setSubject("");
      setMessage("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Broadcast failed");
    } finally {
      setSending(false);
    }
  }

  const charCount = message.length;
  const warnLimit = channel === "sms" ? 160 : 1000;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-kob-text tracking-tight flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-kob-gold" />
          Broadcast Manager
        </h1>
        <p className="text-xs text-kob-muted mt-0.5">
          Send notifications to all users or a specific role segment
        </p>
      </div>

      {/* Success banner */}
      {result && (
        <div className="flex items-start gap-3 px-4 py-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/8">
          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-400">Broadcast queued successfully</p>
            <p className="text-xs text-emerald-400/70 mt-0.5">
              {result.queued} notification{result.queued !== 1 ? "s" : ""} queued via {result.channel.toUpperCase()} to {ROLE_LABELS[result.targetRole] ?? result.targetRole}
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSend} className="rounded-2xl border border-white/8 bg-[#080E20] p-6 space-y-5">

        {/* Channel + Target row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-kob-muted uppercase tracking-widest">Channel</label>
            <div className="flex gap-1.5">
              {CHANNELS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setChannel(c)}
                  className={`flex-1 py-2 rounded-xl border text-[11px] font-semibold uppercase transition-all ${
                    channel === c
                      ? "bg-kob-gold/10 border-kob-gold/30 text-kob-gold"
                      : "bg-white/4 border-white/8 text-kob-muted hover:text-kob-text"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-kob-muted uppercase tracking-widest">Target Audience</label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full h-10 rounded-xl bg-white/5 border border-white/10 focus:border-kob-gold/40 focus:outline-none px-3 text-xs text-kob-text appearance-none transition-colors"
            >
              {ROLES.map((r) => (
                <option key={r} value={r} className="bg-[#0F1626]">
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Subject */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-kob-muted uppercase tracking-widest">
            Subject {channel === "push" && <span className="text-kob-muted/50">(push title)</span>}
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Important system update"
            maxLength={100}
            required
            className="w-full h-10 rounded-xl bg-white/5 border border-white/10 focus:border-kob-gold/40 focus:outline-none px-3 text-sm text-kob-text placeholder:text-kob-muted/50 transition-colors"
          />
        </div>

        {/* Message */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-semibold text-kob-muted uppercase tracking-widest">Message</label>
            <span className={`text-[10px] font-mono ${charCount > warnLimit ? "text-orange-400" : "text-kob-muted/50"}`}>
              {charCount}/{warnLimit}
            </span>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message here…"
            rows={4}
            maxLength={2000}
            required
            className="w-full rounded-xl bg-white/5 border border-white/10 focus:border-kob-gold/40 focus:outline-none px-3 py-2.5 text-sm text-kob-text placeholder:text-kob-muted/50 resize-none transition-colors"
          />
          {channel === "sms" && charCount > 160 && (
            <p className="text-[10px] text-orange-400">SMS messages over 160 chars may be split into multiple segments</p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-3 py-2.5 rounded-xl border border-red-500/20 bg-red-500/8 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Preview & Send */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-xs text-kob-muted">
            Sending to: <span className="text-kob-text font-medium">{ROLE_LABELS[targetRole]}</span>
            {" "}via <span className="text-kob-gold font-semibold uppercase">{channel}</span>
          </div>
          <button
            type="submit"
            disabled={sending || !subject.trim() || !message.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-kob-gold text-kob-black text-xs font-bold hover:bg-kob-gold-light transition-all disabled:opacity-40"
          >
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {sending ? "Sending…" : "Send Broadcast"}
          </button>
        </div>
      </form>

      {/* Warning */}
      <div className="rounded-xl border border-orange-500/15 bg-orange-500/5 px-4 py-3">
        <p className="text-xs text-orange-400/80">
          Broadcasts are capped at <strong>500 recipients</strong> per send. For larger campaigns, use segmented sends.
          All broadcasts are audit-logged.
        </p>
      </div>
    </div>
  );
}
