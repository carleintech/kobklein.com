import { Card as KpiCard } from "@/components/card";
import { Card as ShadcnCard, CardContent } from "@/components/ui/card";
import { apiGet } from "@/lib/api";
import { DollarSign, Receipt, TrendingUp, Percent } from "lucide-react";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

export default async function PosPage() {
  const data = await apiGet<any>("/v1/admin/pos/analytics?days=30", null);

  const gross = data?.totalGross ?? 0;
  const fee = data?.totalFee ?? 0;
  const net = data?.totalNet ?? 0;
  const count = data?.transactionCount ?? 0;
  const avgTx = count > 0 ? gross / count : 0;
  const feeRate = gross > 0 ? (fee / gross) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">POS Analytics</h1>
        <p className="text-sm text-muted-foreground">Merchant payment volume and fee collection (last 30 days)</p>
      </div>

      {data ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Gross Volume"
              value={fmt(gross)}
              icon={<DollarSign size={16} />}
              accent="gold"
            />
            <KpiCard
              title="Fees Collected"
              value={fmt(fee)}
              icon={<Percent size={16} />}
              accent="green"
            />
            <KpiCard
              title="Net to Merchants"
              value={fmt(net)}
              icon={<TrendingUp size={16} />}
            />
            <KpiCard
              title="Transactions"
              value={count.toLocaleString()}
              icon={<Receipt size={16} />}
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Avg Transaction"
              value={fmt(avgTx)}
              sub="Per payment"
            />
            <KpiCard
              title="Effective Fee Rate"
              value={`${feeRate.toFixed(2)}%`}
              sub="Weighted average"
            />
          </div>
        </>
      ) : (
        <ShadcnCard className="rounded-2xl">
          <CardContent className="p-8 text-center text-muted-foreground">
            Unable to fetch POS analytics. Make sure the API is running.
          </CardContent>
        </ShadcnCard>
      )}
    </div>
  );
}
