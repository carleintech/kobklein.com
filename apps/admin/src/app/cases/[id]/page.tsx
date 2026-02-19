"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/badge";
import { Card } from "@kobklein/ui/card";
import { Button } from "@kobklein/ui/button";
import { kkGet, kkPost } from "@/lib/kobklein-api";
import { ArrowLeft, MessageSquare, Activity, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

const caseTypeLabels: Record<string, string> = {
  wrong_recipient: "Wrong Recipient",
  unauthorized: "Unauthorized Transaction",
  merchant_dispute: "Merchant Dispute",
};

const priorityVariant: Record<string, "red" | "yellow" | "blue" | "default"> = {
  critical: "red",
  high: "red",
  normal: "default",
  low: "blue",
};

const statusVariant: Record<string, "green" | "yellow" | "red" | "blue" | "default"> = {
  open: "yellow",
  investigating: "blue",
  pending_user: "yellow",
  pending_admin: "yellow",
  resolved: "green",
  rejected: "default",
};

const actionTypeLabels: Record<string, string> = {
  freeze_account: "Account Frozen",
  unfreeze_account: "Account Unfrozen",
  request_info: "Info Requested",
  mark_fraud: "Marked as Fraud",
  refund_recommendation: "Refund Recommended",
  close_case: "Case Closed",
};

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function CaseDetailPage() {
  const params = useParams<{ id: string }>();
  const caseId = params.id;

  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const [resolutionText, setResolutionText] = useState("");
  const [rejectReasonText, setRejectReasonText] = useState("");
  const [showResolveInput, setShowResolveInput] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);

  const fetchCase = useCallback(async () => {
    try {
      const data = await kkGet<any>(`v1/admin/cases/${caseId}`);
      setCaseData(data);
    } catch (e: any) {
      console.error("Failed to load case:", e);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchCase();
  }, [fetchCase]);

  async function handleAction(
    action: string,
    endpoint: string,
    body?: Record<string, unknown>,
  ) {
    setActionLoading(action);
    setActionMessage("");
    try {
      await kkPost(endpoint, body ?? {});
      setActionMessage(`${action} completed successfully`);
      setShowResolveInput(false);
      setShowRejectInput(false);
      setResolutionText("");
      setRejectReasonText("");
      await fetchCase();
    } catch (e: any) {
      setActionMessage(`Error: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#C9A84C]" />
        <span className="ml-2 text-sm text-[#6B7489]">Loading case...</span>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="space-y-6">
        <Link href="/cases">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cases
          </Button>
        </Link>
        <p className="text-sm text-red-400">Failed to load case data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/cases">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cases
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold">Case #{caseData.id.slice(0, 8)}</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {caseTypeLabels[caseData.caseType] || caseData.caseType} • {timeAgo(caseData.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Case Summary */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-medium">Case Summary</h2>
                <div className="flex gap-2">
                  <Badge variant={priorityVariant[caseData.priority] ?? "default"}>
                    {caseData.priority}
                  </Badge>
                  <Badge variant={statusVariant[caseData.status] ?? "default"}>
                    {caseData.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium">Type:</span>{" "}
                  <span className="text-sm">{caseTypeLabels[caseData.caseType] || caseData.caseType}</span>
                </div>
                <div>
                  <span className="text-sm font-medium">Reporter:</span>{" "}
                  <span className="font-mono text-sm">{caseData.reporterUserId || "System"}</span>
                </div>
                {caseData.referenceType && (
                  <div>
                    <span className="text-sm font-medium">Reference:</span>{" "}
                    <span className="text-sm">
                      {caseData.referenceType} #{caseData.referenceId?.slice(0, 8)}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium">Created:</span>{" "}
                  <span className="text-sm">{new Date(caseData.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <span className="text-sm font-medium">Description:</span>
                <p className="text-sm mt-1 p-3 bg-[#0F1D35] rounded">{caseData.description}</p>
              </div>
            </div>
          </Card>

          {/* Messages */}
          <Card>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <h2 className="font-medium">Messages</h2>
              </div>

              <div className="space-y-3">
                {caseData.messages?.map((message: any) => (
                  <div key={message.id} className="border-l-2 border-[#C9A84C]/30 pl-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium capitalize">{message.authorRole}</span>
                      {message.authorUserId && (
                        <span className="font-mono text-xs text-[#6B7489]">
                          {message.authorUserId.slice(0, 8)}...
                        </span>
                      )}
                      <span className="text-xs text-[#6B7489]">{timeAgo(message.createdAt)}</span>
                    </div>
                    <p className="text-sm">{message.message}</p>
                  </div>
                ))}
                {(!caseData.messages || caseData.messages.length === 0) && (
                  <p className="text-sm text-[#6B7489]">No messages yet</p>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          <Card>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <h2 className="font-medium">Actions</h2>
              </div>

              <div className="space-y-2">
                {caseData.caseType === "unauthorized" && caseData.status === "open" && (
                  <Button
                    className="w-full"
                    variant="destructive"
                    disabled={actionLoading !== null}
                    onClick={() =>
                      handleAction(
                        "Freeze Account",
                        `v1/admin/cases/${caseId}/freeze`,
                      )
                    }
                  >
                    {actionLoading === "Freeze Account" ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Freezing...</>
                    ) : (
                      "Freeze Account"
                    )}
                  </Button>
                )}

                <Button
                  className="w-full"
                  variant="outline"
                  disabled={actionLoading !== null}
                  onClick={() =>
                    handleAction(
                      "Request Info",
                      `v1/admin/cases/${caseId}/request-info`,
                    )
                  }
                >
                  {actionLoading === "Request Info" ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Requesting...</>
                  ) : (
                    "Request Info"
                  )}
                </Button>

                {/* Resolve Case */}
                {!showResolveInput ? (
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled={actionLoading !== null}
                    onClick={() => {
                      setShowResolveInput(true);
                      setShowRejectInput(false);
                    }}
                  >
                    Resolve Case
                  </Button>
                ) : (
                  <div className="space-y-2 p-3 rounded-lg border border-emerald-600/40 bg-emerald-950/20">
                    <label className="text-xs text-[#B8BCC8] block">Resolution</label>
                    <textarea
                      value={resolutionText}
                      onChange={(e) => setResolutionText(e.target.value)}
                      placeholder="Describe the resolution..."
                      className="w-full h-20 rounded-md border border-input bg-[#0F1D35] px-3 py-2 text-sm text-[#F0F1F5] placeholder:text-[#6B7489] resize-none focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white"
                        disabled={actionLoading !== null || !resolutionText.trim()}
                        onClick={() =>
                          handleAction(
                            "Resolve Case",
                            `v1/admin/cases/${caseId}/resolve`,
                            { resolution: resolutionText.trim() },
                          )
                        }
                      >
                        {actionLoading === "Resolve Case" ? (
                          <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Resolving...</>
                        ) : (
                          "Confirm Resolve"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowResolveInput(false);
                          setResolutionText("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Reject Case */}
                {!showRejectInput ? (
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled={actionLoading !== null}
                    onClick={() => {
                      setShowRejectInput(true);
                      setShowResolveInput(false);
                    }}
                  >
                    Reject Case
                  </Button>
                ) : (
                  <div className="space-y-2 p-3 rounded-lg border border-red-600/40 bg-red-950/20">
                    <label className="text-xs text-[#B8BCC8] block">Rejection Reason</label>
                    <textarea
                      value={rejectReasonText}
                      onChange={(e) => setRejectReasonText(e.target.value)}
                      placeholder="Describe the reason for rejection..."
                      className="w-full h-20 rounded-md border border-input bg-[#0F1D35] px-3 py-2 text-sm text-[#F0F1F5] placeholder:text-[#6B7489] resize-none focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        disabled={actionLoading !== null || !rejectReasonText.trim()}
                        onClick={() =>
                          handleAction(
                            "Reject Case",
                            `v1/admin/cases/${caseId}/reject`,
                            { reason: rejectReasonText.trim() },
                          )
                        }
                      >
                        {actionLoading === "Reject Case" ? (
                          <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Rejecting...</>
                        ) : (
                          "Confirm Reject"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowRejectInput(false);
                          setRejectReasonText("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Feedback */}
              {actionMessage && (
                <p className={`text-sm ${actionMessage.startsWith("Error") ? "text-red-400" : "text-emerald-400"}`}>
                  {actionMessage}
                </p>
              )}
            </div>
          </Card>

          {/* Action History */}
          <Card>
            <div className="space-y-4">
              <h2 className="font-medium">Action History</h2>

              <div className="space-y-3">
                {caseData.actions?.map((action: any) => (
                  <div key={action.id} className="text-sm">
                    <div className="font-medium">
                      {actionTypeLabels[action.actionType] || action.actionType}
                    </div>
                    <div className="text-xs text-[#6B7489]">
                      {timeAgo(action.createdAt)}
                      {action.actorUserId && (
                        <span className="ml-2 font-mono">{action.actorUserId.slice(0, 8)}...</span>
                      )}
                    </div>
                    {action.meta && (
                      <div className="text-xs text-[#B8BCC8] mt-1">
                        {JSON.stringify(action.meta, null, 2)}
                      </div>
                    )}
                  </div>
                ))}
                {(!caseData.actions || caseData.actions.length === 0) && (
                  <p className="text-sm text-[#6B7489]">No actions yet</p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}