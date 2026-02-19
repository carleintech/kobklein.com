"use client";

import { useEffect, useState, useCallback } from "react";
import { kkGet, kkPost } from "@/lib/kobklein-api";
import { Card, CardContent } from "@kobklein/ui/card";
import { Button } from "@kobklein/ui/button";
import { Badge } from "@kobklein/ui/badge";
import { RefreshCw, Copy, FileText, CheckCircle } from "lucide-react";

type Withdrawal = {
  id: string;
  code: string;
  amount: number;
  currency: string;
  status: string;
  userId?: string;
  expiresAt?: string;
  createdAt: string;
};

export default function OperationsPage() {
  const [rows, setRows] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Try the dedicated withdrawals endpoint first, fallback to recent-activity
      let data: Withdrawal[];
      try {
        data = await kkGet<Withdrawal[]>("distributor/withdrawals");
      } catch {
        const activity = await kkGet<{ recentWithdrawals?: Withdrawal[] }>("admin/recent-activity");
        data = (activity.recentWithdrawals ?? []).filter((w) => w.status === "pending");
      }
      setRows(data);
      setLastRefresh(new Date());
    } catch (e) {
      console.error("Failed to load withdrawals:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  async function approve(code: string) {
    try {
      await kkPost(`distributor/withdrawals/${code}/approve`, {});
      await load();
    } catch {
      alert("Approval failed — check console for details");
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  function ageSeconds(createdAt: string) {
    return Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  }

  function formatAge(seconds: number) {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  }

  function fmt(n: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "HTG",
      minimumFractionDigits: 0,
    }).format(n);
  }

  const pending = rows.filter((w) => w.status === "pending");
  const completed = rows.filter((w) => w.status !== "pending");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Live Operations</h1>
          <p className="text-sm text-muted-foreground">
            Pending withdrawals &amp; cash-out control
            {lastRefresh && (
              <span className="ml-2 text-xs opacity-60">
                Last refresh: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Pending Withdrawals — HIGH PRIORITY */}
      <Card className="rounded-2xl">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="font-medium">Pending Withdrawals</span>
            <Badge variant="warning" className="ml-1">{pending.length}</Badge>
            <span className="ml-auto text-xs text-muted-foreground">Auto-refresh: 5s</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-4 font-medium text-xs uppercase tracking-wider">Code</th>
                  <th className="py-2 pr-4 font-medium text-xs uppercase tracking-wider">Amount</th>
                  <th className="py-2 pr-4 font-medium text-xs uppercase tracking-wider">Currency</th>
                  <th className="py-2 pr-4 font-medium text-xs uppercase tracking-wider">Age</th>
                  <th className="py-2 pr-4 font-medium text-xs uppercase tracking-wider">Expires</th>
                  <th className="py-2 font-medium text-xs uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      <CheckCircle className="h-5 w-5 mx-auto mb-2 text-emerald-400" />
                      No pending withdrawals — all clear
                    </td>
                  </tr>
                )}

                {pending.map((w) => {
                  const age = ageSeconds(w.createdAt);
                  const expiresIn = w.expiresAt
                    ? Math.floor((new Date(w.expiresAt).getTime() - Date.now()) / 1000)
                    : null;
                  return (
                    <tr key={w.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="py-3 pr-4">
                        <span className="font-mono font-medium">{w.code}</span>
                      </td>
                      <td className="py-3 pr-4 tabular-nums">{fmt(w.amount)}</td>
                      <td className="py-3 pr-4">{w.currency}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={age > 300 ? "danger" : age > 120 ? "warning" : "success"}>
                          {formatAge(age)}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        {expiresIn !== null ? (
                          <Badge variant={expiresIn <= 0 ? "destructive" : expiresIn < 300 ? "warning" : "success"}>
                            {expiresIn <= 0 ? "Expired" : `${Math.floor(expiresIn / 60)}m left`}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Copy code"
                            onClick={() => copyCode(w.code)}
                          >
                            <Copy className={`h-3.5 w-3.5 ${copied === w.code ? "text-emerald-400" : ""}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Open case"
                            onClick={() => window.open(`/cases?code=${w.code}`, "_self")}
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => approve(w.code)}
                            className="rounded-lg"
                          >
                            Approve
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recently Completed */}
      {completed.length > 0 && (
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="font-medium mb-4 text-muted-foreground">Recently Completed</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="py-2 pr-4 font-medium text-xs uppercase tracking-wider">Code</th>
                    <th className="py-2 pr-4 font-medium text-xs uppercase tracking-wider">Amount</th>
                    <th className="py-2 pr-4 font-medium text-xs uppercase tracking-wider">Currency</th>
                    <th className="py-2 pr-4 font-medium text-xs uppercase tracking-wider">Status</th>
                    <th className="py-2 font-medium text-xs uppercase tracking-wider">Age</th>
                  </tr>
                </thead>
                <tbody>
                  {completed.map((w) => (
                    <tr key={w.id} className="border-t border-border">
                      <td className="py-3 pr-4 font-mono">{w.code}</td>
                      <td className="py-3 pr-4 tabular-nums">{fmt(w.amount)}</td>
                      <td className="py-3 pr-4">{w.currency}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={w.status === "completed" ? "success" : w.status === "reversed" ? "danger" : "secondary"}>
                          {w.status}
                        </Badge>
                      </td>
                      <td className="py-3">{formatAge(ageSeconds(w.createdAt))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
