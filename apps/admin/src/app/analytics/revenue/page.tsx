"use client";

import { useEffect, useState } from "react";
import { kkGet } from "@/lib/kobklein-api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@kobklein/ui/card";

export default function RevenueChartPage() {
  const [data, setData] = useState<any[]>([]);

  async function load() {
    const res = await kkGet("admin/analytics/daily-revenue?days=30") as any[];
    setData(res);
  }

  useEffect(() => {
    load();
  }, []);

  const total = data.reduce((s, r) => s + (r.revenue || 0), 0);

  return (
    <div className="space-y-6">
      <div className="text-2xl font-semibold">Daily Revenue</div>

      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground mb-2">
            Last 30 Days Revenue: {total}
          </div>

          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={data}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}