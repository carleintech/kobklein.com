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

export default function VolumeChartPage() {
  const [data, setData] = useState<any[]>([]);

  async function load() {
    const res = await kkGet("admin/analytics/daily-volume?days=30") as any[];
    setData(res);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-2xl font-semibold">Daily Transaction Volume</div>

      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={data}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="volume" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}