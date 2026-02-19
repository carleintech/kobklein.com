"use client";

import { useState } from "react";
import { kkPost } from "@/lib/kobklein-api";
import { Card, CardContent } from "@kobklein/ui/card";
import { Input } from "@kobklein/ui/input";
import { Button } from "@kobklein/ui/button";

export default function FloatRefillPage() {
  const [id, setId] = useState("");
  const [amount, setAmount] = useState("");

  async function refill() {
    await kkPost("admin/float/refill", {
      distributorId: id,
      amount: Number(amount),
      currency: "HTG",
    });

    alert("Float added");
  }

  return (
    <div className="space-y-6">
      <div className="text-2xl font-semibold">Distributor Float Refill</div>

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

          <Button onClick={refill}>Add Float</Button>
        </CardContent>
      </Card>
    </div>
  );
}