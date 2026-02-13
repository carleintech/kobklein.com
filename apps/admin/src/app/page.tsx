import { Card as ShadcnCard, CardContent } from "@/components/ui/card";
import { Card as KpiCard } from "@/components/card";
import { Badge } from "@/components/badge";
import { DataTable } from "@/components/data-table";
import { apiGet } from "@/lib/api";
import {
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  UserCheck,
  Clock,
  AlertTriangle,
  FileText,
} from "lucide-react";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "HTG", minimumFractionDigits: 0 }).format(n);
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default async function OverviewPage() {
  const [overview, activity] = await Promise.all([
    apiGet<any>("/admin/overview", null),
    apiGet<any>("/admin/recent-activity", null),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Command Center</h1>
        <p className="text-sm text-muted-foreground">Real-time platform overview</p>
      </div>

      {/* KPI Cards */}
      {overview ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Platform Balance"
            value={fmt(overview.platformBalance)}
            sub="Total liability"
            icon={<DollarSign size={16} />}
          />
          <KpiCard
            title="Today Volume"
            value={fmt(overview.todayVolume)}
            sub={`In: ${fmt(overview.todayCashIn)} · Out: ${fmt(overview.todayCashOut)}`}
            icon={<ArrowUpRight size={16} />}
          />
          <KpiCard
            title="Active Users"
            value={overview.activeUsers}
            sub="Last 30 days"
            icon={<Users size={16} />}
          />
          <KpiCard
            title="Active Agents"
            value={overview.activeAgents}
            icon={<UserCheck size={16} />}
          />
          <KpiCard
            title="Pending Withdrawals"
            value={overview.pendingWithdrawals}
            accent={overview.pendingWithdrawals > 10 ? "yellow" : "default"}
            icon={<Clock size={16} />}
          />
          <KpiCard
            title="Open Cases"
            value={overview.openCases}
            accent={overview.openCases > 0 ? "red" : "green"}
            icon={<FileText size={16} />}
          />
          <KpiCard
            title="Stuck Events"
            value={overview.stuckEvents}
            accent={overview.stuckEvents > 0 ? "red" : "green"}
            icon={<AlertTriangle size={16} />}
          />
          <KpiCard
            title="Cash In vs Out"
            value={
              overview.todayCashOut > 0
                ? `${((overview.todayCashIn / overview.todayCashOut) * 100).toFixed(0)}%`
                : "—"
            }
            sub="Today ratio"
            icon={<ArrowDownLeft size={16} />}
          />
        </div>
      ) : (
        <ShadcnCard className="rounded-2xl">
          <CardContent className="p-8 text-center text-muted-foreground">
            Unable to fetch overview data. Make sure the API is running.
          </CardContent>
        </ShadcnCard>
      )}

      {/* Recent Activity */}
      {activity && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Recent Transfers */}
          <ShadcnCard className="rounded-2xl">
           <CardContent className="p-5">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Recent Transfers</h2>
            <DataTable
              columns={[
                { key: "amount", label: "Amount", render: (r: any) => fmt(r.amount) },
                { key: "currency", label: "Cur" },
                {
                  key: "status",
                  label: "Status",
                  render: (r: any) => (
                    <Badge variant={r.status === "posted" ? "green" : r.status === "reversed" ? "red" : "default"}>
                      {r.status}
                    </Badge>
                  ),
                },
                { key: "createdAt", label: "Age", render: (r: any) => timeAgo(r.createdAt) },
              ]}
              rows={activity.recentTransfers?.slice(0, 8) ?? []}
              emptyMessage="No transfers yet"
            />
           </CardContent>
          </ShadcnCard>

          {/* Recent Deposits */}
          <ShadcnCard className="rounded-2xl">
           <CardContent className="p-5">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Recent Deposits</h2>
            <DataTable
              columns={[
                { key: "amount", label: "Amount", render: (r: any) => fmt(r.amount) },
                { key: "currency", label: "Cur" },
                { key: "source", label: "Source" },
                { key: "createdAt", label: "Age", render: (r: any) => timeAgo(r.createdAt) },
              ]}
              rows={activity.recentDeposits?.slice(0, 8) ?? []}
              emptyMessage="No deposits yet"
            />
           </CardContent>
          </ShadcnCard>

          {/* Recent Withdrawals */}
          <ShadcnCard className="rounded-2xl">
           <CardContent className="p-5">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Recent Withdrawals</h2>
            <DataTable
              columns={[
                { key: "amount", label: "Amount", render: (r: any) => fmt(Number(r.amount)) },
                { key: "currency", label: "Cur" },
                { key: "code", label: "Code" },
                {
                  key: "status",
                  label: "Status",
                  render: (r: any) => (
                    <Badge
                      variant={
                        r.status === "completed" ? "green"
                        : r.status === "pending" ? "yellow"
                        : r.status === "reversed" ? "red"
                        : "default"
                      }
                    >
                      {r.status}
                    </Badge>
                  ),
                },
                { key: "createdAt", label: "Age", render: (r: any) => timeAgo(r.createdAt) },
              ]}
              rows={activity.recentWithdrawals?.slice(0, 8) ?? []}
              emptyMessage="No withdrawals yet"
            />
           </CardContent>
          </ShadcnCard>
        </div>
      )}
    </div>
  );
}
