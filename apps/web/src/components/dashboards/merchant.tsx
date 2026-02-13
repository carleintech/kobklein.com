"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowUpRight,
  Banknote,
  Bell,
  BarChart3,
  Monitor,
  QrCode,
  Store,
} from "lucide-react";

type Props = {
  profile: { id: string; firstName?: string; handle?: string; kycTier: number };
};

type MerchantStats = {
  todaySales: number;
  todayCount: number;
  weekSales: number;
  monthSales: number;
};

export function MerchantDashboard({ profile }: Props) {
  const router = useRouter();
  const [stats, setStats] = useState<MerchantStats | null>(null);
  const [balance, setBalance] = useState<any>(null);
  const [notifCount, setNotifCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const [s, b, n] = await Promise.all([
        apiGet<MerchantStats>("v1/merchant/stats").catch(() => null),
        apiGet<any>("wallet/balance").catch(() => null),
        apiGet<{ unread: number }>("notifications/count").catch(() => ({ unread: 0 })),
      ]);
      setStats(s);
      setBalance(b);
      setNotifCount(n.unread);
    } catch {}
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Store className="h-3 w-3" /> KobKlein Merchant
          </div>
          <div className="text-xl font-semibold">
            {profile.firstName || "Merchant"} Dashboard
          </div>
          {profile.handle && (
            <div className="text-xs text-primary font-medium">
              <span className="inline-flex items-center gap-0.5">
                <span className="w-3 h-3 rounded bg-primary text-white text-[8px] font-bold flex items-center justify-center">K</span>
                @{profile.handle}
              </span>
            </div>
          )}
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

      {/* Balance */}
      <Card className="rounded-3xl">
        <CardContent className="p-6 text-center space-y-1">
          <div className="text-xs text-muted-foreground">Merchant Balance</div>
          <div className="text-4xl font-bold">
            {balance?.totalBalance != null
              ? Number(balance.totalBalance).toLocaleString("fr-HT", { minimumFractionDigits: 2 })
              : "-"}{" "}
            HTG
          </div>
        </CardContent>
      </Card>

      {/* Today's Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Today Sales</div>
            <div className="text-2xl font-bold">
              {stats ? stats.todaySales.toLocaleString() : "-"}
            </div>
            <div className="text-xs text-muted-foreground">
              {stats ? `${stats.todayCount} transactions` : ""}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">This Week</div>
            <div className="text-2xl font-bold">
              {stats ? stats.weekSales.toLocaleString() : "-"}
            </div>
            <div className="text-xs text-muted-foreground">HTG total</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => router.push("/merchant/qr")}
          className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:bg-secondary transition"
        >
          <QrCode className="h-8 w-8 text-primary" />
          <span className="text-sm font-medium">K-Scan QR</span>
          <span className="text-[10px] text-muted-foreground">
            Show to customers
          </span>
        </button>
        <button
          type="button"
          onClick={() => router.push("/merchant/pos")}
          className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[#C6A756]/30 bg-card hover:bg-secondary transition"
        >
          <Monitor className="h-8 w-8 text-[#C6A756]" />
          <span className="text-sm font-medium">POS Terminal</span>
          <span className="text-[10px] text-muted-foreground">
            Full-screen mode
          </span>
        </button>
        <button
          type="button"
          onClick={() => router.push("/merchant/withdraw")}
          className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:bg-secondary transition"
        >
          <Banknote className="h-8 w-8 text-success" />
          <span className="text-sm font-medium">Cash Out</span>
          <span className="text-[10px] text-muted-foreground">
            Withdraw to agent
          </span>
        </button>
      </div>

      {/* Navigation */}
      <div className="space-y-2">
        {[
          { label: "Sales & History", sub: "All payment transactions", href: "/merchant", icon: BarChart3 },
          { label: "QR Code", sub: "K-Scan receive payment", href: "/merchant/qr", icon: QrCode },
          { label: "POS Terminal", sub: "Full-screen payment mode", href: "/merchant/pos", icon: Monitor },
          { label: "Withdraw", sub: "Cash-out via K-Agent", href: "/merchant/withdraw", icon: Banknote },
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
