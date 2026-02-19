"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";
import { kkPost } from "@/lib/kobklein-api";
import { Card, CardContent } from "@kobklein/ui/card";
import { Badge } from "@kobklein/ui/badge";
import { useToast } from "@kobklein/ui";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  RefreshCw,
  Wallet,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────

type TimelineItem = {
  id: string;
  type: "deposit" | "transfer_sent" | "transfer_received" | "withdrawal";
  amount: number;
  currency: string;
  detail: string;
  createdAt: string;
};

type BalanceInfo = {
  walletId: string;
  currency: string;
  type: string;
  balance: number;
};

// ─── Helpers ───────────────────────────────────────────────────

function fmtHTG(amount: number | string) {
  const n = Number(amount);
  const abs = Math.abs(n);
  return `${abs.toLocaleString("fr-HT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} HTG`;
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 172800) return "Yesterday";
  return new Date(d).toLocaleDateString("fr-HT", { day: "numeric", month: "short" });
}

const typeConfig: Record<
  string,
  { label: string; labelKr: string; icon: typeof ArrowDownLeft; color: string; sign: "+" | "-" }
> = {
  deposit: {
    label: "Deposit",
    labelKr: "Depozit",
    icon: ArrowDownLeft,
    color: "text-success",
    sign: "+",
  },
  transfer_sent: {
    label: "Sent",
    labelKr: "Voye",
    icon: ArrowUpRight,
    color: "text-destructive",
    sign: "-",
  },
  transfer_received: {
    label: "Received",
    labelKr: "Resevwa",
    icon: ArrowDownLeft,
    color: "text-success",
    sign: "+",
  },
  withdrawal: {
    label: "Cash-out",
    labelKr: "Retrè",
    icon: Banknote,
    color: "text-warning",
    sign: "-",
  },
};

// ─── Page ──────────────────────────────────────────────────────

export default function WalletPage() {
  const router = useRouter();
  const toast = useToast();
  const [balances, setBalances] = useState<BalanceInfo[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<any>(null);
  const [notifCount, setNotifCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch balances first to get the primary wallet ID
      const bal = await apiGet<{ balances: BalanceInfo[] }>("v1/wallets/balance");
      setBalances(bal.balances);

      const primary = bal.balances.find((b) => b.type === "USER") ?? bal.balances[0];
      if (primary) {
        setWalletId(primary.walletId);
        const items = await apiGet<TimelineItem[]>(
          `v1/wallets/${primary.walletId}/timeline?limit=50`,
        );
        setTimeline(items);
      }
    } catch (e) {
      console.error("Failed to load wallet:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBalance = useCallback(async () => {
    try {
      const res = await apiGet("v1/wallets/balance");
      setBalance(res);
    } catch (e) {
      console.error("Failed to load balance:", e);
    }
  }, []);

  const loadNotifCount = useCallback(async () => {
    try {
      const res = await apiGet<{ unread: number }>("v1/notifications/count");
      setNotifCount(res.unread);
    } catch (e) {
      console.error("Failed to load notification count:", e);
    }
  }, []);

  const lockAccount = async () => {
    try {
      await kkPost("v1/security/freeze", {});
      toast.show("Account locked successfully", "success");
    } catch (e) {
      console.error("Failed to lock account:", e);
      toast.show("Failed to lock account", "error");
    }
  };

  useEffect(() => {
    loadBalance();
    load(); // history
    loadNotifCount();
  }, [loadBalance, load, loadNotifCount]);

  const mainBalance = balances.find((b) => b.type === "USER");

  return (
    <div className="space-y-6">
      {/* Header with Bell */}
      <div className="flex justify-between items-center">
        <div className="text-2xl font-semibold">Wallet</div>

        <div
          className="relative cursor-pointer"
          onClick={() => router.push("/notifications")}
        >
          <span className="text-xl">🔔</span>

          {notifCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-1.5 rounded-full">
              {notifCount}
            </span>
          )}
        </div>
      </div>

      {/* Large Balance Card */}
      <Card className="rounded-3xl">
        <CardContent className="p-6 text-center space-y-2">
          <div className="text-xs text-muted-foreground">Total Balance</div>

          <div className="text-4xl font-bold">
            {balance?.totalBalance != null
              ? Number(balance.totalBalance).toLocaleString("fr-HT", { minimumFractionDigits: 2 })
              : balance?.balance ?? "-"} HTG
          </div>

          {balance?.heldBalance > 0 && (
            <div className="text-sm text-muted-foreground">
              Available: {Number(balance.availableBalance).toLocaleString("fr-HT", { minimumFractionDigits: 2 })} HTG
            </div>
          )}

          {balance?.heldBalance > 0 && (
            <div className="text-xs text-orange-500">
              Some funds are temporarily on hold
            </div>
          )}

          <div className="flex gap-2 justify-center pt-2">
            <button className="px-4 py-2 rounded-xl bg-black text-white">
              Send
            </button>
            <button className="px-4 py-2 rounded-xl border">
              Pay
            </button>
            <button className="px-4 py-2 rounded-xl border">
              Cash Out
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Lock Button */}
      <button
        className="w-full py-3 rounded-xl bg-red-600 text-white font-medium"
        onClick={lockAccount}
      >
        Lock My Account
      </button>

      {/* Activity Timeline */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Aktivite Resant
        </h2>

        {timeline.length === 0 && !loading && (
          <Card className="rounded-2xl">
            <CardContent className="p-8 text-center text-muted-foreground">
              <Wallet className="h-6 w-6 mx-auto mb-2 opacity-50" />
              Pa gen aktivite ankò
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          {timeline.map((item) => {
            const cfg = typeConfig[item.type] ?? typeConfig.deposit;
            const Icon = cfg.icon;
            const isPositive = cfg.sign === "+";

            return (
              <Card key={item.id} className="rounded-xl">
                <CardContent className="p-3 flex items-center gap-3">
                  {/* Icon */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      isPositive ? "bg-success/10" : "bg-destructive/10"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${cfg.color}`} />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{cfg.labelKr}</span>
                      <Badge
                        variant={isPositive ? "success" : "secondary"}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {cfg.label}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {item.detail}
                    </div>
                  </div>

                  {/* Amount + Time */}
                  <div className="text-right shrink-0">
                    <div className={`text-sm font-semibold tabular-nums ${cfg.color}`}>
                      {cfg.sign}{fmtHTG(item.amount)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {timeAgo(item.createdAt)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
