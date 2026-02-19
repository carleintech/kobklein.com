"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";
import { kkPost, kkPatch } from "@/lib/kobklein-api";
import { Card, CardContent } from "@kobklein/ui/card";
import { Badge } from "@kobklein/ui/badge";
import { useToast } from "@kobklein/ui";
import {
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Crown,
  Globe,
  Heart,
  Plus,
  Send,
  Shield,
  Star,
  Users,
  Wallet,
} from "lucide-react";

type Props = {
  profile: {
    id: string;
    firstName?: string;
    handle?: string;
    kycTier: number;
    kycStatus?: string;
    planSlug?: string;
    planName?: string;
    planTier?: number;
  };
};

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
  recentTransfers: { id: string; amount: number; createdAt: string }[];
};

type DashboardData = {
  familyCount: number;
  balance: number;
  totalSentToFamily: number;
  pendingRequests: { id: string; amount: number; requester: { firstName?: string } }[];
};

export function DiasporaDashboard({ profile }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [family, setFamily] = useState<FamilyMember[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addPhone, setAddPhone] = useState("");
  const [addNickname, setAddNickname] = useState("");
  const [addRelationship, setAddRelationship] = useState("");

  const load = useCallback(async () => {
    try {
      const [dash, members] = await Promise.all([
        apiGet<DashboardData>("v1/family/dashboard"),
        apiGet<FamilyMember[]>("v1/family/members"),
      ]);
      setDashboard(dash);
      setFamily(members);
    } catch (e: unknown) {
      console.error("Failed to load diaspora dashboard:", e);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddFamily() {
    if (!addPhone) return;
    try {
      await kkPost("v1/family/link", {
        phoneOrHandle: addPhone,
        nickname: addNickname || undefined,
        relationship: addRelationship || undefined,
      });
      setShowAddForm(false);
      setAddPhone("");
      setAddNickname("");
      setAddRelationship("");
      toast.show("Family member added!", "success");
      load();
    } catch (e: unknown) {
      const message = typeof e === "object" && e && "message" in e ? (e as any).message : undefined;
      toast.show(message || "Failed to add family member", "error");
    }
  }

  const greeting = profile.firstName
    ? `Welcome, ${profile.firstName}`
    : "Welcome!";

  const relationshipLabels: Record<string, string> = {
    parent: "Manman/Papa",
    child: "Pitit",
    sibling: "Frè/Sè",
    spouse: "Mari/Madanm",
    cousin: "Kouzen/Kouzin",
    other: "Fanmi",
  };

  const FAMILY_EMOJIS: Record<string, string> = {
    parent: "👩",
    child: "👧",
    sibling: "🧑",
    spouse: "💑",
    cousin: "🤝",
    other: "👤",
  };

  // Sort: favorites first, then alphabetical
  const sortedFamily = [...family].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    const nameA = a.nickname || a.familyUser.firstName || "";
    const nameB = b.nickname || b.familyUser.firstName || "";
    return nameA.localeCompare(nameB);
  });

  async function handleToggleFavorite(member: FamilyMember) {
    try {
      await kkPatch(`v1/family/${member.id}`, {
        isFavorite: !member.isFavorite,
      });
      setFamily((prev) =>
        prev.map((m) =>
          m.id === member.id ? { ...m, isFavorite: !m.isFavorite } : m
        )
      );
      toast.show(
        member.isFavorite ? "Removed from favorites" : "Added to favorites!",
        "success"
      );
    } catch (e: unknown) {
      const message = typeof e === "object" && e && "message" in e ? (e as any).message : undefined;
      toast.show(message || "Failed to update", "error");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Globe className="h-3 w-3" /> KobKlein Diaspora
        </div>
        <div className="text-xl font-semibold">{greeting}</div>
        {/* Plan & KYC Badges */}
        <div className="flex items-center gap-1.5 mt-1">
          {profile.planName ? (
            <Badge variant="default" className="text-[10px] gap-0.5">
              <Crown className="h-2.5 w-2.5" />
              {profile.planName}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px]">Free</Badge>
          )}
          {profile.kycTier >= 2 ? (
            <Badge variant="success" className="text-[10px] gap-0.5">
              <CheckCircle2 className="h-2.5 w-2.5" />
              Verified
            </Badge>
          ) : profile.kycTier === 1 ? (
            <Badge variant="warning" className="text-[10px]">KYC Pending</Badge>
          ) : (
            <Badge variant="destructive" className="text-[10px]">Unverified</Badge>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 md:grid-cols-3 gap-3 md:gap-4">
        <Card className="rounded-2xl">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold">
              {dashboard ? dashboard.balance.toLocaleString() : "-"}
            </div>
            <div className="text-[10px] text-muted-foreground">Balance HTG</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold">
              {dashboard ? dashboard.familyCount : "-"}
            </div>
            <div className="text-[10px] text-muted-foreground">K-Link Family</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold">
              {dashboard
                ? dashboard.totalSentToFamily.toLocaleString()
                : "-"}
            </div>
            <div className="text-[10px] text-muted-foreground">Total Sent</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests from Family */}
      {dashboard && dashboard.pendingRequests.length > 0 && (
        <Card className="rounded-2xl border-warning/30 bg-warning/5">
          <CardContent className="p-4">
            <div className="text-sm font-semibold mb-2">
              Family Requests ({dashboard.pendingRequests.length})
            </div>
            {dashboard.pendingRequests.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between py-1.5 text-sm"
              >
                <span>{r.requester.firstName || "Family"} requests</span>
                <span className="font-bold">{Number(r.amount).toLocaleString()} HTG</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* K-Link Family Panel */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" /> K-Link Family
          </h2>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-xs text-primary font-medium flex items-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>

        {/* Add Family Form */}
        {showAddForm && (
          <Card className="rounded-2xl mb-3">
            <CardContent className="p-4 space-y-3">
              <input
                placeholder="Phone or K-Tag"
                value={addPhone}
                onChange={(e) => setAddPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              />
              <input
                placeholder="Nickname (e.g., Manman)"
                value={addNickname}
                onChange={(e) => setAddNickname(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              />
              <select
                value={addRelationship}
                onChange={(e) => setAddRelationship(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                title="Select relationship"
              >
                <option value="">Relationship</option>
                <option value="parent">Parent</option>
                <option value="child">Child</option>
                <option value="sibling">Sibling</option>
                <option value="spouse">Spouse</option>
                <option value="cousin">Cousin</option>
                <option value="other">Other</option>
              </select>
              <button
                type="button"
                onClick={handleAddFamily}
                className="w-full py-2 rounded-lg bg-primary text-white text-sm font-medium"
              >
                Add to K-Link
              </button>
            </CardContent>
          </Card>
        )}

        {/* Family Members */}
        {family.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="p-8 text-center text-muted-foreground">
              <Users className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <div className="text-sm">No family members linked yet</div>
              <div className="text-xs mt-1">
                Add your family in Haiti for easy K-Pay transfers
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {sortedFamily.map((member) => (
              <Card key={member.id} className="rounded-xl">
                <CardContent className="p-3 flex items-center gap-2">
                  {/* Emoji Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-lg">
                    {FAMILY_EMOJIS[member.relationship || "other"] || "👤"}
                  </div>
                  {/* Star Toggle */}
                  <button
                    type="button"
                    title={member.isFavorite ? "Remove from favorites" : "Add to favorites"}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(member);
                    }}
                    className="shrink-0"
                  >
                    <Star
                      className={`h-4 w-4 ${
                        member.isFavorite
                          ? "text-[#C9A84C] fill-[#C9A84C]"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {member.nickname ||
                          member.familyUser.firstName ||
                          "Family"}
                      </span>
                      {member.relationship && (
                        <span className="text-[10px] px-1.5 py-0 rounded-full bg-primary/10 text-primary">
                          {relationshipLabels[member.relationship] ||
                            member.relationship}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {member.familyUser.handle
                        ? `@${member.familyUser.handle}`
                        : member.familyUser.phone || ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    title="Send money"
                    onClick={() =>
                      router.push(
                        `/send?recipientId=${member.familyUser.id}&name=${encodeURIComponent(
                          member.nickname || member.familyUser.firstName || "Family"
                        )}`
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium shrink-0"
                  >
                    <Send className="h-3 w-3 inline mr-1" />
                    Send
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* KYC Banner */}
      {profile.kycTier < 2 && (
        <button type="button" onClick={() => router.push("/verify")} className="w-full text-left">
          <Card className="rounded-2xl border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-semibold">
                  {profile.kycTier === 0 ? "Verify Your Identity" : "Complete Full Verification"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Unlock higher remittance limits
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-primary shrink-0" />
            </CardContent>
          </Card>
        </button>
      )}

      {/* Plan Upgrade Banner */}
      {!profile.planSlug && (
        <button type="button" onClick={() => router.push("/settings/plan")} className="w-full text-left">
          <Card className="rounded-2xl border-[#C9A84C]/30 bg-[#C9A84C]/5">
            <CardContent className="p-4 flex items-center gap-3">
              <Crown className="h-8 w-8 text-[#C9A84C] shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-semibold">Diaspora Plus</div>
                <div className="text-xs text-muted-foreground">
                  Lower FX fees, priority support & more
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-[#C9A84C] shrink-0" />
            </CardContent>
          </Card>
        </button>
      )}

      {/* Quick Nav */}
      <div className="space-y-2">
        {[
          { label: "K-Pay Send", sub: "Send to anyone instantly", href: "/send", icon: Send },
          { label: "Scheduled Transfers", sub: "Recurring family remittances", href: "/recurring", icon: Calendar },
          { label: "Wallet", sub: "Balance & history", href: "/wallet", icon: Wallet },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:bg-secondary transition-colors"
          >
            <item.icon className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <div className="font-medium text-sm">{item.label}</div>
              <div className="text-xs text-muted-foreground">{item.sub}</div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </a>
        ))}
      </div>
    </div>
  );
}
