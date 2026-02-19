"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { kkGet, kkPost } from "@/lib/kobklein-api";
import { Card, CardContent } from "@kobklein/ui/card";
import { Button } from "@kobklein/ui/button";
import { Badge } from "@kobklein/ui/badge";
import { useToast } from "@kobklein/ui";
import {
  ArrowLeft,
  Check,
  Crown,
  Loader2,
  Star,
  Zap,
} from "lucide-react";

type PlanOption = {
  slug: string;
  nameEn: string;
  descEn?: string;
  priceUsd: number;
  tier: number;
  features: Record<string, any> | null;
  interval: string;
};

type CurrentPlan = {
  plan: {
    slug: string;
    name: string;
    tier: number;
    role: string;
  };
  status: string;
} | null;

const FEATURE_LABELS: Record<string, string> = {
  fxDiscount: "FX Fee Discount",
  feeDiscount: "Platform Fee Discount",
  monthlyTransferLimit: "Monthly Transfer Limit",
  commissionBonus: "Commission Bonus",
  prioritySupport: "Priority Support",
  virtualCard: "Virtual Card",
  scheduledTransfers: "Scheduled Transfers",
  familySlots: "K-Link Family Slots",
  apiAccess: "API Access",
  posDevices: "POS Devices",
  subAgents: "Sub-Agents",
  whiteLabel: "White-Label",
};

function formatFeatureValue(key: string, value: any): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (key.includes("Discount") || key.includes("Bonus")) return `${value}%`;
  if (key.includes("Limit")) return `$${Number(value).toLocaleString()}`;
  if (typeof value === "number") return value.toString();
  return String(value);
}

export default function PlanPage() {
  const router = useRouter();
  const toast = useToast();
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [currentPlan, setCurrentPlan] = useState<CurrentPlan>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const [planList, current] = await Promise.all([
          kkGet<PlanOption[]>("v1/billing/plans"),
          kkGet<CurrentPlan>("v1/billing/my-plan").catch(() => null),
        ]);
        setPlans(planList);
        setCurrentPlan(current);
      } catch (e: any) {
        toast.show("Failed to load plans", "error");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function handleSelectPlan(slug: string) {
    setCheckoutLoading(slug);
    try {
      const result = await kkPost<{ url: string }>("v1/billing/checkout", {
        planSlug: slug,
        successUrl: `${window.location.origin}/settings/plan?success=true`,
        cancelUrl: `${window.location.origin}/settings/plan`,
      });
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (e: any) {
      toast.show(e.message || "Failed to start checkout", "error");
      setCheckoutLoading(null);
    }
  }

  async function handleManageSubscription() {
    try {
      const result = await kkPost<{ url: string }>("v1/billing/portal", {
        returnUrl: window.location.href,
      });
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (e: any) {
      toast.show(e.message || "Failed to open billing portal", "error");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check for success redirect
  const isSuccess =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("success") === "true";

  const activePlanSlug = currentPlan?.plan?.slug;

  // Sort plans by tier
  const sortedPlans = [...plans].sort((a, b) => a.tier - b.tier);

  const tierIcons = [null, Zap, Star, Crown];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <div>
          <div className="text-2xl font-semibold">Choose Your Plan</div>
          <div className="text-sm text-muted-foreground">
            Unlock premium features and lower fees
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {isSuccess && (
        <Card className="rounded-2xl border-success/30 bg-success/5">
          <CardContent className="p-4 text-center space-y-1">
            <Check className="h-6 w-6 text-success mx-auto" />
            <div className="text-sm font-semibold">Subscription Activated!</div>
            <div className="text-xs text-muted-foreground">
              Your premium features are now active.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Plan */}
      {currentPlan && (
        <Card className="rounded-2xl border-primary/30">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Current Plan</div>
                <div className="text-lg font-semibold flex items-center gap-1.5">
                  <Crown className="h-4 w-4 text-[#C9A84C]" />
                  {currentPlan.plan.name}
                </div>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
            <Button
              variant="outline"
              onClick={handleManageSubscription}
              className="w-full"
            >
              Manage Subscription
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Plan Cards */}
      <div className="space-y-4">
        {sortedPlans.map((plan) => {
          const isActive = plan.slug === activePlanSlug;
          const isFree = Number(plan.priceUsd) === 0;
          const TierIcon = tierIcons[Math.min(plan.tier, tierIcons.length - 1)];
          const features = plan.features || {};

          return (
            <Card
              key={plan.slug}
              className={`rounded-2xl transition ${
                isActive
                  ? "border-primary ring-1 ring-primary/20"
                  : plan.tier >= 2
                    ? "border-[#C9A84C]/30"
                    : ""
              }`}
            >
              <CardContent className="p-5 space-y-4">
                {/* Plan Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {TierIcon && (
                        <TierIcon
                          className={`h-5 w-5 ${
                            plan.tier >= 2 ? "text-[#C9A84C]" : "text-primary"
                          }`}
                        />
                      )}
                      <span className="text-lg font-semibold">{plan.nameEn}</span>
                    </div>
                    {plan.descEn && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {plan.descEn}
                      </div>
                    )}
                  </div>
                  {isActive && <Badge variant="success">Current</Badge>}
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">
                    {isFree ? "Free" : `$${Number(plan.priceUsd).toFixed(2)}`}
                  </span>
                  {!isFree && (
                    <span className="text-sm text-muted-foreground">
                      /{plan.interval === "yearly" ? "year" : "mo"}
                    </span>
                  )}
                </div>

                {/* Features */}
                {Object.keys(features).length > 0 && (
                  <div className="space-y-1.5">
                    {Object.entries(features).map(([key, value]) => {
                      if (value === false || value === 0 || value === null) return null;
                      return (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          <Check className="h-3.5 w-3.5 text-success shrink-0" />
                          <span className="text-muted-foreground">
                            {FEATURE_LABELS[key] || key}
                          </span>
                          {typeof value !== "boolean" && (
                            <span className="ml-auto font-medium text-xs">
                              {formatFeatureValue(key, value)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Action Button */}
                {!isActive && !isFree && (
                  <Button
                    onClick={() => handleSelectPlan(plan.slug)}
                    disabled={checkoutLoading === plan.slug}
                    className={`w-full ${
                      plan.tier >= 2
                        ? "bg-[#C9A84C] hover:bg-[#A07E2E] text-white"
                        : ""
                    }`}
                  >
                    {checkoutLoading === plan.slug ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Crown className="h-4 w-4 mr-2" />
                        {currentPlan ? "Switch to " : "Upgrade to "}
                        {plan.nameEn}
                      </>
                    )}
                  </Button>
                )}

                {isActive && (
                  <div className="text-center text-xs text-muted-foreground">
                    This is your active plan
                  </div>
                )}

                {isFree && !isActive && !currentPlan && (
                  <div className="text-center text-xs text-muted-foreground">
                    Your current tier
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FAQ / Info */}
      <Card className="rounded-2xl">
        <CardContent className="p-4 space-y-2">
          <div className="text-sm font-semibold">How it works</div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Plans are billed monthly via Stripe secure checkout</p>
            <p>• You can upgrade, downgrade, or cancel anytime</p>
            <p>• Features activate immediately after payment</p>
            <p>• All plans include the base free tier features</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
