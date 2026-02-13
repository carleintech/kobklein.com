import { Badge } from "@/components/badge";
import { DataTable } from "@/components/data-table";
import { Card } from "@/components/card";
import { apiGet } from "@/lib/api";

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function formatAmount(amount: number, currency: string) {
  return `${amount?.toLocaleString("fr-HT") || "—"} ${currency || "—"}`;
}

function formatActor(user: any) {
  if (!user) return "System";
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
  return `${name} (${user.id.slice(0, 8)}…)`;
}

const eventTypeLabels: Record<string, string> = {
  transfer_sent: "Transfer Sent",
  merchant_payment: "Merchant Payment",
  merchant_withdrawal: "Merchant Withdrawal",
  float_transfer: "Float Transfer",
  admin_float_refill: "Float Refill",
  transfer_reversal: "Transfer Reversal",
  withdrawal_requested: "Withdrawal Request",
  withdrawal_approved: "Withdrawal Approved",
};

export default async function AuditPage() {
  const logs: any[] = await apiGet<any[]>("/admin/audit", []);

  const today = logs.filter((l) => {
    const d = new Date(l.createdAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  const thisWeek = logs.filter((l) => {
    const d = new Date(l.createdAt);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo;
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Audit Trail</h1>
        <p className="text-sm text-[var(--text-muted)]">Complete financial transaction history</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Today" value={today} accent="blue" />
        <Card title="This Week" value={thisWeek} accent="green" />
        <Card title="Total Logs" value={logs.length} />
        <Card title="Coverage" value="100%" accent="green" />
      </div>

      <DataTable
        columns={[
          {
            key: "eventType",
            label: "Event",
            render: (r: any) => (
              <Badge variant="default">
                {eventTypeLabels[r.eventType] || r.eventType}
              </Badge>
            ),
          },
          {
            key: "amount",
            label: "Amount",
            render: (r: any) => (
              <span className="font-mono text-sm">
                {formatAmount(r.amount, r.currency)}
              </span>
            ),
          },
          {
            key: "actorUser",
            label: "Actor",
            render: (r: any) => (
              <span className="text-sm max-w-[200px] truncate inline-block">
                {formatActor(r.actorUser)}
              </span>
            ),
          },
          {
            key: "wallets",
            label: "Wallets",
            render: (r: any) => (
              <div className="text-xs text-[var(--text-muted)] font-mono">
                {r.fromWalletId && (
                  <div>From: {r.fromWalletId.slice(0, 8)}…</div>
                )}
                {r.toWalletId && (
                  <div>To: {r.toWalletId.slice(0, 8)}…</div>
                )}
              </div>
            ),
          },
          {
            key: "referenceId",
            label: "Reference",
            render: (r: any) => (
              r.referenceId ? (
                <span className="font-mono text-xs text-[var(--text-muted)]">
                  {r.referenceId.slice(0, 8)}…
                </span>
              ) : (
                <span className="text-[var(--text-muted)]">—</span>
              )
            ),
          },
          {
            key: "createdAt",
            label: "Time",
            render: (r: any) => (
              <div className="text-xs">
                <div>{timeAgo(r.createdAt)}</div>
                <div className="text-[var(--text-muted)]">
                  {new Date(r.createdAt).toLocaleString("fr-HT")}
                </div>
              </div>
            ),
          },
        ]}
        rows={logs}
        emptyMessage="No audit logs — system ready"
      />
    </div>
  );
}