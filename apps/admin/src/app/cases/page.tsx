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

const caseTypeLabels: Record<string, string> = {
  wrong_recipient: "Wrong Recipient",
  unauthorized: "Unauthorized",
  merchant_dispute: "Merchant Dispute",
};

const priorityVariant: Record<string, "red" | "yellow" | "blue" | "default"> = {
  critical: "red",
  high: "red",
  normal: "default",
  low: "blue",
};

const statusVariant: Record<string, "green" | "yellow" | "red" | "blue" | "default"> = {
  open: "yellow",
  investigating: "blue",
  pending_user: "yellow",
  pending_admin: "yellow",
  resolved: "green",
  rejected: "default",
};

export default async function CasesPage() {
  const cases: any[] = await apiGet<any[]>("/admin/cases", []);

  const open = cases.filter((c) => c.status === "open").length;
  const investigating = cases.filter((c) => c.status === "investigating").length;
  const resolved = cases.filter((c) => c.status === "resolved").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Case Management</h1>
        <p className="text-sm text-[var(--text-muted)]">Disputes, chargebacks & investigations</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Open" value={open} accent={open > 0 ? "yellow" : "green"} />
        <Card title="Investigating" value={investigating} accent={investigating > 0 ? "yellow" : "default"} />
        <Card title="Resolved" value={resolved} accent="green" />
        <Card title="Total" value={cases.length} />
      </div>

      <DataTable
        columns={[
          {
            key: "priority",
            label: "Priority",
            render: (r: any) => <Badge variant={priorityVariant[r.priority] ?? "default"}>{r.priority}</Badge>,
          },
          {
            key: "caseType",
            label: "Type",
            render: (r: any) => caseTypeLabels[r.caseType] || r.caseType,
          },
          {
            key: "status",
            label: "Status",
            render: (r: any) => <Badge variant={statusVariant[r.status] ?? "default"}>{r.status}</Badge>,
          },
          {
            key: "description",
            label: "Description",
            render: (r: any) => (
              <span className="text-xs max-w-[350px] truncate inline-block">{r.description}</span>
            ),
          },
          {
            key: "reporterUserId",
            label: "Reporter",
            render: (r: any) =>
              r.reporterUserId ? <span className="font-mono text-xs text-[var(--text-muted)]">{r.reporterUserId.slice(0, 8)}…</span> : "—",
          },
          { key: "createdAt", label: "Created", render: (r: any) => timeAgo(r.createdAt) },
          {
            key: "actions",
            label: "",
            render: (r: any) => (
              <a href={`/cases/${r.id}`} className="text-xs text-blue-600 hover:underline">
                View
              </a>
            ),
          },
        ]}
        rows={cases}
        emptyMessage="No cases — all clear"
      />
    </div>
  );
}
