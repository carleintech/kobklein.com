import { Card as KpiCard } from "@/components/card";
import { Card as ShadcnCard, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { apiGet } from "@/lib/api";
import { DollarSign, TrendingUp, Wallet, PieChart } from "lucide-react";

function fmt(n: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(n);
}

const revenueLabels: Record<string, string> = {
  merchant_fee: "Merchant Fees",
  fx_profit: "FX Spread",
  cash_out_fee: "Cash-Out Fees",
  commission: "Agent Commissions",
  subscription_revenue: "Subscription Revenue",
  float_fee: "Float Fees",
};

export default async function TreasuryPage() {
  const [balances, revenue] = await Promise.all([
    apiGet<any>("/v1/admin/treasury", null),
    apiGet<any>("/v1/admin/treasury/revenue?days=30", null),
  ]);

  const wallets = balances?.wallets || [];
  const breakdown = revenue?.breakdown || {};
  const totalRevenue = revenue?.totalRevenue || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Treasury</h1>
        <p className="text-sm text-muted-foreground">Platform wallet balances and revenue</p>
      </div>

      {/* Wallet Balances */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {wallets.map((w: any) => (
          <KpiCard
            key={w.walletId}
            title={`${w.currency} Treasury`}
            value={fmt(w.balance, w.currency)}
            icon={<Wallet size={16} />}
            accent={w.balance > 0 ? "gold" : "default"}
          />
        ))}
        {wallets.length === 0 && (
          <KpiCard title="No Treasury Wallets" value="—" icon={<Wallet size={16} />} />
        )}
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Revenue (30d)"
          value={fmt(totalRevenue)}
          accent="green"
          icon={<TrendingUp size={16} />}
        />
        <KpiCard
          title="Period"
          value={`${revenue?.periodDays || 30} days`}
          icon={<PieChart size={16} />}
        />
      </div>

      {/* Revenue Breakdown */}
      <ShadcnCard className="rounded-2xl">
        <CardContent className="p-5">
          <h2 className="font-medium mb-4">Revenue Breakdown (Last {revenue?.periodDays || 30} Days)</h2>
          <DataTable
            columns={[
              {
                key: "type",
                label: "Revenue Source",
                render: (r: any) => (
                  <span className="font-medium">
                    {revenueLabels[r.type] || r.type}
                  </span>
                ),
              },
              {
                key: "amount",
                label: "Amount (USD)",
                render: (r: any) => (
                  <span className="font-mono tabular-nums text-emerald-400">
                    {fmt(r.amount)}
                  </span>
                ),
              },
              {
                key: "pct",
                label: "% of Total",
                render: (r: any) => (
                  <span className="text-muted-foreground">
                    {totalRevenue > 0 ? ((r.amount / totalRevenue) * 100).toFixed(1) : "0"}%
                  </span>
                ),
              },
            ]}
            rows={Object.entries(breakdown).map(([type, amount]) => ({
              type,
              amount: amount as number,
            })).sort((a, b) => b.amount - a.amount)}
            emptyMessage="No revenue data for this period"
          />
        </CardContent>
      </ShadcnCard>
    </div>
  );
}
