"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { kkGet, kkPost } from "@/lib/kobklein-api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function PayContent() {
  const params = useSearchParams();
  const merchantId = params.get("merchantId");
  const router = useRouter();

  const [code, setCode] = useState("");
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState<any>(null);

  async function load() {
    if (!merchantId) return;
    const res = await kkGet(`public/merchant/${merchantId}`) as { id: string; name: string; logo: string; verified: boolean };
    setMerchant(res);
  }

  useEffect(() => {
    load();
  }, [merchantId]);

  async function pay() {
    if (merchantId) {
      // QR payment
      const res = await kkPost("merchant/pay", {
        merchantId,
        amount: Number(amount),
        currency: "HTG",
      }) as { ok: boolean; receipt: { merchant: string; amount: number; fee: number; net: number; transactionId: string; createdAt: string } };

      router.push(
        `/pay/success?merchant=${encodeURIComponent(res.receipt.merchant)}&amount=${res.receipt.amount}&fee=${res.receipt.fee}&tx=${res.receipt.transactionId}&time=${encodeURIComponent(res.receipt.createdAt)}`
      );
    } else {
      // Code payment
      const res = await kkPost("merchant/pay", {
        code,
        amount: Number(amount),
        currency: "HTG",
      }) as { merchant: string };

      alert(`Paid ${res.merchant}`);
    }
  }

  if (merchantId && merchant) {
    // QR payment UI
    return (
      <div className="max-w-md mx-auto space-y-6">
        <Card className="rounded-2xl">
          <CardContent className="p-6 flex flex-col items-center gap-3">
            {merchant.logo && (
              <img src={merchant.logo} className="w-16 h-16 rounded-full" />
            )}

            <div className="text-lg font-semibold">{merchant.name}</div>

            {merchant.verified && (
              <div className="text-xs text-green-600">Verified Merchant</div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-4 space-y-3">
            <Input
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <Button className="w-full" onClick={pay}>
              Pay
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default code payment UI
  return (
    <div className="space-y-6">
      <div className="text-2xl font-semibold">Pay Merchant</div>

      <Card className="rounded-2xl">
        <CardContent className="p-4 space-y-4">
          <Input
            placeholder="Merchant Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />

          <Input
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <Button onClick={pay} className="w-full">
            Pay
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PayMerchantPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PayContent />
    </Suspense>
  );
}