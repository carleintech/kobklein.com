import { LiveSystemOverview } from "@/components/dashboard/live-system-overview";
import { MonitoringSection } from "@/components/dashboard/monitoring-section";
import { SystemManagement } from "@/components/dashboard/system-management";
import { UserRoleOverview } from "@/components/dashboard/user-role-overview";
import { apiGet } from "@/lib/api";

type DailyRow = { date: string; volume: number };
type DailyApiRow = { day: string; volume: number };

export default async function CommandCenterPage() {
  const [overview, dailyRaw] = await Promise.all([
    apiGet<Record<string, unknown> | null>("admin/overview", null),
    apiGet<DailyApiRow[]>("admin/analytics/daily-volume?days=14", []),
  ]);

  // Normalize day → date field for MonitoringSection
  const dailyVolume: DailyRow[] = (dailyRaw ?? []).map((r) => ({
    date: r.day,
    volume: r.volume,
  }));

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const isLive = overview !== null;

  return (
    <div className="space-y-5">
      {/* ── Page Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-kob-text tracking-tight">Command Center</h1>
          <p className="text-xs text-kob-muted mt-0.5">{dateStr}</p>
        </div>
        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Data
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-[11px] font-medium text-yellow-400">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
              API Offline
            </span>
          )}
        </div>
      </div>

      {/* ── Hero: Live System Overview ────────────────────────── */}
      <LiveSystemOverview overview={overview} />

      {/* ── Transaction Volume + Platform Health ──────────────── */}
      <MonitoringSection dailyVolume={dailyVolume} overview={overview} />

      {/* ── Network + System Management ──────────────────────── */}
      <div className="grid xl:grid-cols-2 gap-4">
        <UserRoleOverview overview={overview} />
        <SystemManagement overview={overview} />
      </div>
    </div>
  );
}
