"use client";

import { useState } from "react";
import { kkPost, ApiError } from "@/lib/kobklein-api";
import { ApiUnavailableBanner } from "@/components/api-status-banner";
import { CheckCircle, AlertTriangle } from "lucide-react";

export default function FloatRefillPage() {
  const [id, setId] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [apiDown, setApiDown] = useState(false);

  async function refill() {
    if (!id.trim() || !amount.trim()) return;
    setLoading(true);
    setSuccess("");
    setError("");
    setApiDown(false);
    try {
      await kkPost("admin/float/refill", {
        distributorId: id.trim(),
        amount: Number(amount),
        currency: "HTG",
      });
      setSuccess(
        `Float of G${Number(amount).toLocaleString()} HTG added to distributor ${id.trim()}`,
      );
      setId("");
      setAmount("");
    } catch (e: unknown) {
      if (e instanceof ApiError && e.isApiUnavailable) setApiDown(true);
      else
        setError(
          e instanceof Error ? e.message : "Failed to add float. Please try again.",
        );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-kob-text">
          Distributor Float Refill
        </h1>
        <p className="text-sm text-kob-muted">
          Add HTG float to a distributor&apos;s account
        </p>
      </div>

      {apiDown && <ApiUnavailableBanner />}

      <div className="rounded-xl border border-white/8 bg-[#080E20] p-5 space-y-4 max-w-md">
        {success && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-400">{success}</p>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="distributor-id" className="text-xs text-kob-muted mb-1 block">
            Distributor ID
          </label>
          <input
            id="distributor-id"
            type="text"
            placeholder="User ID or K-ID"
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="w-full rounded-lg border border-white/8 bg-[#060912] text-kob-text placeholder:text-kob-muted px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-kob-gold/30"
          />
        </div>

        <div>
          <label htmlFor="float-amount" className="text-xs text-kob-muted mb-1 block">
            Amount (HTG)
          </label>
          <input
            id="float-amount"
            type="number"
            min="1"
            placeholder="e.g. 50000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border border-white/8 bg-[#060912] text-kob-text placeholder:text-kob-muted px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-kob-gold/30"
          />
        </div>

        <button
          type="button"
          onClick={refill}
          disabled={loading || !id.trim() || !amount.trim()}
          className="w-full rounded-lg bg-kob-gold text-[#080B14] px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {loading ? "Adding Float…" : "Add Float"}
        </button>
      </div>
    </div>
  );
}
