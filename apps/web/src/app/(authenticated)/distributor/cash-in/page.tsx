"use client";

import { useState } from "react";
import { kkPost } from "@/lib/kobklein-api";
import { Card, CardContent } from "@kobklein/ui/card";
import { Button } from "@kobklein/ui/button";
import { Input } from "@kobklein/ui/input";
import { ArrowLeft, Check } from "lucide-react";
import { useRouter } from "next/navigation";

type CashInState = "form" | "confirming" | "processing" | "success";

export default function CashInPage() {
  const router = useRouter();
  const [state, setState] = useState<CashInState>("form");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [receipt, setReceipt] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setState("processing");
    setError(null);

    try {
      const result = await kkPost("v1/distributor/cash-in", {
        customerPhone: phone,
        amount: Number(amount),
        currency: "HTG",
        idempotencyKey: crypto.randomUUID(),
      });

      setReceipt(result);
      setState("success");
    } catch (e: any) {
      setError(e.message || "Cash-in failed");
      setState("confirming");
    }
  }

  if (state === "success") {
    return (
      <div className="space-y-6">
        <div className="text-2xl font-semibold text-center">Cash-In Complete</div>
        <Card className="rounded-2xl">
          <CardContent className="p-6 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-success" />
            </div>
            <div className="text-3xl font-bold">
              {Number(amount).toLocaleString()} HTG
            </div>
            <div className="text-sm text-muted-foreground">credited to</div>
            <div className="text-lg font-medium">{phone}</div>
            {receipt?.commission > 0 && (
              <div className="text-xs text-success">
                Commission earned: {receipt.commission} HTG
              </div>
            )}
            <Button onClick={() => { setState("form"); setPhone(""); setAmount(""); }} className="w-full mt-4">
              New Cash-In
            </Button>
            <Button variant="outline" onClick={() => router.push("/")} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === "confirming" || state === "processing") {
    return (
      <div className="space-y-6">
        <div className="text-2xl font-semibold">Confirm Cash-In</div>
        <Card className="rounded-2xl">
          <CardContent className="p-6 space-y-4">
            <div className="text-center space-y-1">
              <div className="text-sm text-muted-foreground">Credit wallet of</div>
              <div className="text-lg font-semibold">{phone}</div>
            </div>
            <div className="text-center py-4">
              <div className="text-sm text-muted-foreground">Amount</div>
              <div className="text-3xl font-bold">{Number(amount).toLocaleString()} HTG</div>
            </div>
            <div className="text-xs text-muted-foreground text-center">
              This will debit your float and credit the customer's wallet.
            </div>
            {error && <div className="text-sm text-red-600 text-center">{error}</div>}
            <Button onClick={handleConfirm} disabled={state === "processing"} className="w-full">
              {state === "processing" ? "Processing..." : "Confirm Cash-In"}
            </Button>
            <Button variant="outline" onClick={() => setState("form")} disabled={state === "processing"} className="w-full">
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => router.push("/")}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="text-2xl font-semibold">Cash-In</div>
      </div>
      <Card className="rounded-2xl">
        <CardContent className="p-4 space-y-4">
          <div className="text-sm text-muted-foreground">
            Customer gives you cash. You credit their KobKlein wallet.
          </div>
          <Input
            placeholder="Customer phone number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            placeholder="Amount (HTG)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {error && <div className="text-sm text-red-600">{error}</div>}
          <Button
            onClick={() => {
              if (!phone || !amount) {
                setError("Phone and amount are required");
                return;
              }
              setError(null);
              setState("confirming");
            }}
            className="w-full"
          >
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
