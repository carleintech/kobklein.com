"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { kkGet, kkPost } from "@/lib/kobklein-api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

type CaseDetail = {
  id: string;
  caseType: string;
  status: string;
  priority: string;
  subject: string;
  description: string;
  createdAt: string;
  closedAt: string | null;
  actions: { id: string; type: string; note: string; createdAt: string }[];
  messages: { id: string; body: string; createdAt: string }[];
};

type UserInfo = {
  id: string;
  kId: string;
  firstName: string;
  lastName: string;
  phone: string;
  kycTier: number;
  isFrozen: boolean;
};

export default function CaseDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await kkGet<any>(`v1/admin/compliance/cases/${id}`);
      setCaseData(data?.case || null);
      setUser(data?.user || null);
    } catch (e) {
      console.error("Failed to load case:", e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleResolve(resolution: "clear" | "escalate" | "freeze") {
    setResolving(true);
    try {
      await kkPost(`v1/admin/compliance/cases/${id}/resolve`, {
        resolution,
        note: note || undefined,
      });
      setNote("");
      await load();
    } catch (e: any) {
      alert(`Resolution failed: ${e.message}`);
    } finally {
      setResolving(false);
    }
  }

  function priorityBadge(p: string) {
    if (p === "critical") return <Badge variant="destructive">Critical</Badge>;
    if (p === "high") return <Badge variant="warning">High</Badge>;
    return <Badge variant="secondary">{p}</Badge>;
  }

  if (!caseData && !loading) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Case not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/compliance" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold">Case Detail</h1>
          <p className="text-sm text-muted-foreground">{id}</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="ml-auto gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {caseData && (
        <>
          {/* Case Info */}
          <Card className="rounded-2xl">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-[#C6A756]" />
                <span className="font-medium">Case Information</span>
                {priorityBadge(caseData.priority)}
                <Badge variant={caseData.status === "open" ? "warning" : "default"}>
                  {caseData.status}
                </Badge>
              </div>

              <div className="text-sm">
                <p className="font-medium">{caseData.subject}</p>
                <p className="text-muted-foreground mt-1">{caseData.description}</p>
              </div>

              <div className="text-xs text-muted-foreground">
                Created: {new Date(caseData.createdAt).toLocaleString()}
                {caseData.closedAt && (
                  <span className="ml-4">Closed: {new Date(caseData.closedAt).toLocaleString()}</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* User Info */}
          {user && (
            <Card className="rounded-2xl">
              <CardContent className="p-5">
                <h3 className="font-medium mb-2">Related User</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block">Name</span>
                    <span>{user.firstName} {user.lastName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">K-ID</span>
                    <span className="font-mono">{user.kId || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Phone</span>
                    <span>{user.phone}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Status</span>
                    <div className="flex gap-1">
                      <Badge variant="secondary">Tier {user.kycTier}</Badge>
                      {user.isFrozen && <Badge variant="destructive">Frozen</Badge>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          {caseData.actions.length > 0 && (
            <Card className="rounded-2xl">
              <CardContent className="p-5">
                <h3 className="font-medium mb-3">Action Timeline</h3>
                <div className="space-y-2">
                  {caseData.actions.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-[#C6A756]" />
                      <span className="text-muted-foreground text-xs">
                        {new Date(a.createdAt).toLocaleString()}
                      </span>
                      <Badge variant="outline">{a.type}</Badge>
                      <span>{a.note}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resolution Actions */}
          {caseData.status === "open" || caseData.status === "investigating" ? (
            <Card className="rounded-2xl">
              <CardContent className="p-5">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-[#C6A756]" />
                  Resolve Case
                </h3>
                <div className="space-y-3">
                  <Input
                    placeholder="Resolution note (optional)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleResolve("clear")}
                      disabled={resolving}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1"
                    >
                      <CheckCircle className="h-4 w-4" /> Clear
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolve("escalate")}
                      disabled={resolving}
                    >
                      Escalate
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleResolve("freeze")}
                      disabled={resolving}
                    >
                      Freeze Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
