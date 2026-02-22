"use client";

import { ArrowLeft, RefreshCw, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { kkGet } from "@/lib/kobklein-api";

// ── Types ─────────────────────────────────────────────────────────────────────

type DayVolume = {
  day: string;
  volume: number;
};

// ── Custom tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value?: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[#0F1626] px-3 py-2 text-xs shadow-lg">
      <div className="text-kob-muted mb-1">{label}</div>
      <div className="font-mono text-kob-gold font-semibold">
        {payload[0].value?.toLocaleString("fr-HT")} HTG
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const DAY_OPTIONS = [7, 30, 90] as const;
type Days = (typeof DAY_OPTIONS)[number];

export default function VolumeChartPage() {
  const [data, setData] = useState<DayVolume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<Days>(30);

  const load = useCallback(async (d: Days) => {
    setLoading(true);
    setError(null);
    try {
      const res = await kkGet<DayVolume[]>(
        `admin/analytics/daily-volume?days=${d}`,
      );
      setData(res ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load volume data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(days);
  }, [load, days]);

  const total = data.reduce((s, r) => s + r.volume, 0);
  const peak = data.reduce((m, r) => Math.max(m, r.volume), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/analytics"
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/8 bg-[#080E20] text-kob-muted hover:text-kob-text hover:border-white/15 transition-colors"
          >
            <ArrowLeft size={14} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-kob-text flex items-center gap-2">
              <TrendingUp size={20} className="text-kob-gold" />
              Daily Volume
            </h1>
            <p className="text-sm text-kob-muted mt-0.5">
              Transfer volume trend over time
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-white/8 bg-[#080E20] p-0.5">
            {DAY_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  days === d
                    ? "bg-kob-gold text-[#080B14]"
                    : "text-kob-muted hover:text-kob-text"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>

          <button
            type="button"
            aria-label="Refresh"
            onClick={() => load(days)}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-[#080E20] px-3 py-1.5 text-xs text-kob-muted hover:text-kob-text hover:border-white/15 transition-colors disabled:opacity-40"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Summary pills */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg border border-white/8 bg-[#080E20] px-4 py-2">
          <div className="text-[10px] text-kob-muted uppercase tracking-wider">
            Period total
          </div>
          <div className="font-mono text-kob-gold font-semibold text-sm mt-0.5">
            {total.toLocaleString("fr-HT")} HTG
          </div>
        </div>
        <div className="rounded-lg border border-white/8 bg-[#080E20] px-4 py-2">
          <div className="text-[10px] text-kob-muted uppercase tracking-wider">
            Peak day
          </div>
          <div className="font-mono text-kob-text font-semibold text-sm mt-0.5">
            {peak.toLocaleString("fr-HT")} HTG
          </div>
        </div>
        <div className="rounded-lg border border-white/8 bg-[#080E20] px-4 py-2">
          <div className="text-[10px] text-kob-muted uppercase tracking-wider">
            Data points
          </div>
          <div className="font-mono text-kob-text font-semibold text-sm mt-0.5">
            {data.length} days
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-white/8 bg-[#080E20] p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-kob-muted">
            <RefreshCw size={20} className="animate-spin mr-2" />
            Loading chart…
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-kob-muted text-sm">
            No volume data for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={data}
              margin={{ top: 4, right: 4, left: 8, bottom: 0 }}
            >
              <XAxis
                dataKey="day"
                tick={{ fill: "#7A8394", fontSize: 11 }}
                axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                tickLine={false}
                tickFormatter={(v: string) =>
                  new Date(v).toLocaleDateString("en", {
                    month: "short",
                    day: "numeric",
                  })
                }
              />
              <YAxis
                tick={{ fill: "#7A8394", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) =>
                  v >= 1_000_000
                    ? `${(v / 1_000_000).toFixed(1)}M`
                    : v >= 1_000
                      ? `${(v / 1_000).toFixed(0)}k`
                      : String(v)
                }
              />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="volume"
                stroke="#C6A756"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#C6A756", strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
