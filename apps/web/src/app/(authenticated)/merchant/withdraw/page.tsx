"use client";

import { useState } from "react";
import { kkPost } from "@/lib/kobklein-api";
import { Card, CardContent } from "@kobklein/ui/card";
import { Input } from "@kobklein/ui/input";
import { Button } from "@kobklein/ui/button";

export default function MerchantWithdrawPage() {
  const [amount, setAmount] = useState("");
  const [code, setCode] = useState("");

  async function request() {
    const res = await kkPost("merchant/withdraw", {
      amount: Number(amount),
      currency: "HTG",
    }) as { code: string };

    setCode(res.code);
  }

  return (
    <div className="space-y-6">
      <div className="text-2xl font-semibold">Merchant Cash Out</div>

      <Card className="rounded-2xl">
        <CardContent className="p-4 space-y-4">
          <Input
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <Button onClick={request}>Generate Cash-Out Code</Button>

          {code && (
            <div className="text-xl font-mono">
              Cash-Out Code: {code}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}