"use client";

import { useEffect, useState, useCallback } from "react";
import { kkGet, kkPost } from "@/lib/kobklein-api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  RotateCcw,
  Send,
} from "lucide-react";

type Stats = {
  total: number;
  sent: number;
  failed: number;
  queued: number;
  todaySent: number;
  todayFailed: number;
};

type NotifLog = {
  id: string;
  channel: string;
  type: string;
  to: string;
  body: string;
  status: string;
  error: string | null;
  jobId: string | null;
  userId: string | null;
  attempts: number;
  sentAt: string | null;
  createdAt: string;
  firstName?: string;
  email?: string;
};

const statusConfig: Record<string, { label: string; variant: "success" | "destructive" | "warning" | "secondary" }> = {
  sent: { label: "Sent", variant: "success" },
  failed: { label: "Failed", variant: "destructive" },
  queued: { label: "Queued", variant: "warning" },
};

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

type FilterStatus = "all" | "sent" | "failed" | "queued";

export default function NotificationsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<NotifLog[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, l] = await Promise.all([
        kkGet<Stats>("admin/notifications/stats"),
        kkGet<{ rows: NotifLog[]; total: number }>(`admin/notifications/logs?status=${filter}&limit=50`),
      ]);
      setStats(s);
      setLogs(l.rows);
      setTotal(l.total);
      setLastRefresh(new Date());
    } catch (e) {
      console.error("Failed to load notifications:", e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  async function handleRetry(id: string) {
    setRetrying(id);
    try {
      await kkPost(`admin/notifications/${id}/retry`, {});
      await load();
    } catch (e) {
      console.error("Retry failed:", e);
    } finally {
      setRetrying(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Notification Delivery</h1>
          <p className="text-sm text-muted-foreground">
            SMS delivery logs, status tracking &amp; retries
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

      {/* Stats KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Sent</span>
              <CheckCircle className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-semibold tabular-nums mt-1">{stats?.sent ?? "—"}</div>
            <div className="text-xs text-muted-foreground">Today: {stats?.todaySent ?? 0}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Failed</span>
              <XCircle className="h-4 w-4 text-red-400" />
            </div>
            <div className={`text-2xl font-semibold tabular-nums mt-1 ${(stats?.failed ?? 0) > 0 ? "text-red-400" : ""}`}>
              {stats?.failed ?? "—"}
            </div>
            <div className="text-xs text-muted-foreground">Today: {stats?.todayFailed ?? 0}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Queued</span>
              <Clock className="h-4 w-4 text-yellow-400" />
            </div>
            <div className={`text-2xl font-semibold tabular-nums mt-1 ${(stats?.queued ?? 0) > 5 ? "text-yellow-400" : ""}`}>
              {stats?.queued ?? "—"}
            </div>
            <div className="text-xs text-muted-foreground">Awaiting delivery</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">All-Time</span>
              <MessageSquare className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-2xl font-semibold tabular-nums mt-1">{stats?.total ?? "—"}</div>
            <div className="text-xs text-muted-foreground">Total notifications</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "sent", "failed", "queued"] as FilterStatus[]).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f} {f !== "all" && stats ? `(${stats[f as keyof Stats] ?? 0})` : ""}
          </Button>
        ))}
      </div>

      {/* Delivery Log Table */}
      <Card className="rounded-2xl">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="font-medium">Delivery Log</span>
            <Badge variant="secondary" className="ml-1">{total}</Badge>
            <span className="ml-auto text-xs text-muted-foreground">Auto-refresh: 10s</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3 font-medium text-xs uppercase tracking-wider">Status</th>
                  <th className="py-2 pr-3 font-medium text-xs uppercase tracking-wider">Channel</th>
                  <th className="py-2 pr-3 font-medium text-xs uppercase tracking-wider">Type</th>
                  <th className="py-2 pr-3 font-medium text-xs uppercase tracking-wider">To</th>
                  <th className="py-2 pr-3 font-medium text-xs uppercase tracking-wider">Message</th>
                  <th className="py-2 pr-3 font-medium text-xs uppercase tracking-wider">Attempts</th>
                  <th className="py-2 pr-3 font-medium text-xs uppercase tracking-wider">When</th>
                  <th className="py-2 font-medium text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      <Send className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                      No notification logs yet
                    </td>
                  </tr>
                )}
                {logs.map((n) => {
                  const sc = statusConfig[n.status] ?? { label: n.status, variant: "secondary" as const };
                  return (
                    <tr key={n.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="py-3 pr-3">
                        <Badge variant={sc.variant}>{sc.label}</Badge>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="text-xs uppercase font-medium">{n.channel}</span>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="text-xs font-medium">{n.type}</span>
                      </td>
                      <td className="py-3 pr-3">
                        <div className="font-mono text-xs">{n.to}</div>
                        {n.firstName && <div className="text-xs text-muted-foreground">{n.firstName}</div>}
                      </td>
                      <td className="py-3 pr-3">
                        <span className="text-xs text-muted-foreground max-w-[250px] truncate inline-block" title={n.body}>
                          {n.body}
                        </span>
                        {n.error && (
                          <div className="text-xs text-red-400 mt-0.5 max-w-[250px] truncate" title={n.error}>
                            Error: {n.error}
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-3 tabular-nums">{n.attempts}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{timeAgo(n.createdAt)}</td>
                      <td className="py-3">
                        {n.status === "failed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRetry(n.id)}
                            disabled={retrying === n.id}
                            className="gap-1 h-7 text-xs"
                          >
                            <RotateCcw className={`h-3 w-3 ${retrying === n.id ? "animate-spin" : ""}`} />
                            Retry
                          </Button>
                        )}
                      </td>
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
