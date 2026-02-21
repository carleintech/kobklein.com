"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Bot, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { kkGet } from "@/lib/kobklein-api";

type Withdrawal = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  user?: { firstName?: string; lastName?: string };
};

type RecentWithdrawalsResp = { items?: Withdrawal[]; data?: Withdrawal[] };

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

type KleinSuggestion = { icon: React.ReactNode; text: string; severity: "warn" | "info" | "ok" };

function KleinAssist({ openCases, stuckEvents, pendingWithdrawals }: { openCases: number; stuckEvents: number; pendingWithdrawals: number }) {
  const suggestions: KleinSuggestion[] = [];

  if (stuckEvents > 0) {
    suggestions.push({
      icon: <AlertTriangle className="h-3.5 w-3.5 text-kob-gold shrink-0 mt-0.5" />,
      text: `${stuckEvents} domain event${stuckEvents > 1 ? "s" : ""} stuck >5 min — check event worker`,
      severity: "warn",
    });
  }
  if (openCases > 3) {
    suggestions.push({
      icon: <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />,
      text: `${openCases} open compliance cases — review queue requires attention`,
      severity: "warn",
    });
  }
  if (pendingWithdrawals > 10) {
    suggestions.push({
      icon: <Clock className="h-3.5 w-3.5 text-kob-gold shrink-0 mt-0.5" />,
      text: `${pendingWithdrawals} withdrawals pending — consider batch processing`,
      severity: "warn",
    });
  }
  if (suggestions.length === 0) {
    suggestions.push({
      icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />,
      text: "All systems nominal — no immediate action required",
      severity: "ok",
    });
  }

  return (
    <div className="rounded-2xl border border-kob-gold/20 bg-kob-gold/5 p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-kob-gold/15 border border-kob-gold/25 flex items-center justify-center shrink-0">
          <Bot className="h-3.5 w-3.5 text-kob-gold" />
        </div>
        <div>
          <p className="text-xs font-semibold text-kob-gold">Klein Assist</p>
          <p className="text-[10px] text-kob-muted">AI-powered ops intelligence</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {suggestions.map((s, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static list
          <div key={i} className="flex gap-2 items-start">
            {s.icon}
            <p className="text-xs text-kob-body leading-snug">{s.text}</p>
          </div>
        ))}
      </div>

      <Link
        href="/cases"
        className="flex items-center justify-center gap-1.5 mt-1 py-2 rounded-lg bg-kob-gold/10 border border-kob-gold/20 text-xs font-medium text-kob-gold hover:bg-kob-gold/20 transition-colors"
      >
        Open Review Queue
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

type Props = {
  overview: Record<string, unknown> | null;
};

export function SystemManagement({ overview }: Props) {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  useEffect(() => {
    kkGet<RecentWithdrawalsResp>("v1/admin/withdrawals?limit=5&status=pending")
      .then((d) => setWithdrawals(d?.items ?? d?.data ?? []))
      .catch(() => null);
  }, []);

  const openCases = (overview?.openCases as number) ?? 0;
  const stuckEvents = (overview?.stuckEvents as number) ?? 0;
  const pendingWithdrawals = (overview?.pendingWithdrawals as number) ?? 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Recent pending withdrawals */}
      <div className="rounded-2xl border border-white/8 bg-[#080E20] p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-kob-muted uppercase tracking-widest">Pending Withdrawals</p>
          <Link
            href="/treasury"
            className="flex items-center gap-1 text-[10px] text-kob-muted hover:text-kob-gold transition-colors"
          >
            View all <ExternalLink className="h-2.5 w-2.5" />
          </Link>
        </div>

        {withdrawals.length === 0 ? (
          <div className="text-center py-6 text-xs text-kob-muted">
            {pendingWithdrawals === 0 ? "No pending withdrawals" : `${pendingWithdrawals} pending — loading…`}
          </div>
        ) : (
          <div className="space-y-2">
            {withdrawals.map((w) => {
              const name = [w.user?.firstName, w.user?.lastName].filter(Boolean).join(" ") || "Unknown";
              return (
                <div key={w.id} className="flex items-center justify-between py-2 border-b border-white/4 last:border-0">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-kob-text truncate">{name}</p>
                    <p className="text-[10px] text-kob-muted">{timeAgo(w.createdAt)}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-xs font-semibold text-kob-text tabular-nums">{fmt(w.amount)} HTG</p>
                    <span className="text-[10px] text-kob-gold font-medium uppercase">Pending</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Klein Assist panel */}
      <KleinAssist openCases={openCases} stuckEvents={stuckEvents} pendingWithdrawals={pendingWithdrawals} />
    </div>
  );
}
