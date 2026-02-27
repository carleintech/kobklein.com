"use client";

import { CheckCircle, Loader2, Send } from "lucide-react";
import { useState } from "react";

const TYPES = [
  { value: "partner", label: "Banking / Payment Partner" },
  { value: "investor", label: "Investor" },
  { value: "enterprise", label: "Enterprise Client" },
  { value: "distributor", label: "K-Agent Distributor" },
  { value: "api", label: "API / Technology Integration" },
];

export function PartnerContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    type: "partner",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL ?? "https://api.app-kobklein.com";
      const res = await fetch(`${apiBase}/v1/public/partner-leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Submission failed");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <CheckCircle className="h-12 w-12 text-emerald-400" />
        <h3 className="font-serif-luxury text-xl font-bold text-kob-text">
          Thank you for reaching out
        </h3>
        <p className="text-sm text-kob-muted max-w-sm">
          Our institutional team will review your inquiry and respond within 1–2 business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="pi-name" className="block text-xs font-semibold text-kob-muted uppercase tracking-wider">
            Full Name *
          </label>
          <input
            id="pi-name"
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Jane Dupont"
            className="w-full h-11 rounded-xl bg-white/5 border border-white/10 focus:border-kob-gold/40 focus:outline-none px-4 text-sm text-kob-text placeholder:text-kob-muted/50 transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="pi-email" className="block text-xs font-semibold text-kob-muted uppercase tracking-wider">
            Business Email *
          </label>
          <input
            id="pi-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="jane@institution.com"
            className="w-full h-11 rounded-xl bg-white/5 border border-white/10 focus:border-kob-gold/40 focus:outline-none px-4 text-sm text-kob-text placeholder:text-kob-muted/50 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="pi-company" className="block text-xs font-semibold text-kob-muted uppercase tracking-wider">
            Organization
          </label>
          <input
            id="pi-company"
            type="text"
            value={form.company}
            onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
            placeholder="Institution or Company"
            className="w-full h-11 rounded-xl bg-white/5 border border-white/10 focus:border-kob-gold/40 focus:outline-none px-4 text-sm text-kob-text placeholder:text-kob-muted/50 transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="pi-type" className="block text-xs font-semibold text-kob-muted uppercase tracking-wider">
            Inquiry Type
          </label>
          <select
            id="pi-type"
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            className="w-full h-11 rounded-xl bg-[#0F1626] border border-white/10 focus:border-kob-gold/40 focus:outline-none px-4 text-sm text-kob-text transition-colors appearance-none"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="pi-message" className="block text-xs font-semibold text-kob-muted uppercase tracking-wider">
          Message
        </label>
        <textarea
          id="pi-message"
          rows={4}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          placeholder="Describe your partnership interest, investment thesis, or integration requirements…"
          className="w-full rounded-xl bg-white/5 border border-white/10 focus:border-kob-gold/40 focus:outline-none px-4 py-3 text-sm text-kob-text placeholder:text-kob-muted/50 transition-colors resize-none"
        />
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-500/8 border border-red-500/20 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-kob-gold text-kob-black font-semibold text-sm hover:bg-kob-gold-light transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
        ) : (
          <><Send className="h-4 w-4" /> Send Inquiry</>
        )}
      </button>
    </form>
  );
}
