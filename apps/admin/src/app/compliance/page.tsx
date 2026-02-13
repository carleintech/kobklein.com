"use client";

import { useEffect, useState, useCallback } from "react";
import { kkGet, kkPost } from "@/lib/kobklein-api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import {
  RefreshCw,
  ShieldCheck,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
} from "lucide-react";

type Stats = {
  openCases: number;
  kycPending: number;
  sanctionsAlerts: number;
  resolvedToday: number;
};

type ComplianceCase = {
  id: string;
  caseType: string;
  status: string;
  priority: string;
  subject: string;
  description: string;
  createdAt: string;
};

export default function CompliancePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [cases, setCases] = useState<ComplianceCase[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([
        kkGet<any>("v1/admin/compliance/stats"),
        kkGet<any>("v1/admin/compliance/cases"),
      ]);
      setStats(s);
      setCases(c?.cases || []);
    } catch (e) {
      console.error("Failed to load compliance data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function priorityBadge(p: string) {
    if (p === "critical") return <Badge variant="destructive">Critical</Badge>;
    if (p === "high") return <Badge variant="warning">High</Badge>;
    return <Badge variant="secondary">{p}</Badge>;
  }

  function statusBadge(s: string) {
    if (s === "open") return <Badge variant="warning">Open</Badge>;
    if (s === "resolved") return <Badge variant="default">Resolved</Badge>;
    if (s === "investigating") return <Badge variant="outline">Investigating</Badge>;
    return <Badge variant="secondary">{s}</Badge>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Compliance Dashboard</h1>
          <p className="text-sm text-muted-foreground">Monitor compliance cases, KYC reviews, and sanctions</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Open Cases</span>
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
              </div>
              <div className="text-2xl font-semibold tabular-nums mt-1 text-yellow-400">{stats.openCases}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">KYC Pending</span>
                <Users className="h-4 w-4 text-blue-400" />
              </div>
              <div className="text-2xl font-semibold tabular-nums mt-1 text-blue-400">{stats.kycPending}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sanctions Alerts</span>
                <ShieldCheck className="h-4 w-4 text-red-400" />
              </div>
              <div className="text-2xl font-semibold tabular-nums mt-1 text-red-400">{stats.sanctionsAlerts}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Resolved Today</span>
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-semibold tabular-nums mt-1 text-emerald-400">{stats.resolvedToday}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cases Table */}
      <Card className="rounded-2xl">
        <CardContent className="p-5">
          <h2 className="font-medium mb-4">Recent Compliance Cases</h2>
          <DataTable
            columns={[
              {
                key: "priority",
                label: "Priority",
                render: (r: ComplianceCase) => priorityBadge(r.priority),
              },
              {
                key: "subject",
                label: "Subject",
                render: (r: ComplianceCase) => (
                  <span className="text-sm max-w-[300px] truncate block">{r.subject || "—"}</span>
                ),
              },
              {
                key: "status",
                label: "Status",
                render: (r: ComplianceCase) => statusBadge(r.status),
              },
              {
                key: "createdAt",
                label: "Created",
                render: (r: ComplianceCase) => (
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                ),
              },
              {
                key: "actions",
                label: "",
                render: (r: ComplianceCase) => (
                  <a
                    href={`/compliance/${r.id}`}
                    className="text-xs text-[#C6A756] hover:underline"
                  >
                    View
                  </a>
                ),
              },
            ]}
            rows={cases}
            emptyMessage="No compliance cases — system is clear"
          />
        </CardContent>
      </Card>
    </div>
  );
}
