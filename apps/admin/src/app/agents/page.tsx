"use client";

import { useEffect, useState, useCallback } from "react";
import { kkGet } from "@/lib/kobklein-api";
import { Card, CardContent } from "@kobklein/ui/card";
import { Badge } from "@kobklein/ui/badge";
import { Button } from "@kobklein/ui/button";
import {
  Users,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Clock,
  Zap,
  TrendingDown,
} from "lucide-react";

type Agent = {
  distributorId: string;
  name: string;
  city: string;
  floatBalance: number;
  threshold: number;
  todayVolume: number;
  todayCashoutCount: number;
  lastCashout: string | null;
  status: "green" | "warning" | "critical";
  riskSignals: string[];
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "HTG",
    minimumFractionDigits: 0,
  }).format(n);
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const signalLabels: Record<string, { label: string; variant: "destructive" | "warning" | "secondary" }> = {
  ZERO_BALANCE: { label: "Zero Balance", variant: "destructive" },
  BELOW_THRESHOLD: { label: "Below Threshold", variant: "destructive" },
  APPROACHING_THRESHOLD: { label: "Approaching Threshold", variant: "warning" },
  HIGH_VELOCITY: { label: "High Velocity", variant: "warning" },
  NEVER_CASHED_OUT: { label: "Never Cashed Out", variant: "secondary" },
  INACTIVE_24H: { label: "Inactive 24h+", variant: "secondary" },
};

export default function AgentsPage() {
  const [rows, setRows] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await kkGet<Agent[]>("admin/liquidity/agents");
      setRows(data);
      setLastRefresh(new Date());
    } catch (e) {
      console.error("Failed to load agents:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  const critical = rows.filter((a) => a.status === "critical");
  const warning = rows.filter((a) => a.status === "warning");
  const healthy = rows.filter((a) => a.status === "green");
  const totalFloat = rows.reduce((sum, a) => sum + a.floatBalance, 0);
  const totalVolume = rows.reduce((sum, a) => sum + a.todayVolume, 0);

  function statusBadge(s: string) {
    if (s === "critical") return <Badge variant="destructive">CRITICAL</Badge>;
    if (s === "warning") return <Badge variant="warning">WARNING</Badge>;
    return <Badge variant="success">HEALTHY</Badge>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Agent Liquidity Monitor</h1>
          <p className="text-sm text-muted-foreground">
            Real-time distributor float health
            {lastRefresh && (
              <span className="ml-2 text-xs opacity-60">
                Updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Agents</span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-semibold tabular-nums mt-1">{rows.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Healthy</span>
              <CheckCircle className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-semibold tabular-nums mt-1 text-emerald-400">{healthy.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Warning</span>
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
            </div>
            <div className="text-2xl font-semibold tabular-nums mt-1 text-yellow-400">{warning.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Critical</span>
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </div>
            <div className="text-2xl font-semibold tabular-nums mt-1 text-red-400">{critical.length}</div>
            {critical.length > 0 && <div className="text-xs text-red-400 mt-0.5">Needs attention now</div>}
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Network Float</span>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-semibold tabular-nums mt-1">{fmt(totalFloat)}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Today out: {fmt(totalVolume)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {critical.length > 0 && (
        <Card className="rounded-2xl border-red-500/30 bg-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="font-medium text-red-400">Critical Float Alerts</span>
            </div>
            <div className="space-y-2">
              {critical.map((a) => (
                <div key={a.distributorId} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{a.name}</span>
                    <span className="text-muted-foreground ml-2">({a.city})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-red-400">{fmt(a.floatBalance)}</span>
                    <span className="text-xs text-muted-foreground">threshold: {fmt(a.threshold)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agent Table */}
      <Card className="rounded-2xl">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="font-medium">All Agents</span>
            <span className="text-xs text-muted-foreground">Auto-refresh: 10s</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3 font-medium text-xs uppercase tracking-wider w-3" />
                  <th className="py-2 pr-4 font-medium text-xs uppercase tracking-wider">Agent</th>
                  <th className="py-2 pr-4 font-medium text-xs uppercase tracking-wider">City</th>
                  <th className="py-2 pr-4 font-medium text-xs uppercase tracking-wider">Float Balance</th>
                  <th className="py-2 pr-4 font-medium text-xs uppercase tracking-wider">Threshold</th>
                  <th className="py-2 pr-4 font-medium text-xs uppercase tracking-wider">Today Volume</th>
                  <th className="py-2 pr-4 font-medium text-xs uppercase tracking-wider">Last Cash-out</th>
                  <th className="py-2 pr-4 font-medium text-xs uppercase tracking-wider">Status</th>
                  <th className="py-2 font-medium text-xs uppercase tracking-wider">Risk Signals</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-muted-foreground">
                      {loading ? "Loading agents..." : "No active agents registered"}
                    </td>
                  </tr>
                )}
                {rows.map((a) => (
                  <tr key={a.distributorId} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="py-3 pr-3">
                      <span
                        className={`inline-block w-2.5 h-2.5 rounded-full ${
                          a.status === "critical"
                            ? "bg-red-500 animate-pulse"
                            : a.status === "warning"
                              ? "bg-yellow-500"
                              : "bg-emerald-500"
                        }`}
                      />
                    </td>
                    <td className="py-3 pr-4 font-medium">{a.name}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{a.city}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`font-mono font-medium ${
                          a.status === "critical"
                            ? "text-red-400"
                            : a.status === "warning"
                              ? "text-yellow-400"
                              : "text-emerald-400"
                        }`}
                      >
                        {fmt(a.floatBalance)}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-mono text-muted-foreground">{fmt(a.threshold)}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-mono">{fmt(a.todayVolume)}</span>
                        <span className="text-xs text-muted-foreground">({a.todayCashoutCount}tx)</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      {a.lastCashout ? (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{timeAgo(a.lastCashout)}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">{statusBadge(a.status)}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {a.riskSignals.length === 0 ? (
                          <span className="text-xs text-muted-foreground">None</span>
                        ) : (
                          a.riskSignals.map((sig) => {
                            const info = signalLabels[sig] ?? { label: sig, variant: "secondary" as const };
                            return (
                              <Badge key={sig} variant={info.variant} className="text-[10px] px-1.5 py-0">
                                {info.label}
                              </Badge>
                            );
                          })
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
