"use client";

import { useState } from "react";
import { kkPost } from "@/lib/kobklein-api";
import { Card, CardContent } from "@kobklein/ui/card";
import { Input } from "@kobklein/ui/input";
import { Button } from "@kobklein/ui/button";

export default function DistributorTransferPage() {
  const [id, setId] = useState("");
  const [amount, setAmount] = useState("");

  async function send() {
    await kkPost("distributor/float-transfer", {
      toDistributorId: id,
      amount: Number(amount),
      currency: "HTG",
    });

    alert("Float transferred");
  }

  return (
    <div className="space-y-6">
      <div className="text-2xl font-semibold">Send Float</div>

      <Card className="rounded-2xl">
        <CardContent className="p-4 space-y-4">
          <Input
            placeholder="Distributor ID"
            value={id}
            onChange={(e) => setId(e.target.value)}
          />

          <Input
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <Button onClick={send}>Transfer Float</Button>
        </CardContent>
      </Card>
    </div>
  );
}