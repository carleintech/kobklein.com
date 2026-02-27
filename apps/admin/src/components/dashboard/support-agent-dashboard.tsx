import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  HeadphonesIcon,
  MessageSquare,
  Search,
  Users,
} from "lucide-react";
import Link from "next/link";

type TicketStats = {
  open: number;
  inProgress: number;
  resolved: number;
  urgent: number;
};

type Ticket = {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  user?: { kId?: string; firstName?: string; lastName?: string };
};

const PRIORITY_CLASS: Record<string, string> = {
  urgent:   "bg-red-500/12 text-red-400 border-red-500/25",
  high:     "bg-orange-500/12 text-orange-400 border-orange-500/25",
  normal:   "bg-white/6 text-kob-muted border-white/10",
  low:      "bg-white/4 text-kob-muted/60 border-white/8",
};

const STATUS_CLASS: Record<string, string> = {
  open:        "bg-kob-gold/10 text-kob-gold border-kob-gold/20",
  in_progress: "bg-blue-500/12 text-blue-400 border-blue-500/20",
  resolved:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  closed:      "bg-white/6 text-kob-muted border-white/10",
};

export function SupportAgentDashboard({
  stats,
  tickets,
}: {
  stats: TicketStats | null;
  tickets: Ticket[];
}) {
  const kpis = [
    {
      label: "Open",
      value: stats?.open ?? 0,
      icon: MessageSquare,
      cls: "text-kob-gold",
      bgCls: "bg-kob-gold/8 border-kob-gold/15",
    },
    {
      label: "In Progress",
      value: stats?.inProgress ?? 0,
      icon: Clock,
      cls: "text-blue-400",
      bgCls: "bg-blue-500/8 border-blue-500/15",
    },
    {
      label: "Resolved",
      value: stats?.resolved ?? 0,
      icon: CheckCircle2,
      cls: "text-emerald-400",
      bgCls: "bg-emerald-500/8 border-emerald-500/15",
    },
    {
      label: "Urgent",
      value: stats?.urgent ?? 0,
      icon: AlertTriangle,
      cls: stats?.urgent ? "text-red-400" : "text-kob-muted",
      bgCls: stats?.urgent
        ? "bg-red-500/8 border-red-500/15"
        : "bg-white/4 border-white/8",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-kob-text flex items-center gap-2.5">
            <HeadphonesIcon className="h-5 w-5 text-[#A78BFA]" />
            Support Queue
          </h1>
          <p className="text-xs text-kob-muted mt-0.5">
            Your active ticket queue and recent activity
          </p>
        </div>
        <Link
          href="/support"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#A78BFA]/10 border border-[#A78BFA]/20 text-xs font-semibold text-[#A78BFA] hover:bg-[#A78BFA]/15 transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          All Tickets
        </Link>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div
            key={k.label}
            className={`rounded-2xl border p-4 flex items-center gap-3 ${k.bgCls}`}
          >
            <k.icon className={`h-5 w-5 shrink-0 ${k.cls}`} />
            <div>
              <p className="text-2xl font-bold text-kob-text">{k.value}</p>
              <p className="text-[10px] font-semibold text-kob-muted uppercase tracking-wider">
                {k.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent open tickets */}
      <div className="rounded-2xl border border-white/8 bg-[#0F1626] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/6 bg-white/[0.02]">
          <p className="text-[11px] font-semibold text-kob-muted uppercase tracking-widest">
            Open Tickets
          </p>
          {tickets.length > 0 && (
            <span className="text-[10px] text-kob-muted">
              Showing {tickets.length} most recent
            </span>
          )}
        </div>

        {tickets.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400/40 mx-auto mb-2" />
            <p className="text-sm text-kob-muted">All clear — no open tickets</p>
          </div>
        ) : (
          <div className="divide-y divide-white/4">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="flex items-start gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-kob-text truncate">
                    {t.subject}
                  </p>
                  <p className="text-[11px] text-kob-muted mt-0.5">
                    {t.user?.firstName
                      ? `${t.user.firstName} ${t.user.lastName ?? ""}`.trim()
                      : t.user?.kId ?? "Unknown"}
                    {" · "}
                    {t.category}
                    {" · "}
                    {new Date(t.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${PRIORITY_CLASS[t.priority] ?? PRIORITY_CLASS.normal}`}
                  >
                    {t.priority}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_CLASS[t.status] ?? STATUS_CLASS.open}`}
                  >
                    {t.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            href: "/users",
            icon: Search,
            label: "User Lookup",
            desc: "Search and manage user accounts",
            cls: "border-white/8 hover:border-white/15",
          },
          {
            href: "/cases",
            icon: AlertTriangle,
            label: "Open Cases",
            desc: "Review AML and compliance cases",
            cls: "border-white/8 hover:border-white/15",
          },
          {
            href: "/compliance/kyc",
            icon: Users,
            label: "KYC Queue",
            desc: "Pending identity verifications",
            cls: "border-white/8 hover:border-white/15",
          },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className={`rounded-2xl border bg-[#0F1626] p-4 flex items-start gap-3 transition-colors ${a.cls}`}
          >
            <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
              <a.icon className="h-4 w-4 text-kob-muted" />
            </div>
            <div>
              <p className="text-sm font-semibold text-kob-text">{a.label}</p>
              <p className="text-[11px] text-kob-muted mt-0.5">{a.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
