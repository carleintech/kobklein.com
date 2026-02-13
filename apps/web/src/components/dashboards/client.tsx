"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpRight,
  ArrowDownLeft,
  QrCode,
  Send,
  CreditCard,
  Shield,
  Bell,
  Wallet,
  Crown,
  CheckCircle2,
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

type BalanceInfo = {
  totalBalance: number;
  availableBalance: number;
  heldBalance: number;
};

export function ClientDashboard({ profile }: Props) {
  const router = useRouter();
  const [balance, setBalance] = useState<BalanceInfo | null>(null);
  const [notifCount, setNotifCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await apiGet<any>("wallet/balance");
      setBalance(res);
    } catch {}
    try {
      const res = await apiGet<{ unread: number }>("notifications/count");
      setNotifCount(res.unread);
    } catch {}
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const greeting = profile.firstName
    ? `Bonjou, ${profile.firstName}`
    : "Bonjou!";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="text-sm text-muted-foreground">KobKlein</div>
          <div className="text-xl font-semibold">{greeting}</div>
          {profile.handle && (
            <div className="text-xs text-primary font-medium">
              <span className="inline-flex items-center gap-0.5">
                <span className="w-3 h-3 rounded bg-primary text-white text-[8px] font-bold flex items-center justify-center">K</span>
                @{profile.handle}
              </span>
            </div>
          )}
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
        <button type="button" className="relative" onClick={() => router.push("/notifications")}>
          <Bell className="h-5 w-5 text-muted-foreground" />
          {notifCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] px-1 rounded-full">
              {notifCount}
            </span>
          )}
        </button>
      </div>

      {/* Balance Card */}
      <Card className="rounded-3xl">
        <CardContent className="p-6 text-center space-y-2">
          <div className="text-xs text-muted-foreground">Total Balance</div>
          <div className="text-4xl font-bold">
            {balance
              ? Number(balance.totalBalance).toLocaleString("fr-HT", { minimumFractionDigits: 2 })
              : "-"}{" "}
            HTG
          </div>
          {balance && balance.heldBalance > 0 && (
            <>
              <div className="text-sm text-muted-foreground">
                Available:{" "}
                {Number(balance.availableBalance).toLocaleString("fr-HT", { minimumFractionDigits: 2 })}{" "}
                HTG
              </div>
              <div className="text-xs text-orange-500">
                Some funds are temporarily on hold
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: Send, label: "K-Pay", href: "/send", color: "bg-primary" },
          { icon: ArrowDownLeft, label: "Receive", href: "/wallet", color: "bg-success/20" },
          { icon: QrCode, label: "K-Scan", href: "/pay", color: "bg-warning/20" },
          { icon: CreditCard, label: "K-Card", href: "/card", color: "bg-purple-500/20" },
        ].map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => router.push(action.href)}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-card hover:bg-secondary transition"
          >
            <div className={`w-10 h-10 rounded-full ${action.color} flex items-center justify-center`}>
              <action.icon className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xs font-medium">{action.label}</span>
          </button>
        ))}
      </div>

      {/* KYC Banner */}
      {profile.kycTier < 2 && (
        <button type="button" onClick={() => router.push("/verify")} className="w-full text-left">
          <Card className="rounded-2xl border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-semibold">
                  {profile.kycTier === 0
                    ? "Verify Your Identity"
                    : "Complete Full Verification"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {profile.kycTier === 0
                    ? "Unlock higher limits and K-Card access"
                    : "Submit your ID to unlock K-Card and higher limits"}
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
          <Card className="rounded-2xl border-[#C6A756]/30 bg-[#C6A756]/5">
            <CardContent className="p-4 flex items-center gap-3">
              <Crown className="h-8 w-8 text-[#C6A756] shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-semibold">Upgrade Your Plan</div>
                <div className="text-xs text-muted-foreground">
                  Get lower fees, higher limits & premium features
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-[#C6A756] shrink-0" />
            </CardContent>
          </Card>
        </button>
      )}

      {/* Navigation */}
      <div className="space-y-2">
        {[
          { label: "Wallet & History", sub: "Balance, transactions, holds", href: "/wallet", icon: Wallet },
          { label: "K-Card", sub: "Manage your card & settings", href: "/card", icon: CreditCard },
          { label: "Send Money", sub: "K-Pay instant transfer", href: "/send", icon: Send },
          { label: "Pay Merchant", sub: "Scan & pay businesses", href: "/pay", icon: QrCode },
          { label: "Security", sub: "Lock account, devices", href: "/settings/security", icon: Shield },
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
