"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { kkGet } from "@/lib/kobklein-api";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, DollarSign } from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);

  async function load() {
    const res = await kkGet("admin/analytics/overview?days=30");
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
      <div className="text-2xl font-semibold">Network Analytics</div>

      <div className="grid gap-4 md:grid-cols-3">
        {box("Transfer Volume", data?.transferVolume)}
        {box("Merchant Volume", data?.merchantVolume)}
        {box("Withdrawal Volume", data?.withdrawalVolume)}
        {box("Deposit Volume", data?.depositVolume)}
        {box("Revenue", data?.revenue)}
        {box("Transfers Count", data?.transferCount)}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/analytics/volume">
          <Card className="rounded-2xl cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp size={24} />
                <div>
                  <div className="font-medium">Daily Volume</div>
                  <div className="text-sm text-muted-foreground">Transaction trends over time</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/analytics/revenue">
          <Card className="rounded-2xl cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign size={24} />
                <div>
                  <div className="font-medium">Daily Revenue</div>
                  <div className="text-sm text-muted-foreground">Fee earnings over time</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}