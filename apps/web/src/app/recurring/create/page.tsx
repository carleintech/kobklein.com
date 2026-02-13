"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { kkGet, kkPost } from "@/lib/kobklein-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  ArrowLeft,
  Calendar,
  Crown,
  Loader2,
} from "lucide-react";

type FamilyMember = {
  id: string;
  nickname?: string;
  relationship?: string;
  isFavorite?: boolean;
  familyUser: {
    id: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    handle?: string;
  };
};

type Schedule = {
  id: string;
  status: string;
};

const FAMILY_EMOJIS: Record<string, string> = {
  parent: "👩",
  child: "👧",
  sibling: "🧑",
  spouse: "💑",
  cousin: "🤝",
  other: "👤",
};

export default function CreateRecurringPage() {
  const router = useRouter();
  const toast = useToast();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [amountUsd, setAmountUsd] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isGated, setIsGated] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const [members, schedulesRes, planRes] = await Promise.all([
          kkGet<FamilyMember[]>("v1/family/members"),
          kkGet<{ ok: boolean; schedules: Schedule[] } | Schedule[]>(
            "v1/remittance/schedules"
          ).catch(() => []),
          kkGet<{ plan: { tier: number } } | null>("v1/billing/my-plan").catch(
            () => null
          ),
        ]);

        setFamilyMembers(members);

        // Plan gate check
        const schedules = Array.isArray(schedulesRes)
          ? schedulesRes
          : (schedulesRes as any).schedules || [];
        const activeCount = schedules.filter(
          (s: Schedule) => s.status === "active"
        ).length;
        const planTier = planRes?.plan?.tier ?? 0;
        const isFree = planTier === 0;
        setIsGated(isFree && activeCount >= 1);
      } catch {
        toast.show("Failed to load data", "error");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function handleSubmit() {
    if (!selectedMemberId) {
      toast.show("Please select a family member", "error");
      return;
    }
    if (!amountUsd || Number(amountUsd) <= 0) {
      toast.show("Please enter a valid amount", "error");
      return;
    }

    const member = familyMembers.find((m) => m.id === selectedMemberId);
    if (!member) return;

    setSubmitting(true);
    try {
      await kkPost("v1/remittance/schedule", {
        recipientUserId: member.familyUser.id,
        amountUsd: Number(amountUsd),
        frequency,
        note: note || undefined,
      });
      toast.show("Scheduled transfer created!", "success");
      router.push("/recurring");
    } catch (e: any) {
      toast.show(e.message || "Failed to create schedule", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Sort: favorites first
  const sortedMembers = [...familyMembers].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <div>
          <div className="text-2xl font-semibold">New Scheduled Transfer</div>
          <div className="text-sm text-muted-foreground">
            Send money automatically on a schedule
          </div>
        </div>
      </div>

      {/* Plan Gate Banner */}
      {isGated && (
        <button
          type="button"
          onClick={() => router.push("/settings/plan")}
          className="w-full text-left"
        >
          <Card className="rounded-2xl border-[#C6A756]/30 bg-[#C6A756]/5">
            <CardContent className="p-4 flex items-center gap-3">
              <Crown className="h-8 w-8 text-[#C6A756] shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-semibold">Upgrade Required</div>
                <div className="text-xs text-muted-foreground">
                  Free plan allows 1 scheduled transfer. Upgrade for unlimited.
                </div>
              </div>
            </CardContent>
          </Card>
        </button>
      )}

      {/* Family Member Selector */}
      <div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
          Select Family Member
        </div>
        {sortedMembers.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="p-6 text-center text-muted-foreground">
              <div className="text-sm">No family members linked</div>
              <div className="text-xs mt-1">
                Add family from your dashboard first
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {sortedMembers.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => setSelectedMemberId(member.id)}
                className={`p-3 rounded-xl border text-left transition ${
                  selectedMemberId === member.id
                    ? "border-[#C6A756] bg-[#C6A756]/10"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {FAMILY_EMOJIS[member.relationship || "other"] || "👤"}
                  </span>
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">
                      {member.isFavorite ? "★ " : ""}
                      {member.nickname ||
                        member.familyUser.firstName ||
                        "Family"}
                    </div>
                    {member.relationship && (
                      <div className="text-[10px] text-muted-foreground">
                        {member.relationship}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Form */}
      <Card className="rounded-2xl">
        <CardContent className="p-4 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider">
              Amount (USD)
            </label>
            <Input
              placeholder="200.00"
              type="number"
              value={amountUsd}
              onChange={(e) => setAmountUsd(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider">
              Frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"
            >
              <option value="weekly">Every Week</option>
              <option value="biweekly">Every 2 Weeks</option>
              <option value="monthly">Every Month</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider">
              Note (optional)
            </label>
            <Input
              placeholder="e.g., School fees, groceries"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting || isGated || !selectedMemberId}
            className="w-full bg-[#C6A756] hover:bg-[#9F7F2C] text-white"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                Create Schedule
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
