"use client";

// ─── KobKlein Admin Portal Hub ────────────────────────────────────────────────
// Route: /portal  |  Public — no auth required
// Displays all 11 role-specific portals. Each card links to /auth/login
// where the user authenticates and is routed to their dashboard.

import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  Bell,
  BookOpen,
  Building2,
  ChevronRight,
  Globe,
  Headphones,
  Landmark,
  MapPin,
  Scale,
  Shield,
  ShieldCheck,
  Star,
  TrendingUp,
  UserCog,
  Users,
  Zap,
} from "lucide-react";

type PortalCard = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  badge?: string;
  features: string[];
};

const PORTAL_CARDS: PortalCard[] = [
  // ── Governance Tier ──────────────────────────────────────────────────────
  {
    id: "super_admin",
    title: "Super Admin",
    subtitle: "Governance Authority",
    description: "Full platform control with emergency kill switches, system configuration, and dual-control approval authority.",
    icon: Shield,
    href: "/auth/login",
    color: "#C9A84C",
    bgColor: "rgba(201,168,76,0.04)",
    borderColor: "rgba(201,168,76,0.22)",
    glowColor: "rgba(201,168,76,0.10)",
    badge: "Highest Privilege",
    features: ["Emergency controls", "System config", "Dual-control approver"],
  },
  {
    id: "admin",
    title: "Admin",
    subtitle: "Operations Command",
    description: "Day-to-day platform management: users, transactions, KYC review, float visibility, and network oversight.",
    icon: UserCog,
    href: "/auth/login",
    color: "#C9A84C",
    bgColor: "rgba(201,168,76,0.03)",
    borderColor: "rgba(201,168,76,0.16)",
    glowColor: "rgba(201,168,76,0.07)",
    features: ["User management", "Transaction oversight", "KYC approval"],
  },

  // ── Specialized Authority Tier ────────────────────────────────────────────
  {
    id: "compliance_officer",
    title: "Compliance Officer",
    subtitle: "AML/KYC Authority",
    description: "Independent AML/KYC authority. High-risk KYC approvals, SAR filing, PEP oversight, and compliance configuration.",
    icon: Scale,
    href: "/auth/login",
    color: "#F87171",
    bgColor: "rgba(239,68,68,0.04)",
    borderColor: "rgba(239,68,68,0.20)",
    glowColor: "rgba(239,68,68,0.08)",
    badge: "Compliance",
    features: ["High-risk KYC", "SAR filing", "AML thresholds"],
  },
  {
    id: "treasury_officer",
    title: "Treasury Officer",
    subtitle: "Finance Command",
    description: "Float management, FX rate configuration, settlement release, merchant fees, and transaction limit controls.",
    icon: Landmark,
    href: "/auth/login",
    color: "#4ADE80",
    bgColor: "rgba(34,197,94,0.04)",
    borderColor: "rgba(34,197,94,0.20)",
    glowColor: "rgba(34,197,94,0.08)",
    badge: "Finance",
    features: ["Float & FX control", "Settlement release", "Fee configuration"],
  },
  {
    id: "hr_manager",
    title: "HR Manager",
    subtitle: "Staff Governance",
    description: "Staff lifecycle management: onboarding, role assignment, training compliance, access reviews, and offboarding.",
    icon: Users,
    href: "/auth/login",
    color: "#FBB724",
    bgColor: "rgba(251,183,36,0.04)",
    borderColor: "rgba(251,183,36,0.20)",
    glowColor: "rgba(251,183,36,0.08)",
    badge: "People Ops",
    features: ["Staff directory", "Role assignment", "Training compliance"],
  },

  // ── Operations Tier ───────────────────────────────────────────────────────
  {
    id: "regional_manager",
    title: "Regional Manager",
    subtitle: "Network Oversight",
    description: "Region-scoped management of agents, distributors, and merchants across your assigned geographic area.",
    icon: MapPin,
    href: "/auth/login",
    color: "#60A5FA",
    bgColor: "rgba(59,130,246,0.04)",
    borderColor: "rgba(59,130,246,0.20)",
    glowColor: "rgba(59,130,246,0.07)",
    features: ["Regional network", "Agent oversight", "Regional analytics"],
  },
  {
    id: "support_agent",
    title: "Support Agent",
    subtitle: "Customer Care",
    description: "Handle user inquiries, review support tickets, manage KYC queue, and escalate compliance issues.",
    icon: Headphones,
    href: "/auth/login",
    color: "#A78BFA",
    bgColor: "rgba(139,92,246,0.04)",
    borderColor: "rgba(139,92,246,0.20)",
    glowColor: "rgba(139,92,246,0.06)",
    features: ["Ticket management", "KYC review", "User support"],
  },

  // ── Observation Tier ──────────────────────────────────────────────────────
  {
    id: "investor",
    title: "Partner / Investor",
    subtitle: "Performance Dashboard",
    description: "Aggregated, anonymized platform metrics: growth analytics, revenue reporting, and exportable investor insights.",
    icon: TrendingUp,
    href: "/auth/login",
    color: "#34D399",
    bgColor: "rgba(16,185,129,0.04)",
    borderColor: "rgba(16,185,129,0.20)",
    glowColor: "rgba(16,185,129,0.06)",
    badge: "Read Only",
    features: ["Revenue metrics", "Growth analytics", "Export reports"],
  },
  {
    id: "auditor",
    title: "Auditor",
    subtitle: "Regulatory Oversight",
    description: "Full audit trail access, AML monitoring, security event export, and compliance reporting for regulatory submissions.",
    icon: ShieldCheck,
    href: "/auth/login",
    color: "#FB923C",
    bgColor: "rgba(249,115,22,0.04)",
    borderColor: "rgba(249,115,22,0.20)",
    glowColor: "rgba(249,115,22,0.07)",
    badge: "External / Read Only",
    features: ["Audit trail export", "AML monitoring", "Compliance reports"],
  },

  // ── Specialized Portals ───────────────────────────────────────────────────
  {
    id: "broadcaster",
    title: "Notifications Hub",
    subtitle: "Broadcast & Messaging",
    description: "Send push notifications, SMS broadcasts, and in-app messages to platform user segments with approval workflow.",
    icon: Bell,
    href: "/auth/login",
    color: "#38BDF8",
    bgColor: "rgba(56,189,248,0.04)",
    borderColor: "rgba(56,189,248,0.20)",
    glowColor: "rgba(56,189,248,0.06)",
    features: ["Push notifications", "SMS broadcast", "Segmentation"],
  },
  {
    id: "training",
    title: "Training Portal",
    subtitle: "Onboarding & Certification",
    description: "Role-specific learning modules, interactive quizzes, certification tracking, and mandatory compliance training.",
    icon: BookOpen,
    href: "/auth/login",
    color: "#E879F9",
    bgColor: "rgba(217,70,239,0.04)",
    borderColor: "rgba(217,70,239,0.20)",
    glowColor: "rgba(217,70,239,0.06)",
    features: ["Learning modules", "Certifications", "Compliance training"],
  },
];

