import { createAdminServerClient } from "@/lib/supabase-server";
import { resolveAdminRole } from "@/lib/admin-role";
import { LiveSystemOverview } from "@/components/dashboard/live-system-overview";
import { MonitoringSection } from "@/components/dashboard/monitoring-section";
import { RegionalManagerDashboard } from "@/components/dashboard/regional-manager-dashboard";
import { SupportAgentDashboard } from "@/components/dashboard/support-agent-dashboard";
import { SystemManagement } from "@/components/dashboard/system-management";
import { UserRoleOverview } from "@/components/dashboard/user-role-overview";
import { apiGet } from "@/lib/api";
import { WelcomePage } from "@/components/welcome/welcome-page";

type DailyRow = { date: string; volume: number };
type DailyApiRow = { day: string; volume: number };

type TicketStats = { open: number; inProgress: number; resolved: number; urgent: number };
type Ticket = {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  user?: { kId?: string; firstName?: string; lastName?: string };
};
type UserGrowth = {
  total: number;
  newThisPeriod: number;
  byRole: Record<string, number>;
  kycFunnel: Record<string, number>;
  amlFlags: { open: number; critical: number };
};

export default async function RootPage() {
  const supabase = await createAdminServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // ── UNAUTHENTICATED: show public welcome / landing page ─────────────────
  if (!user) {
    return <WelcomePage />;
  }

  const role = resolveAdminRole(user as unknown as Record<string, unknown> | undefined);

  // ── Support Agent ───────────────────────────────────────────────────────
  if (role === "support_agent") {
    const [stats, ticketsRaw] = await Promise.all([
      apiGet<TicketStats | null>("support/admin/stats", null),
      apiGet<{ tickets?: Ticket[] } | null>("support/admin/tickets?status=open&limit=8", null),
    ]);
    const tickets = ticketsRaw?.tickets ?? [];
    return <SupportAgentDashboard stats={stats} tickets={tickets} />;
  }

  // ── Regional Manager ────────────────────────────────────────────────────
  if (role === "regional_manager") {
    const [overview, userGrowth] = await Promise.all([
      apiGet<Record<string, unknown> | null>("admin/overview", null),
      apiGet<UserGrowth | null>("admin/analytics/users?days=30", null),
    ]);
    return <RegionalManagerDashboard overview={overview} userGrowth={userGrowth} />;
  }

  // ── Admin / Super Admin (default full command center) ───────────────────
  const [overview, dailyRaw] = await Promise.all([
    apiGet<Record<string, unknown> | null>("admin/overview", null),
    apiGet<DailyApiRow[]>("admin/analytics/daily-volume?days=14", []),
  ]);

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
      {/* Header */}
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
          {role === "super_admin" && (
            <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-kob-gold/10 border border-kob-gold/20 text-[11px] font-medium text-kob-gold">
              Full Access
            </span>
          )}
        </div>
      </div>

      {/* Hero: Live System Overview */}
      <LiveSystemOverview overview={overview} />

      {/* Transaction Volume + Platform Health */}
      <MonitoringSection dailyVolume={dailyVolume} overview={overview} />

      {/* Network + System Management */}
      <div className="grid xl:grid-cols-2 gap-4">
        <UserRoleOverview overview={overview} />
        <SystemManagement overview={overview} />
      </div>
    </div>
  );
}
