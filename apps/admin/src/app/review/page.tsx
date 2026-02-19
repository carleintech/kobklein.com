"use client";

import { useEffect, useState, useCallback } from "react";
import { kkGet, kkPost } from "@/lib/kobklein-api";
import { Card, CardContent } from "@kobklein/ui/card";
import { Badge } from "@kobklein/ui/badge";
import { Button } from "@kobklein/ui/button";
import { Input } from "@kobklein/ui/input";
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";

type Transfer = {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  type: string;
  status: string;
  riskScore?: number;
  riskLevel?: string;
  riskReasons?: string[];
  createdAt: string;
  sender?: {
    kId?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
};

type Stats = {
  pendingReview: number;
  approvedToday: number;
  blockedToday: number;
};

export default function ReviewPage() {
  const [items, setItems] = useState<Transfer[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pending, st] = await Promise.all([
        kkGet<any>("v1/admin/transfers/pending"),
        kkGet<any>("v1/admin/transfers/stats"),
      ]);
      setItems(pending?.items || pending?.transfers || []);
      setStats(st);
    } catch (e) {
      console.error("Failed to load review data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(id: string) {
    setActionLoading(id);
    try {
      await kkPost(`v1/admin/transfers/${id}/approve`, { note: "Approved via admin" });
      await load();
    } catch (e: any) {
      alert(`Approve failed: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(id: string) {
    const reason = rejectReason[id];
    if (!reason?.trim()) {
      alert("Rejection reason is required");
      return;
    }
    setActionLoading(id);
    try {
      await kkPost(`v1/admin/transfers/${id}/reject`, { reason });
      await load();
    } catch (e: any) {
      alert(`Reject failed: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  }

  function riskBadge(level?: string) {
    if (!level) return <Badge variant="outline">—</Badge>;
    if (level === "high") return <Badge variant="destructive">High</Badge>;
    if (level === "medium") return <Badge variant="warning">Medium</Badge>;
    return <Badge variant="secondary">Low</Badge>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Transfer Review Queue</h1>
          <p className="text-sm text-muted-foreground">Approve or reject flagged transactions</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending</span>
                <Clock className="h-4 w-4 text-yellow-400" />
              </div>
              <div className="text-2xl font-semibold tabular-nums mt-1 text-yellow-400">
                {stats.pendingReview}
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Approved Today</span>
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-semibold tabular-nums mt-1 text-emerald-400">
                {stats.approvedToday}
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Blocked Today</span>
                <XCircle className="h-4 w-4 text-red-400" />
              </div>
              <div className="text-2xl font-semibold tabular-nums mt-1 text-red-400">
                {stats.blockedToday}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Queue Items */}
      {items.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="p-8 text-center text-muted-foreground">
            <ShieldAlert className="h-5 w-5 mx-auto mb-2 text-emerald-400" />
            No pending transfers — queue is clear
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((t) => (
            <Card key={t.id} className="rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  {/* Transfer details */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg tabular-nums">
                        {t.amount?.toLocaleString()} {t.currency}
                      </span>
                      <Badge variant="outline">{t.type}</Badge>
                      {riskBadge(t.riskLevel)}
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <span>From: </span>
                      <span className="text-foreground">
                        {t.sender?.firstName} {t.sender?.lastName}
                        {t.sender?.kId && <span className="text-xs ml-1 opacity-60">({t.sender.kId})</span>}
                      </span>
                    </div>

                    {t.riskScore != null && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Risk score: {t.riskScore}
                        {t.riskReasons?.length ? ` — ${t.riskReasons.join(", ")}` : ""}
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      {new Date(t.createdAt).toLocaleString()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(t.id)}
                      disabled={actionLoading === t.id}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </Button>

                    <div className="flex gap-1">
                      <Input
                        placeholder="Rejection reason"
                        className="text-xs h-8"
                        value={rejectReason[t.id] || ""}
                        onChange={(e) =>
                          setRejectReason((prev) => ({ ...prev, [t.id]: e.target.value }))
                        }
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(t.id)}
                        disabled={actionLoading === t.id}
                        className="h-8 px-2"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
