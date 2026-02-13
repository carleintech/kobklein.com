"use client";

import { useEffect, useState, useCallback } from "react";
import { kkGet, kkPost } from "@/lib/kobklein-api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  UserCheck,
} from "lucide-react";

type KycSubmission = {
  id: string;
  userId: string;
  fullName: string;
  documentType: string;
  idNumber: string;
  documentUrl: string;
  selfieUrl: string;
  addressProof: string;
  submittedAt: string;
  user: {
    id: string;
    kId: string;
    firstName: string;
    lastName: string;
    phone: string;
    kycTier: number;
    kycStatus: string;
  };
};

export default function KycReviewPage() {
  const [profiles, setProfiles] = useState<KycSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await kkGet<any>("v1/admin/compliance/kyc-pending");
      setProfiles(data?.profiles || []);
    } catch (e) {
      console.error("Failed to load KYC data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(userId: string) {
    setActionLoading(userId);
    try {
      await kkPost(`v1/admin/compliance/kyc/${userId}/approve`, {});
      await load();
    } catch (e: any) {
      alert(`Approve failed: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(userId: string) {
    const reason = rejectReasons[userId];
    if (!reason?.trim()) {
      alert("Rejection reason is required");
      return;
    }
    setActionLoading(userId);
    try {
      await kkPost(`v1/admin/compliance/kyc/${userId}/reject`, { reason });
      await load();
    } catch (e: any) {
      alert(`Reject failed: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">KYC Review Queue</h1>
          <p className="text-sm text-muted-foreground">Review and approve pending identity verifications</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {profiles.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="p-8 text-center text-muted-foreground">
            <UserCheck className="h-5 w-5 mx-auto mb-2 text-emerald-400" />
            No pending KYC submissions
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {profiles.map((p) => (
            <Card key={p.id} className="rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {p.user.firstName} {p.user.lastName}
                      </span>
                      {p.user.kId && (
                        <Badge variant="outline" className="text-xs">{p.user.kId}</Badge>
                      )}
                      <Badge variant="secondary">Tier {p.user.kycTier}</Badge>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {p.user.phone}
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs mt-2">
                      <div>
                        <span className="text-muted-foreground">Name: </span>
                        <span>{p.fullName || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Doc Type: </span>
                        <span>{p.documentType || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">ID #: </span>
                        <span className="font-mono">{p.idNumber || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Submitted: </span>
                        <span>{p.submittedAt ? new Date(p.submittedAt).toLocaleDateString() : "—"}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-2 text-xs">
                      {p.documentUrl && (
                        <Badge variant="outline" className="text-emerald-400 border-emerald-400/30">ID Doc</Badge>
                      )}
                      {p.selfieUrl && (
                        <Badge variant="outline" className="text-emerald-400 border-emerald-400/30">Selfie</Badge>
                      )}
                      {p.addressProof && (
                        <Badge variant="outline" className="text-emerald-400 border-emerald-400/30">Address</Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(p.user.id)}
                      disabled={actionLoading === p.user.id}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </Button>

                    <div className="flex gap-1">
                      <Input
                        placeholder="Rejection reason"
                        className="text-xs h-8"
                        value={rejectReasons[p.user.id] || ""}
                        onChange={(e) =>
                          setRejectReasons((prev) => ({ ...prev, [p.user.id]: e.target.value }))
                        }
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(p.user.id)}
                        disabled={actionLoading === p.user.id}
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
