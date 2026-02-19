"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { Card, CardContent } from "@kobklein/ui/card";
import { QrCode } from "lucide-react";

export default function MerchantHome() {
  const [data, setData] = useState<any>(null);

  async function load() {
    const res = await apiGet("merchant/today");
    setData(res);
  }

  useEffect(() => {
    load();
  }, []);

  function box(label: string, value: any) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold">{value ?? "-"}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-2xl font-semibold">Merchant Dashboard</div>

      <div className="grid gap-4 md:grid-cols-2">
        {box("Today's Sales", data?.todaySales)}
        {box("Fees Paid Today", data?.todayFees)}
        {box("Net Today", data?.netToday)}
        {box("Wallet Balance", data?.balance)}
      </div>

      <Link href="/merchant/qr">
        <Card className="rounded-2xl cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <QrCode size={24} />
              <div>
                <div className="font-medium">Payment QR Code</div>
                <div className="text-sm text-muted-foreground">Get your QR for customers to scan</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}