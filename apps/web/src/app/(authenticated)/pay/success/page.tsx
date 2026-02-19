"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@kobklein/ui/card";

function ReceiptContent() {
  const params = useSearchParams();

  const merchant = params.get("merchant");
  const amount = params.get("amount");
  const fee = params.get("fee");
  const tx = params.get("tx");
  const time = params.get("time");

  function row(label: string, value: any) {
    return (
      <div className="flex justify-between text-sm">
        <div className="text-muted-foreground">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Card className="rounded-2xl">
        <CardContent className="p-6 space-y-4">
          <div className="text-center text-green-600 text-xl font-semibold">
            Payment Successful
          </div>

          {row("Merchant", merchant)}
          {row("Amount", amount)}
          {row("Fee", fee)}
          {row("Transaction ID", tx)}
          {row("Time", time)}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReceiptPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReceiptContent />
    </Suspense>
  );
}