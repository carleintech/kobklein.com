"use client";

import { useEffect, useState, useCallback } from "react";
import { kkGet } from "@/lib/kobklein-api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert,
  Zap,
  RotateCcw,
  FileText,
  AlertTriangle,
  RefreshCw,
  Ban,
  Flag,
} from "lucide-react";

type RiskSignals = {
  velocityAlerts: number;
  reversalsLast10Min: number;
  reversalsToday: number;
  openCases: number;
  failedWebhooks: number;
  highSeverityFlagsLastHour: number;
  blockedUsers: number;
  unresolvedFlags: number;
};

type RiskFlag = {
  id: string;
  userId: string;
  type: string;
  severity: number;
  details: string | null;
  resolvedAt: string | null;
  createdAt: string;
  phone?: string;
  email?: string;
};

const severityConfig: Record<number, { label: string; variant: "destructive" | "warning" | "secondary" | "outline" }> = {
  4: { label: "Critical", variant: "destructive" },
  3: { label: "High", variant: "destructive" },
  2: { label: "Medium", variant: "warning" },
  1: { label: "Low", variant: "secondary" },
};

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function RiskPage() {
  const [signals, setSignals] = useState<RiskSignals | null>(null);
  const [flags, setFlags] = useState<RiskFlag[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sig, flg] = await Promise.all([
        kkGet<RiskSignals>("admin/risk/signals"),
        kkGet<RiskFlag[]>("admin/risk/recent-flags"),
      ]);
      setSignals(sig);
      setFlags(flg);
      setLastRefresh(new Date());
    } catch (e) {
      console.error("Failed to load risk data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  // Overall threat level
  function threatLevel(): { label: string; color: string } {
    if (!signals) return { label: "Loading...", color: "text-muted-foreground" };
    const s = signals;
    if (s.velocityAlerts > 3 || s.highSeverityFlagsLastHour > 2 || s.blockedUsers > 5) {
      return { label: "ELEVATED", color: "text-red-400" };
    }
    if (s.velocityAlerts > 0 || s.highSeverityFlagsLastHour > 0 || s.unresolvedFlags > 10) {
      return { label: "GUARDED", color: "text-yellow-400" };
    }
    return { label: "NORMAL", color: "text-emerald-400" };
  }

  const threat = threatLevel();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Risk Command Center</h1>
          <p className="text-sm text-muted-foreground">
            Fraud signals, velocity alerts &amp; step-up controls
            {lastRefresh && (
              <span className="ml-2 text-xs opacity-60">
                Updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card">
            <ShieldAlert className={`h-4 w-4 ${threat.color}`} />
            <span className={`text-sm font-semibold ${threat.color}`}>{threat.label}</span>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Signal KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Velocity Alerts</span>
              <Zap className="h-4 w-4 text-yellow-400" />
            </div>
            <div className="text-2xl font-semibold tabular-nums mt-1">
              {signals?.velocityAlerts ?? "—"}
            </div>
            <div className="text-xs text-muted-foreground">Last 10 min</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reversals</span>
              <RotateCcw className="h-4 w-4 text-orange-400" />
            </div>
            <div className="text-2xl font-semibold tabular-nums mt-1">
              {signals?.reversalsLast10Min ?? "—"}
            </div>
            <div className="text-xs text-muted-foreground">
              10 min · Today: {signals?.reversalsToday ?? "—"}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Open Cases</span>
              <FileText className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-2xl font-semibold tabular-nums mt-1">
              {signals?.openCases ?? "—"}
            </div>
            <div className="text-xs text-muted-foreground">Active investigations</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Blocked Users</span>
              <Ban className="h-4 w-4 text-red-400" />
            </div>
            <div className="text-2xl font-semibold tabular-nums mt-1">
              {signals?.blockedUsers ?? "—"}
            </div>
            <div className="text-xs text-muted-foreground">Unresolved high-severity</div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary signals row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">High Severity (1h)</span>
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </div>
            <div className={`text-2xl font-semibold tabular-nums mt-1 ${(signals?.highSeverityFlagsLastHour ?? 0) > 0 ? "text-red-400" : ""}`}>
              {signals?.highSeverityFlagsLastHour ?? "—"}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Unresolved Flags</span>
              <Flag className="h-4 w-4 text-yellow-400" />
            </div>
            <div className={`text-2xl font-semibold tabular-nums mt-1 ${(signals?.unresolvedFlags ?? 0) > 10 ? "text-yellow-400" : ""}`}>
              {signals?.unresolvedFlags ?? "—"}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Failed Webhooks</span>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className={`text-2xl font-semibold tabular-nums mt-1 ${(signals?.failedWebhooks ?? 0) > 0 ? "text-orange-400" : ""}`}>
              {signals?.failedWebhooks ?? "—"}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Refresh</div>
            <div className="text-xs text-muted-foreground">Auto: every 5s</div>
            <div className="text-xs text-muted-foreground mt-1">
              Risk model: <span className="text-foreground font-medium">Balanced</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Risk Flags Table */}
      <Card className="rounded-2xl">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="font-medium">Active Risk Flags</span>
            <Badge variant="warning" className="ml-1">{flags.length}</Badge>
            <span className="ml-auto text-xs text-muted-foreground">Unresolved, sorted by severity</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-4 font-medium text-xs uppercase tracking-wider">Severity</th>
                  <th className="py-2 pr-4 font-medium text-xs uppercase tracking-wider">Type</th>
                  <th className="py-2 pr-4 font-medium text-xs uppercase tracking-wider">User</th>
                  <th className="py-2 pr-4 font-medium text-xs uppercase tracking-wider">Details</th>
                  <th className="py-2 font-medium text-xs uppercase tracking-wider">When</th>
                </tr>
              </thead>
              <tbody>
                {flags.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      <ShieldAlert className="h-5 w-5 mx-auto mb-2 text-emerald-400" />
                      No unresolved risk flags — system healthy
                    </td>
                  </tr>
                )}
                {flags.map((f) => {
                  const sev = severityConfig[f.severity] ?? { label: `${f.severity}`, variant: "outline" as const };
                  let details = "—";
                  if (f.details) {
                    try {
                      const d = typeof f.details === "string" ? JSON.parse(f.details) : f.details;
                      details = JSON.stringify(d);
                    } catch {
                      details = String(f.details);
                    }
                  }
                  return (
                    <tr key={f.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="py-3 pr-4">
                        <Badge variant={sev.variant}>{sev.label}</Badge>
                      </td>
                      <td className="py-3 pr-4 font-medium">{f.type}</td>
                      <td className="py-3 pr-4">
                        <div className="font-mono text-xs">{f.userId?.slice(0, 8)}…</div>
                        {f.phone && <div className="text-xs text-muted-foreground">{f.phone}</div>}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-xs text-muted-foreground max-w-[300px] truncate inline-block">
                          {details}
                        </span>
                      </td>
                      <td className="py-3 text-muted-foreground">{timeAgo(f.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
