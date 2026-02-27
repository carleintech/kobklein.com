import {
  AlertTriangle,
  BarChart3,
  Building2,
  Globe,
  MapPin,
  Store,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";

type UserGrowth = {
  total: number;
  newThisPeriod: number;
  byRole: Record<string, number>;
  kycFunnel: Record<string, number>;
  amlFlags: { open: number; critical: number };
};

type Overview = Record<string, unknown> | null;

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight
          ? "bg-red-500/8 border-red-500/20"
          : "bg-[#0F1626] border-white/8"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon
          className={`h-4 w-4 ${highlight ? "text-red-400" : "text-kob-gold"}`}
        />
        <p className="text-[10px] font-semibold text-kob-muted uppercase tracking-widest">
          {label}
        </p>
      </div>
      <p
        className={`text-2xl font-bold ${
          highlight ? "text-red-400" : "text-kob-text"
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-[11px] text-kob-muted mt-1">{sub}</p>}
    </div>
  );
}

export function RegionalManagerDashboard({
  overview,
  userGrowth,
}: {
  overview: Overview;
  userGrowth: UserGrowth | null;
}) {
  const ov = overview as Record<string, number> | null;
  const distributors = ov?.distributorCount ?? ov?.totalDistributors ?? 0;
  const merchants = ov?.merchantCount ?? ov?.totalMerchants ?? 0;
  const agents = ov?.agentCount ?? ov?.totalAgents ?? 0;

  const kycFunnel = userGrowth?.kycFunnel ?? {};
  const tier0 = kycFunnel["tier0"] ?? 0;
  const tier1 = kycFunnel["tier1"] ?? 0;
  const tier2 = kycFunnel["tier2"] ?? 0;
  const amlOpen = userGrowth?.amlFlags?.open ?? 0;
  const amlCritical = userGrowth?.amlFlags?.critical ?? 0;

  const byRole = userGrowth?.byRole ?? {};

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-kob-text flex items-center gap-2.5">
            <Globe className="h-5 w-5 text-[#60A5FA]" />
            Regional Overview
          </h1>
          <p className="text-xs text-kob-muted mt-0.5">
            Network performance and growth metrics
          </p>
        </div>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] font-medium text-blue-400">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
          Regional Manager
        </span>
      </div>

      {/* Network KPIs */}
      <div>
        <p className="text-[10px] font-semibold text-kob-muted uppercase tracking-widest mb-3">
          Network
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            label="Total Users"
            value={(userGrowth?.total ?? 0).toLocaleString()}
            sub={`+${userGrowth?.newThisPeriod ?? 0} this month`}
            icon={Users}
          />
          <KpiCard
            label="Distributors"
            value={Number(distributors).toLocaleString()}
            sub="K-Agent network"
            icon={Building2}
          />
          <KpiCard
            label="Merchants"
            value={Number(merchants).toLocaleString()}
            sub="Active merchants"
            icon={Store}
          />
          <KpiCard
            label="Agents"
            value={Number(agents).toLocaleString()}
            sub="Field agents"
            icon={MapPin}
          />
        </div>
      </div>

      {/* KYC Funnel + AML */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* KYC Funnel */}
        <div className="rounded-2xl border border-white/8 bg-[#0F1626] p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-kob-gold" />
            <p className="text-[11px] font-semibold text-kob-muted uppercase tracking-widest">
              KYC Funnel
            </p>
          </div>
          <div className="space-y-3">
            {[
              { label: "Tier 0 — Unverified", count: tier0, cls: "bg-red-500/30" },
              { label: "Tier 1 — Basic", count: tier1, cls: "bg-kob-gold/40" },
              { label: "Tier 2 — Verified", count: tier2, cls: "bg-emerald-500/40" },
            ].map((row) => {
              const total = tier0 + tier1 + tier2 || 1;
              const pct = Math.round((row.count / total) * 100);
              return (
                <div key={row.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-kob-muted">{row.label}</span>
                    <span className="text-kob-text font-semibold">
                      {row.count.toLocaleString()}
                      <span className="text-kob-muted font-normal ml-1">
                        ({pct}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${row.cls}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Role breakdown + AML */}
        <div className="space-y-3">
          {/* Role breakdown */}
          <div className="rounded-2xl border border-white/8 bg-[#0F1626] p-5">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-kob-gold" />
              <p className="text-[11px] font-semibold text-kob-muted uppercase tracking-widest">
                Users by Role
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "client", label: "Clients" },
                { key: "merchant", label: "Merchants" },
                { key: "distributor", label: "Distributors" },
                { key: "diaspora", label: "Diaspora" },
              ].map((r) => (
                <div key={r.key} className="rounded-xl bg-white/4 px-3 py-2">
                  <p className="text-lg font-bold text-kob-text">
                    {(byRole[r.key] ?? 0).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-kob-muted">{r.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AML flags */}
          <div
            className={`rounded-2xl border p-4 flex items-center gap-4 ${
              amlCritical > 0
                ? "bg-red-500/8 border-red-500/20"
                : "bg-[#0F1626] border-white/8"
            }`}
          >
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                amlCritical > 0 ? "bg-red-500/15" : "bg-kob-gold/10"
              }`}
            >
              <AlertTriangle
                className={`h-5 w-5 ${
                  amlCritical > 0 ? "text-red-400" : "text-kob-gold/50"
                }`}
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-kob-text">
                AML Flags
              </p>
              <p className="text-[11px] text-kob-muted mt-0.5">
                {amlOpen} open
                {amlCritical > 0 && (
                  <span className="text-red-400 font-semibold">
                    {" "}· {amlCritical} critical
                  </span>
                )}
              </p>
            </div>
            <Link
              href="/cases"
              className="text-[10px] font-semibold text-kob-gold hover:underline shrink-0"
            >
              View Cases
            </Link>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { href: "/distributors", label: "Distributors", icon: Building2 },
          { href: "/merchants", label: "Merchants", icon: Store },
          { href: "/analytics", label: "Analytics", icon: BarChart3 },
          { href: "/settlements", label: "Settlements", icon: TrendingUp },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="rounded-xl border border-white/8 bg-[#0F1626] p-3 flex items-center gap-2 text-xs font-medium text-kob-muted hover:text-kob-text hover:border-white/15 transition-colors"
          >
            <a.icon className="h-3.5 w-3.5 shrink-0" />
            {a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
