"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Building,
  DollarSign,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

type Props = {
  profile: { id: string; firstName?: string; handle?: string; kycTier: number };
};

type AgentDashboard = {
  distributorId: string;
  businessName: string;
  status: string;
  floatBalance: number;
  totalFloat: number;
  todayTransactions: number;
  todayCommissions: number;
  commissionRate: number;
  settlements: {
    id: string;
    amount: number;
    currency: string;
    type: string;
    createdAt: string;
  }[];
};

export function DistributorDashboard({ profile }: Props) {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<AgentDashboard | null>(null);
  const [notifCount, setNotifCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, notifs] = await Promise.all([
        apiGet<AgentDashboard>("v1/distributor/dashboard"),
        apiGet<{ unread: number }>("notifications/count").catch(() => ({
          unread: 0,
        })),
      ]);
      setDashboard(dash);
      setNotifCount(notifs.unread);
    } catch (e) {
      console.error("Failed to load agent dashboard:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const lowFloat = dashboard && dashboard.floatBalance < 5000;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Building className="h-3 w-3" /> KobKlein K-Agent
          </div>
          <div className="text-xl font-semibold">
            {dashboard?.businessName || profile.firstName || "Agent"}
          </div>
          {dashboard?.status && (
            <div
              className={`text-xs font-medium ${dashboard.status === "active" ? "text-success" : "text-warning"}`}
            >
              {dashboard.status === "active" ? "Active" : "Pending"}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={load}>
            <RefreshCw
              className={`h-4 w-4 text-muted-foreground ${loading ? "animate-spin" : ""}`}
            />
          </button>
          <button type="button" className="relative" onClick={() => router.push("/notifications")}>
            <Bell className="h-5 w-5 text-muted-foreground" />
            {notifCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] px-1 rounded-full">
                {notifCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Float Balance (prominent) */}
      <Card className="rounded-3xl">
        <CardContent className="p-6 text-center space-y-1">
          <div className="text-xs text-muted-foreground">Float Balance</div>
          <div className="text-4xl font-bold">
            {dashboard
              ? dashboard.floatBalance.toLocaleString("fr-HT", {
                  minimumFractionDigits: 2,
                })
              : "-"}{" "}
            HTG
          </div>
        </CardContent>
      </Card>

      {/* Low Float Warning */}
      {lowFloat && (
        <Card className="rounded-2xl border-warning/30 bg-warning/5">
          <CardContent className="p-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
            <div className="text-sm">
              <span className="font-semibold">Low Float!</span>{" "}
              <span className="text-muted-foreground">
                Contact admin to refill your float balance.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="rounded-2xl">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold">
              {dashboard?.todayTransactions ?? "-"}
            </div>
            <div className="text-[10px] text-muted-foreground">
              Today Txns
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-success">
              {dashboard
                ? dashboard.todayCommissions.toLocaleString()
                : "-"}
            </div>
            <div className="text-[10px] text-muted-foreground">
              Commissions
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold">
              {dashboard ? `${dashboard.commissionRate}%` : "-"}
            </div>
            <div className="text-[10px] text-muted-foreground">Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => router.push("/distributor/cash-in")}
          className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:bg-secondary transition"
        >
          <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
            <ArrowDownLeft className="h-6 w-6 text-success" />
          </div>
          <span className="text-sm font-semibold">Cash-In</span>
          <span className="text-[10px] text-muted-foreground text-center">
            Customer gives cash
          </span>
        </button>
        <button
          type="button"
          onClick={() => router.push("/distributor/cash-out")}
          className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:bg-secondary transition"
        >
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <ArrowUpRight className="h-6 w-6 text-destructive" />
          </div>
          <span className="text-sm font-semibold">Cash-Out</span>
          <span className="text-[10px] text-muted-foreground text-center">
            Customer takes cash
          </span>
        </button>
      </div>

      {/* Recent Settlements */}
      {dashboard && dashboard.settlements.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Recent Operations
          </h2>
          <div className="space-y-2">
            {dashboard.settlements.slice(0, 10).map((s) => (
              <Card key={s.id} className="rounded-xl">
                <CardContent className="p-3 flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      s.type === "cash_in"
                        ? "bg-success/10"
                        : "bg-destructive/10"
                    }`}
                  >
                    {s.type === "cash_in" ? (
                      <ArrowDownLeft className="h-4 w-4 text-success" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {s.type === "cash_in" ? "Cash-In" : "Cash-Out"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(s.createdAt).toLocaleString("fr-HT", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "numeric",
                        month: "short",
                      })}
                    </div>
                  </div>
                  <div className="text-sm font-semibold tabular-nums">
                    {Number(s.amount).toLocaleString()} {s.currency}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="space-y-2">
        <a
          href="/distributor/transfer"
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:bg-secondary transition-colors"
        >
          <TrendingUp className="h-5 w-5 text-muted-foreground shrink-0" />
          <div className="flex-1">
            <div className="font-medium text-sm">Float Transfer</div>
            <div className="text-xs text-muted-foreground">
              Transfer float to another agent
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </a>
        <a
          href="/wallet"
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:bg-secondary transition-colors"
        >
          <DollarSign className="h-5 w-5 text-muted-foreground shrink-0" />
          <div className="flex-1">
            <div className="font-medium text-sm">Full History</div>
            <div className="text-xs text-muted-foreground">
              All transactions and ledger entries
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </a>
      </div>
    </div>
  );
}