export default function PortalHubPage() {
  return (
    <div className="min-h-screen" style={{ background: "#060912" }}>
      {/* ── Ambient background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(ellipse, #C9A84C 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, #1F6F4A 0%, transparent 70%)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.022]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12 sm:py-16">
        {/* ── Header ── */}
        <div className="text-center mb-12">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div
              className="px-5 py-3 rounded-2xl"
              style={{
                background: "rgba(201,168,76,0.06)",
                border: "1px solid rgba(201,168,76,0.18)",
              }}
            >
              <Image
                src="/logo.png"
                alt="KobKlein"
                width={180}
                height={50}
                className="h-10 w-auto object-contain"
                priority
              />
            </div>
          </div>

          {/* Badge */}
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold mb-5"
            style={{
              background: "rgba(201,168,76,0.08)",
              border: "1px solid rgba(201,168,76,0.22)",
              color: "#C9A84C",
            }}
          >
            <Star className="h-3 w-3" />
            KobKlein Administration Portal
          </div>

          <h1
            className="text-4xl sm:text-5xl font-black tracking-tight mb-4"
            style={{ color: "#F2F2F2", letterSpacing: "-0.02em" }}
          >
            Command Hub
          </h1>
          <p
            className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
            style={{ color: "rgba(255,255,255,0.42)" }}
          >
            Select your portal to access the tools and dashboards for your role.
            Each portal is scoped to your assigned permissions.
          </p>

          {/* Stats bar */}
          <div className="flex items-center justify-center gap-5 mt-8 flex-wrap">
            {[
              { icon: Zap,       label: "11 Portals",      color: "#C9A84C" },
              { icon: Globe,     label: "Multi-Region",     color: "#60A5FA" },
              { icon: Building2, label: "Enterprise Grade", color: "#A78BFA" },
              { icon: Activity,  label: "Real-time Data",   color: "#34D399" },
              { icon: Shield,    label: "Dual-Control",     color: "#F87171" },
            ].map(({ icon: Icon, label, color }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 text-[12px]"
                style={{ color: "rgba(255,255,255,0.38)" }}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} />
                <span className="hidden sm:inline">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tier labels ── */}
        <div className="mb-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/25 text-center">
            — Governance · Compliance · Finance · Operations · Oversight —
          </p>
        </div>

        {/* ── Portal Cards Grid ── */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {PORTAL_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.id}
                href={card.href}
                className="group relative flex flex-col rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                style={{
                  background: card.bgColor,
                  border: `1px solid ${card.borderColor}`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    `0 20px 60px ${card.glowColor}, 0 4px 24px rgba(0,0,0,0.5)`;
                  (e.currentTarget as HTMLElement).style.borderColor = card.color + "55";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  (e.currentTarget as HTMLElement).style.borderColor = card.borderColor;
                }}
              >
                {/* Badge */}
                {card.badge && (
                  <div
                    className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider whitespace-nowrap"
                    style={{
                      background: card.color + "18",
                      color: card.color,
                      border: `1px solid ${card.color}35`,
                    }}
                  >
                    {card.badge}
                  </div>
                )}

                {/* Icon */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: card.color + "18", border: `1px solid ${card.color}30` }}
                >
                  <Icon className="h-5 w-5" style={{ color: card.color }} />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white mb-0.5">{card.title}</h3>
                  <p className="text-[11px] font-semibold mb-2.5" style={{ color: card.color }}>
                    {card.subtitle}
                  </p>
                  <p
                    className="text-[11px] leading-relaxed mb-4"
                    style={{ color: "rgba(255,255,255,0.40)" }}
                  >
                    {card.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-1 mb-4">
                    {card.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-1.5 text-[10px]"
                        style={{ color: "rgba(255,255,255,0.36)" }}
                      >
                        <span
                          className="h-1 w-1 rounded-full shrink-0"
                          style={{ background: card.color }}
                        />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <div
                  className="flex items-center justify-between pt-3 mt-auto"
                  style={{ borderTop: `1px solid ${card.borderColor}` }}
                >
                  <span className="text-[11px] font-bold" style={{ color: card.color }}>
                    Enter Portal
                  </span>
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:translate-x-0.5"
                    style={{ background: card.color + "18" }}
                  >
                    <ChevronRight className="h-3.5 w-3.5" style={{ color: card.color }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* ── Security note ── */}
        <div
          className="mt-10 mx-auto max-w-2xl px-5 py-4 rounded-xl text-center"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p className="text-[10px] text-white/30 leading-relaxed">
            <Shield className="h-3 w-3 inline mr-1.5 text-white/25" />
            This system is for authorized KobKlein personnel only. All sessions are monitored, logged,
            and subject to audit. Unauthorized access is a criminal offense under Haitian law and BRH regulations.
          </p>
        </div>

        {/* ── Footer ── */}
        <div className="mt-10 text-center">
          <div
            className="inline-flex items-center gap-3 text-[10px]"
            style={{ color: "rgba(255,255,255,0.22)" }}
          >
            <span>© {new Date().getFullYear()} KobKlein S.A.</span>
            <span>·</span>
            <span>Secure Platform</span>
            <span>·</span>
            <span>Regulated by BRH</span>
            <span>·</span>
            <a href="/auth/login" className="hover:text-white/45 transition-colors">
              Direct Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
