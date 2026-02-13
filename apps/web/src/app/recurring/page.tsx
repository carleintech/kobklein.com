"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { kkGet, kkPost } from "@/lib/kobklein-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Loader2,
  Pause,
  Play,
  Plus,
  Trash2,
} from "lucide-react";

type Schedule = {
  id: string;
  amountUsd: number;
  frequency: string;
  status: string;
  nextRunAt: string;
  lastRunAt: string | null;
  failureCount: number;
  note: string | null;
  recipient?: {
    id: string;
    firstName?: string;
    lastName?: string;
    kId?: string;
    phone?: string;
  };
  recipientUserId?: string;
  createdAt: string;
};

const FREQ_LABELS: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 Weeks",
  monthly: "Monthly",
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
  active: "success",
  paused: "warning",
  canceled: "secondary",
  failed: "destructive",
};

export default function RecurringPage() {
  const router = useRouter();
  const toast = useToast();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await kkGet<{ ok: boolean; schedules: Schedule[] } | Schedule[]>(
        "v1/remittance/schedules"
      );
      const list = Array.isArray(res) ? res : res.schedules || [];
      setSchedules(list);
    } catch {
      toast.show("Failed to load schedules", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePause(id: string) {
    setActionLoading(id);
    try {
      await kkPost(`v1/remittance/schedule/${id}/pause`, {});
      toast.show("Schedule paused", "success");
      await load();
    } catch (e: any) {
      toast.show(e.message || "Failed to pause", "error");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResume(id: string) {
    setActionLoading(id);
    try {
      await kkPost(`v1/remittance/schedule/${id}/resume`, {});
      toast.show("Schedule resumed", "success");
      await load();
    } catch (e: any) {
      toast.show(e.message || "Failed to resume", "error");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancel(id: string) {
    setActionLoading(id);
    try {
      await kkPost(`v1/remittance/schedule/${id}/cancel`, {});
      toast.show("Schedule canceled", "success");
      setConfirmCancel(null);
      await load();
    } catch (e: any) {
      toast.show(e.message || "Failed to cancel", "error");
    } finally {
      setActionLoading(null);
    }
  }

  function recipientDisplayName(s: Schedule): string {
    if (s.recipient?.firstName) return s.recipient.firstName;
    if (s.recipient?.kId) return s.recipient.kId;
    if (s.recipient?.phone) return s.recipient.phone;
    if (s.recipientUserId) return s.recipientUserId.slice(0, 8) + "...";
    return "Recipient";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <div>
            <div className="text-2xl font-semibold">Scheduled Transfers</div>
            <div className="text-sm text-muted-foreground">
              Recurring family remittances
            </div>
          </div>
        </div>
      </div>

      {/* Create New Button */}
      <Button
        onClick={() => router.push("/recurring/create")}
        className="w-full bg-[#C6A756] hover:bg-[#9F7F2C] text-white"
      >
        <Plus className="h-4 w-4 mr-2" />
        Create New Schedule
      </Button>

      {/* Schedule List */}
      {schedules.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="p-8 text-center text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <div className="text-sm font-medium">No scheduled transfers yet</div>
            <div className="text-xs mt-1">
              Set up recurring remittances for your family
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {schedules.map((s) => (
            <Card key={s.id} className="rounded-2xl">
              <CardContent className="p-4 space-y-3">
                {/* Top row: name + status */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {recipientDisplayName(s)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {FREQ_LABELS[s.frequency] || s.frequency}
                      {s.note && ` · ${s.note}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_VARIANT[s.status] || "secondary"}>
                      {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                    </Badge>
                  </div>
                </div>

                {/* Amount + next run */}
                <div className="flex items-center justify-between text-sm">
                  <div className="text-2xl font-bold">
                    ${Number(s.amountUsd).toFixed(2)}
                    <span className="text-xs text-muted-foreground ml-1">USD</span>
                  </div>
                  {s.status === "active" && s.nextRunAt && (
                    <div className="text-xs text-muted-foreground text-right">
                      Next: {new Date(s.nextRunAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  )}
                </div>

                {/* Failure warning */}
                {s.failureCount > 0 && s.status !== "canceled" && (
                  <div className="flex items-center gap-1.5 text-xs text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {s.failureCount} failed attempt{s.failureCount > 1 ? "s" : ""}
                  </div>
                )}

                {/* Actions */}
                {s.status !== "canceled" && (
                  <div className="flex gap-2">
                    {s.status === "active" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePause(s.id)}
                        disabled={actionLoading === s.id}
                        className="flex-1"
                      >
                        {actionLoading === s.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <Pause className="h-3.5 w-3.5 mr-1" />
                            Pause
                          </>
                        )}
                      </Button>
                    ) : s.status === "paused" || s.status === "failed" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResume(s.id)}
                        disabled={actionLoading === s.id}
                        className="flex-1"
                      >
                        {actionLoading === s.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <Play className="h-3.5 w-3.5 mr-1" />
                            Resume
                          </>
                        )}
                      </Button>
                    ) : null}

                    {confirmCancel === s.id ? (
                      <div className="flex gap-1 flex-1">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancel(s.id)}
                          disabled={actionLoading === s.id}
                          className="flex-1"
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmCancel(null)}
                          className="flex-1"
                        >
                          No
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmCancel(s.id)}
                        className="text-destructive border-destructive/30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
