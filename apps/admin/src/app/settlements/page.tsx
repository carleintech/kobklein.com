import { Card } from "@/components/card";
import { DataTable } from "@/components/data-table";
import { apiGet } from "@/lib/api";

function fmtMoney(v: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "HTG",
    minimumFractionDigits: 2,
  }).format(v / 100);
}

export default async function SettlementsPage() {
  const settlements: any[] = await apiGet<any[]>("/admin/reports/distributor-cashouts", []);

  const totalEarnings = settlements.reduce((s, r) => s + Number(r.totalCommission || 0), 0);
  const totalCashouts = settlements.reduce((s, r) => s + Number(r.totalCashouts || 0), 0);
  const totalPlatformFees = settlements.reduce((s, r) => s + Number(r.totalFees || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Settlements</h1>
        <p className="text-sm text-[var(--text-muted)]">Agent earnings, cash-out totals & platform revenue</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Total Cash-outs" value={fmtMoney(totalCashouts)} />
        <Card title="Agent Commissions" value={fmtMoney(totalEarnings)} accent="green" />
        <Card title="Platform Fees" value={fmtMoney(totalPlatformFees)} accent="blue" />
        <Card title="Distributors" value={settlements.length} />
      </div>

      <DataTable
        columns={[
          {
            key: "distributorId",
            label: "Distributor",
            render: (r: any) => (
              <span className="font-mono text-xs">{(r.distributorId || r.id || "—").slice(0, 12)}…</span>
            ),
          },
          {
            key: "businessName",
            label: "Business",
            render: (r: any) => r.businessName || r.name || "—",
          },
          {
            key: "totalCashouts",
            label: "Total Cash-outs",
            render: (r: any) => fmtMoney(Number(r.totalCashouts || 0)),
          },
          {
            key: "totalCommission",
            label: "Commission",
            render: (r: any) => (
              <span className="text-green-400">{fmtMoney(Number(r.totalCommission || 0))}</span>
            ),
          },
          {
            key: "totalFees",
            label: "Platform Fees",
            render: (r: any) => fmtMoney(Number(r.totalFees || 0)),
          },
          {
            key: "count",
            label: "Transactions",
            render: (r: any) => r.count ?? r.totalCount ?? "—",
          },
        ]}
        rows={settlements}
        emptyMessage="No settlement records yet"
      />
    </div>
  );
}
