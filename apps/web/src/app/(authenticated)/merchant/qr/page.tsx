"use client";

import { useEffect, useState } from "react";
import { kkGet } from "@/lib/kobklein-api";
import { Card, CardContent } from "@kobklein/ui/card";

export default function MerchantQR() {
  const [qr, setQr] = useState("");

  async function load() {
    const res = await kkGet("merchant/qr") as { qr: string };
    setQr(res.qr);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-2xl font-semibold">Your Payment QR</div>

      <Card className="rounded-2xl">
        <CardContent className="p-6 flex flex-col items-center gap-4">
          {qr && <img src={qr} className="w-64 h-64" />}
          <div className="text-sm text-muted-foreground">
            Print and display this QR for customers to scan.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}