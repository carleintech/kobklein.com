import { Badge } from "@/components/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiGet, apiPost } from "@/lib/api";
import { ArrowLeft, User, MessageSquare, Activity } from "lucide-react";
import Link from "next/link";

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

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caseData = await apiGet<any>(`/admin/cases/${id}`, {});

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
                <p className="text-sm mt-1 p-3 bg-gray-50 rounded">{caseData.description}</p>
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
                  <div key={message.id} className="border-l-2 border-gray-200 pl-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium capitalize">{message.authorRole}</span>
                      {message.authorUserId && (
                        <span className="font-mono text-xs text-gray-500">
                          {message.authorUserId.slice(0, 8)}…
                        </span>
                      )}
                      <span className="text-xs text-gray-500">{timeAgo(message.createdAt)}</span>
                    </div>
                    <p className="text-sm">{message.message}</p>
                  </div>
                ))}
                {(!caseData.messages || caseData.messages.length === 0) && (
                  <p className="text-sm text-gray-500">No messages yet</p>
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
                  <Button className="w-full" variant="destructive">
                    Freeze Account
                  </Button>
                )}
                <Button className="w-full" variant="outline">
                  Request Info
                </Button>
                <Button className="w-full" variant="outline">
                  Resolve Case
                </Button>
                <Button className="w-full" variant="outline">
                  Reject Case
                </Button>
              </div>
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
                    <div className="text-xs text-gray-500">
                      {timeAgo(action.createdAt)}
                      {action.actorUserId && (
                        <span className="ml-2 font-mono">{action.actorUserId.slice(0, 8)}…</span>
                      )}
                    </div>
                    {action.meta && (
                      <div className="text-xs text-gray-600 mt-1">
                        {JSON.stringify(action.meta, null, 2)}
                      </div>
                    )}
                  </div>
                ))}
                {(!caseData.actions || caseData.actions.length === 0) && (
                  <p className="text-sm text-gray-500">No actions yet</p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}