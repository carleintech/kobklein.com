"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@kobklein/ui/card";
import { Badge } from "@kobklein/ui/badge";

type FxPreviewData = {
  baseRate?: number;
  appliedRate?: number;
  spread?: number;
  platformFee?: number;
  distributorFee?: number;
  networkFee?: number;
  totalFees?: number;
  totalDebit?: number;
  recipientAmount?: number;
  fromCurrency?: string;
  toCurrency?: string;
  rateLockExpiresAt?: string;
  // Simpler format fallback
  fxRate?: number;
  fee?: number;
};

type Props = {
  data: FxPreviewData | null;
  loading?: boolean;
};

export default function FxPreviewCard({ data, loading }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Rate lock countdown
  useEffect(() => {
    if (!data?.rateLockExpiresAt) {
      setSecondsLeft(0);
      return;
    }

    const expiry = new Date(data.rateLockExpiresAt).getTime();

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expiry - now) / 1000));
      setSecondsLeft(diff);
      if (diff <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [data?.rateLockExpiresAt]);

  if (!data && !loading) return null;

  if (loading) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">
            Calculating...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const fromCcy = data.fromCurrency || "HTG";
  const toCcy = data.toCurrency || "HTG";
  const isCrossCurrency = fromCcy !== toCcy;
  const rate = data.appliedRate || data.fxRate;
  const rateExpired = data.rateLockExpiresAt && secondsLeft <= 0;

  function fmt(n: number | undefined, ccy?: string) {
    if (n === undefined || n === null) return "-";
    const formatted = Number(n).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return ccy ? `${formatted} ${ccy}` : formatted;
  }

  return (
    <Card className="rounded-2xl border-white/10">
      <CardContent className="p-4 space-y-3">
        {/* Rate Lock Timer */}
        {data.rateLockExpiresAt && (
          <div
            className={`text-xs text-center py-1.5 px-3 rounded-lg ${
              rateExpired
                ? "bg-red-500/10 text-red-400"
                : secondsLeft <= 15
                  ? "bg-amber-500/10 text-amber-400"
                  : "bg-primary/10 text-primary"
            }`}
          >
            {rateExpired
              ? "Rate expired — tap Preview to refresh"
              : `Rate locked for ${secondsLeft}s`}
          </div>
        )}

        <div className="text-sm font-semibold">Transfer Breakdown</div>

        {/* FX Rate Section */}
        {isCrossCurrency && rate && (
          <div className="space-y-1 text-sm">
            {data.baseRate && (
              <div className="flex justify-between text-muted-foreground">
                <span>Mid-market rate</span>
                <span>1 {fromCcy} = {fmt(data.baseRate)} {toCcy}</span>
              </div>
            )}
            {data.spread !== undefined && data.spread > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>FX margin</span>
                <span>+{fmt(data.spread)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium">
              <span>Applied rate</span>
              <span>1 {fromCcy} = {fmt(rate)} {toCcy}</span>
            </div>
          </div>
        )}

        {/* Fees Section */}
        <div className="border-t border-white/5 pt-2 space-y-1 text-sm">
          {data.platformFee !== undefined && (
            <div className="flex justify-between text-muted-foreground">
              <span>Platform fee</span>
              <span>{fmt(data.platformFee, fromCcy)}</span>
            </div>
          )}
          {data.distributorFee !== undefined && data.distributorFee > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Agent fee</span>
              <span>{fmt(data.distributorFee, fromCcy)}</span>
            </div>
          )}
          {data.networkFee !== undefined && data.networkFee > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Network fee</span>
              <span>{fmt(data.networkFee, fromCcy)}</span>
            </div>
          )}
          {/* Simple fee fallback */}
          {data.fee !== undefined && data.totalFees === undefined && (
            <div className="flex justify-between text-muted-foreground">
              <span>Fee</span>
              <span>{fmt(data.fee, fromCcy)}</span>
            </div>
          )}
          {data.totalFees !== undefined && (
            <div className="flex justify-between font-medium">
              <span>Total fees</span>
              <span>{fmt(data.totalFees, fromCcy)}</span>
            </div>
          )}
        </div>

        {/* Summary Section */}
        <div className="border-t border-white/5 pt-3 space-y-2">
          <div className="flex justify-between text-sm font-semibold">
            <span>You pay</span>
            <span className="text-base">
              {fmt(data.totalDebit, fromCcy)}
            </span>
          </div>
          <div className="flex justify-between text-sm font-semibold text-primary">
            <span>Recipient gets</span>
            <span className="text-base">
              {fmt(data.recipientAmount, toCcy)}
            </span>
          </div>
        </div>

        {/* Transparency Note */}
        <p className="text-[10px] text-muted-foreground pt-1">
          Fees support infrastructure, security, and liquidity in Haiti.
        </p>
      </CardContent>
    </Card>
  );
}
