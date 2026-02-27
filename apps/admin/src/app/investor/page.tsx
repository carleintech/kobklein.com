import {
  Activity,
  ArrowUpRight,
  BarChart2,
  Building2,
  Download,
  Globe,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { apiGet } from "@/lib/api";

type OverviewData = {
  totalUsers?: number;
  activeMerchants?: number;
  activeAgents?: number;
  activeDistributors?: number;
  platformBalance?: number;
  totalTransactionVolume?: number;
  totalTransactionCount?: number;
};

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color = "#C9A84C",
  growth,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color?: string;
  growth?: string;
}) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div className="flex items-start justify-between">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: color + "15", border: `1px solid ${color}25` }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        {growth && (
          <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
            <ArrowUpRight className="h-3 w-3" />
            {growth}
          </div>
        )}
      </div>
      <div>
        <p className="text-[11px] text-kob-muted mb-1">{label}</p>
        <p className="text-xl font-bold text-kob-text">{value}</p>
        {sub && <p className="text-[10px] text-kob-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function fmt(n: number | undefined | null): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function fmtHtg(n: number | undefined | null): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M HTG`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K HTG`;
  return `${n.toLocaleString()} HTG`;
}

export default async function InvestorDashboardPage() {
  const overview = await apiGet<OverviewData | null>("admin/overview", null);

  const reportDate = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="h-5 w-5 rounded flex items-center justify-center"
              style={{ background: "rgba(52,211,153,0.15)" }}
            >
              <TrendingUp className="h-3 w-3 text-emerald-400" />
            </div>
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Partner / Investor View</span>
          </div>
          <h1 className="text-xl font-bold text-kob-text tracking-tight">Performance Dashboard</h1>
          <p className="text-xs text-kob-muted mt-0.5">Read-only · As of {reportDate}</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-kob-muted border border-white/10 hover:text-kob-text hover:border-white/20 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Export Report
        </button>
      </div>

      {/* Read-only badge */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px]"
        style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)" }}
      >
        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-emerald-400/80">Read-only access — financial data is confidential. Do not share screenshots outside authorized channels.</span>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          label="Total Platform Users"
          value={fmt(overview?.totalUsers)}
          sub="Registered accounts"
          icon={Users}
          color="#C9A84C"
          growth="+12%"
        />
        <StatCard
          label="Active Merchants"
          value={fmt(overview?.activeMerchants)}
          sub="Verified & onboarded"
          icon={Building2}
          color="#60A5FA"
          growth="+8%"
        />
        <StatCard
          label="Active Agents"
          value={fmt(overview?.activeAgents)}
          sub="K-Agent network"
          icon={Globe}
          color="#A78BFA"
          growth="+15%"
        />
        <StatCard
          label="Platform Float"
          value={fmtHtg(overview?.platformBalance)}
          sub="Total liquidity"
          icon={Wallet}
          color="#34D399"
        />
      </div>

      {/* Transaction Summary */}
      <div
        className="rounded-xl p-5"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="h-4 w-4 text-kob-muted" />
          <h2 className="text-sm font-semibold text-kob-text">Transaction Volume Summary</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Volume (HTG)", value: fmtHtg(overview?.totalTransactionVolume), icon: TrendingUp, color: "#C9A84C" },
            { label: "Total Transactions", value: fmt(overview?.totalTransactionCount), icon: Activity, color: "#60A5FA" },
            { label: "Active Distributors", value: fmt(overview?.activeDistributors), icon: Building2, color: "#A78BFA" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: color + "15" }}>
                <Icon className="h-4 w-4" style={{ color }} />
              </div>
              <div>
                <p className="text-[10px] text-kob-muted leading-tight mb-1">{label}</p>
                <p className="text-sm font-bold text-kob-text">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Network Health */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div
          className="rounded-xl p-5"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <h2 className="text-sm font-semibold text-kob-text mb-4">Network Reach</h2>
          <div className="space-y-3">
            {[
              { label: "Haiti",      pct: 78, color: "#C9A84C" },
              { label: "Diaspora",   pct: 15, color: "#60A5FA" },
              { label: "Partners",   pct: 7,  color: "#A78BFA" },
            ].map(({ label, pct, color }) => (
              <div key={label}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-kob-muted">{label}</span>
                  <span className="font-medium text-kob-body">{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="rounded-xl p-5"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <h2 className="text-sm font-semibold text-kob-text mb-4">Growth Milestones</h2>
          <div className="space-y-2.5">
            {[
              { label: "10K Active Users",     done: true  },
              { label: "100 Merchant Partners", done: true  },
              { label: "Haiti-Wide Coverage",   done: false },
              { label: "50K Monthly Volume",    done: false },
            ].map(({ label, done }) => (
              <div key={label} className="flex items-center gap-2.5 text-[12px]">
                <div
                  className="h-4 w-4 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: done ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.05)",
                    border: done ? "1px solid rgba(52,211,153,0.30)" : "1px solid rgba(255,255,255,0.10)",
                  }}
                >
                  {done && <div className="h-2 w-2 rounded-full bg-emerald-400" />}
                </div>
                <span style={{ color: done ? "rgba(255,255,255,0.70)" : "rgba(255,255,255,0.35)" }}>{label}</span>
                {done && <span className="ml-auto text-[10px] text-emerald-400">✓ Achieved</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-center text-kob-muted/50">
        Data is for authorized KobKlein partners and investors only. Figures are approximate and subject to audit.
        Export functionality requires 2FA verification.
      </p>
    </div>
  );
}
