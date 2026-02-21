"use client";

import { Card } from "@/components/card";
import { Badge } from "@/components/badge";
import { kkPost } from "@/lib/kobklein-api";
import { useState } from "react";

interface ReconResult {
  status: string;
  finishedAt: string;
  summary: {
    webhookCount: number;
    expiredPendingWithdrawals: number;
    stuckDomainEvents: number;
    negativeWallets: number;
    orphanedLedgerEntries: number;
    duplicateWebhooks: number;
  } | null;
  error: string | null;
}

interface HealthSignal {
  label: string;
  value: number;
  ok: boolean;
}

export default function SystemPage() {
  const [recon, setRecon] = useState<ReconResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runRecon() {
    setLoading(true);
    setError(null);
    try {
      const data = await kkPost<ReconResult>("admin/recon/run", {});
      setRecon(data);
    } catch (e: any) {
      setError(e.message || "Failed to run reconciliation");
    } finally {
      setLoading(false);
    }
  }

  const signals: HealthSignal[] = recon?.summary
    ? [
        { label: "Webhook Events", value: recon.summary.webhookCount, ok: true },
        { label: "Expired Pending Withdrawals", value: recon.summary.expiredPendingWithdrawals, ok: recon.summary.expiredPendingWithdrawals === 0 },
        { label: "Stuck Domain Events", value: recon.summary.stuckDomainEvents, ok: recon.summary.stuckDomainEvents === 0 },
        { label: "Negative Wallets", value: recon.summary.negativeWallets, ok: recon.summary.negativeWallets === 0 },
        { label: "Orphaned Ledger Entries", value: recon.summary.orphanedLedgerEntries, ok: recon.summary.orphanedLedgerEntries === 0 },
        { label: "Duplicate Webhooks", value: recon.summary.duplicateWebhooks, ok: recon.summary.duplicateWebhooks === 0 },
      ]
    : [];

  const healthy = signals.length > 0 && signals.every((s) => s.ok);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">System Health</h1>
          <p className="text-sm text-[var(--text-muted)]">Reconciliation, stuck events & platform integrity</p>
        </div>
        <button
          onClick={runRecon}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-[var(--accent)] text-black hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Running…" : "Run Reconciliation"}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {recon && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <Card
              title="Overall Status"
              value={healthy ? "Healthy" : "Issues Found"}
              accent={healthy ? "green" : "red"}
            />
            <Card title="Recon Status" value={recon.status} accent={recon.status === "success" ? "green" : "red"} />
            <Card
              title="Last Run"
              value={recon.finishedAt ? new Date(recon.finishedAt).toLocaleTimeString() : "—"}
            />
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <h2 className="text-sm font-medium">Health Signals</h2>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {signals.map((s) => (
                <div key={s.label} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm">{s.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm">{s.value}</span>
                    <Badge variant={s.ok ? "green" : "red"}>{s.ok ? "OK" : "Alert"}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {recon.error && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <h2 className="text-sm font-medium mb-2">Error Details</h2>
              <pre className="text-xs text-red-400 whitespace-pre-wrap">{recon.error}</pre>
            </div>
          )}
        </>
      )}

      {!recon && !loading && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            Click &quot;Run Reconciliation&quot; to check system health across 6 signals
          </p>
        </div>
      )}
    </div>
  );
}
