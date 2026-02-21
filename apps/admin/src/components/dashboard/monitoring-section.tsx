"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type DailyRow = { date: string; volume?: number; amount?: number; total?: number };
type Props = {
  dailyVolume: DailyRow[];
  overview: Record<string, unknown> | null;
};

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-[#0F1D35] border border-white/10 px-3 py-2 text-xs shadow-xl">
      <p className="text-kob-muted mb-0.5">{label}</p>
      <p className="font-semibold text-kob-text">{fmt(payload[0].value)} HTG</p>
    </div>
  );
}

export function MonitoringSection({ dailyVolume, overview }: Props) {
  const chartData = dailyVolume.slice(-14).map((r) => ({
    date: new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    volume: Number(r.volume ?? r.amount ?? r.total ?? 0),
  }));

  const openCases = (overview?.openCases as number) ?? 0;
  const stuckEvents = (overview?.stuckEvents as number) ?? 0;
  const revenue30d = (overview as { revenue?: { merchantFees?: { last30d?: number } } })
    ?.revenue?.merchantFees?.last30d ?? 0;

  const trustScore = openCases === 0 && stuckEvents === 0 ? 96 : Math.max(60, 96 - openCases * 3 - stuckEvents * 5);

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Transaction Volume chart — spans 2 cols */}
      <div className="col-span-2 rounded-2xl border border-white/8 bg-[#080E20] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-medium text-kob-muted uppercase tracking-widest">Transaction Volume</p>
            <p className="text-lg font-bold text-kob-text mt-0.5">Last 14 days</p>
          </div>
          <div className="flex items-end gap-6 text-right">
            <div>
              <p className="text-[10px] text-kob-muted">30d Revenue</p>
              <p className="text-sm font-bold text-kob-gold">{fmt(revenue30d)} HTG</p>
            </div>
          </div>
        </div>

        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "#6B7489", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#6B7489", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={fmt}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(201,168,76,0.05)" }} />
              <Bar dataKey="volume" fill="#1F6F4A" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-kob-muted text-sm">
            No volume data yet
          </div>
        )}
      </div>

      {/* Trust / Health score */}
      <div className="rounded-2xl border border-white/8 bg-[#080E20] p-5 flex flex-col">
        <p className="text-xs font-medium text-kob-muted uppercase tracking-widest mb-4">Platform Health</p>

        {/* Score ring (CSS-based) */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="relative h-24 w-24">
            <svg viewBox="0 0 100 100" className="rotate-[-90deg] w-full h-full">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke={trustScore >= 90 ? "#1F6F4A" : trustScore >= 70 ? "#C9A84C" : "#DC2626"}
                strokeWidth="8"
                strokeDasharray={`${(trustScore / 100) * 264} 264`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-kob-text">{trustScore}</span>
              <span className="text-[10px] text-kob-muted">/ 100</span>
            </div>
          </div>
          <p className={`text-xs font-semibold ${trustScore >= 90 ? "text-emerald-400" : trustScore >= 70 ? "text-kob-gold" : "text-red-400"}`}>
            {trustScore >= 90 ? "Excellent" : trustScore >= 70 ? "Good" : "Needs Attention"}
          </p>
        </div>

        <div className="space-y-2 mt-4 pt-3 border-t border-white/6">
          {[
            { label: "Open Cases", value: openCases, warn: openCases > 0 },
            { label: "Stuck Events", value: stuckEvents, warn: stuckEvents > 0 },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between text-xs">
              <span className="text-kob-muted">{item.label}</span>
              <span className={`font-semibold ${item.warn ? "text-kob-gold" : "text-emerald-400"}`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
