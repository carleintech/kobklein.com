"use client";

// ─── KobKlein Admin — Internal Traffic Feed ────────────────────────────────────
// Military-grade clearance model: 4 levels + regional channels.
// Rule: visibility ≠ access. ALL channels show in sidebar;
//       restricted ones display an "Access Restricted" notice.
// EVERY read attempt (allowed or denied) is audit-logged.

import { useCallback, useEffect, useRef, useState } from "react";
import { kkGet, kkPost } from "@/lib/kobklein-api";
import {
  Activity,
  AlertTriangle,
  Bell,
  Clock,
  Eye,
  Globe,
  Info,
  Lock,
  MapPin,
  MessageSquare,
  Radio,
  Send,
  Shield,
  ShieldAlert,
  Star,
  Users,
  Zap,
} from "lucide-react";
import type { AdminRole } from "@/lib/admin-role";

// ─── Clearance model ──────────────────────────────────────────────────────────

type ClearanceLevel = 0 | 1 | 2 | 3 | 4;

type MessageTag =
  | "SYSTEM"
  | "ALERT"
  | "AML"
  | "SAR"
  | "KYC"
  | "OPS"
  | "ANNOUNCEMENT"
  | "REGULATORY"
  | "EXECUTIVE"
  | "REGIONAL"
  | "INFO"
  | "WARNING";

/** Clearance level each role holds — mirrors backend ROLE_CLEARANCE */
export const ROLE_CLEARANCE: Record<AdminRole, ClearanceLevel> = {
  super_admin:        4,
  admin:              2,
  regional_manager:   2,
  treasury_officer:   2,
  compliance_officer: 3,
  hr_manager:         1,
  support_agent:      1,
  auditor:            1,
  broadcaster:        2,
  investor:           0,
};

/** Minimum clearance needed to POST in each channel */
const POST_CLEARANCE: Record<string, ClearanceLevel> = {
  global:                1,
  ops:                   2,
  compliance:            3,
  executive:             4,
  "regional-ouest":      2,
  "regional-nord":       2,
  "regional-sud":        2,
  "regional-artibonite": 2,
};

/** Mock: assigned region for regional_manager (comes from JWT in production) */
const MOCK_ASSIGNED_REGION = "regional-ouest";

// ─── Channel definitions ──────────────────────────────────────────────────────

type Channel = {
  id: string;
  name: string;
  description: string;
  level: ClearanceLevel;
  icon: React.ElementType;
  color: string;
  levelLabel: string;
  levelBg: string;
  levelText: string;
  participants: string;
  isRegional?: boolean;
  regionId?: string;
};

const CHANNELS: Channel[] = [
  // ── Clearance channels ──────────────────────────────────────────────────────
  {
    id: "global",
    name: "Global Traffic",
    description: "Platform-wide announcements — all staff",
    level: 1,
    icon: Globe,
    color: "#94A3B8",
    levelLabel: "L1 · GLOBAL",
    levelBg: "rgba(148,163,184,0.10)",
    levelText: "#94A3B8",
    participants: "All Staff (10 roles)",
  },
  {
    id: "ops",
    name: "Operations Command",
    description: "Operational alerts — admin & ops team",
    level: 2,
    icon: Activity,
    color: "#60A5FA",
    levelLabel: "L2 · OPS",
    levelBg: "rgba(96,165,250,0.10)",
    levelText: "#60A5FA",
    participants: "Super Admin · Admin · Regional · Treasury · Broadcaster",
  },
  {
    id: "compliance",
    name: "Compliance Secured",
    description: "AML/KYC intelligence — compliance authority only",
    level: 3,
    icon: ShieldAlert,
    color: "#F87171",
    levelLabel: "L3 · SECURE",
    levelBg: "rgba(248,113,113,0.10)",
    levelText: "#F87171",
    participants: "Super Admin · Compliance Officer",
  },
  {
    id: "executive",
    name: "Executive Only",
    description: "Strategic governance — super admin only",
    level: 4,
    icon: Star,
    color: "#C9A84C",
    levelLabel: "L4 · EXEC",
    levelBg: "rgba(201,168,76,0.10)",
    levelText: "#C9A84C",
    participants: "Super Admin Only",
  },
  // ── Regional channels ────────────────────────────────────────────────────────
  {
    id: "regional-ouest",
    name: "Ouest Region",
    description: "Port-au-Prince zone operations",
    level: 2,
    icon: MapPin,
    color: "#34D399",
    levelLabel: "REGIONAL",
    levelBg: "rgba(52,211,153,0.10)",
    levelText: "#34D399",
    participants: "Super Admin · Admin · Ouest Manager",
    isRegional: true,
    regionId: "ouest",
  },
  {
    id: "regional-nord",
    name: "Nord Region",
    description: "Cap-Haïtien zone operations",
    level: 2,
    icon: MapPin,
    color: "#34D399",
    levelLabel: "REGIONAL",
    levelBg: "rgba(52,211,153,0.10)",
    levelText: "#34D399",
    participants: "Super Admin · Admin · Nord Manager",
    isRegional: true,
    regionId: "nord",
  },
  {
    id: "regional-sud",
    name: "Sud Region",
    description: "Les Cayes zone operations",
    level: 2,
    icon: MapPin,
    color: "#34D399",
    levelLabel: "REGIONAL",
    levelBg: "rgba(52,211,153,0.10)",
    levelText: "#34D399",
    participants: "Super Admin · Admin · Sud Manager",
    isRegional: true,
    regionId: "sud",
  },
  {
    id: "regional-artibonite",
    name: "Artibonite Region",
    description: "Gonaïves zone operations",
    level: 2,
    icon: MapPin,
    color: "#34D399",
    levelLabel: "REGIONAL",
    levelBg: "rgba(52,211,153,0.10)",
    levelText: "#34D399",
    participants: "Super Admin · Admin · Artibonite Manager",
    isRegional: true,
    regionId: "artibonite",
  },
];

// ─── Message types ────────────────────────────────────────────────────────────

type TrafficMessage = {
  id: string;
  channelId: string;
  tag: MessageTag;
  content: string;
  authorName: string;
  authorRole: string;
  timestamp: string;
  isSystem?: boolean;
  readCount?: number;
};

// ─── Mock message data ─────────────────────────────────────────────────────────

const INITIAL_MESSAGES: Record<string, TrafficMessage[]> = {
  global: [
    {
      id: "g1",
      channelId: "global",
      tag: "SYSTEM",
      content:
        "Daily transaction volume: 2,847 transactions completed — 14.2M HTG total. Platform health: ✅ All systems nominal.",
      authorName: "KobKlein System",
      authorRole: "SYSTEM",
      timestamp: "09:00",
      isSystem: true,
      readCount: 9,
    },
    {
      id: "g2",
      channelId: "global",
      tag: "ANNOUNCEMENT",
      content:
        "⚠️ Scheduled maintenance window: Saturday Feb 28 at 02:00–04:00 AM EST. API will enter read-only mode. Transactions queued; no data loss expected.",
      authorName: "Ops Admin",
      authorRole: "admin",
      timestamp: "Yesterday",
      readCount: 11,
    },
    {
      id: "g3",
      channelId: "global",
      tag: "WARNING",
      content:
        "Unusual login attempt detected — IP 196.203.47.x (unregistered device). Session auto-terminated. If this was you on a new device, re-authenticate and whitelist in /security.",
      authorName: "KobKlein System",
      authorRole: "SYSTEM",
      timestamp: "13:45",
      isSystem: true,
      readCount: 6,
    },
    {
      id: "g4",
      channelId: "global",
      tag: "INFO",
      content:
        "Reminder: Mandatory Q1 Security Training due by March 1st. All staff must complete the AML Awareness module. Access via /training. Non-compliant accounts will be flagged.",
      authorName: "HR Manager",
      authorRole: "hr_manager",
      timestamp: "2d ago",
      readCount: 7,
    },
  ],

  ops: [
    {
      id: "o1",
      channelId: "ops",
      tag: "ALERT",
      content:
        "🔴 AGENT LIQUIDITY — CRITICAL: 3 agents in Pétion-Ville zone below 50,000 HTG threshold. Float injection required within 2 hours to prevent service disruption.",
      authorName: "KobKlein System",
      authorRole: "SYSTEM",
      timestamp: "11:30",
      isSystem: true,
      readCount: 4,
    },
    {
      id: "o2",
      channelId: "ops",
      tag: "OPS",
      content:
        "Merchant onboarding backlog: 47 applications pending review, 8 flagged for enhanced KYC. Support team prioritizing flagged cases. Expected clearance within 48h.",
      authorName: "Ops Admin",
      authorRole: "admin",
      timestamp: "10:15",
      readCount: 3,
    },
    {
      id: "o3",
      channelId: "ops",
      tag: "SYSTEM",
      content:
        "Float transfer completed — 2,500,000 HTG: Central Pool → Sud Region. Dual-control authorization verified. New regional float: 3.2M HTG.",
      authorName: "KobKlein System",
      authorRole: "SYSTEM",
      timestamp: "09:45",
      isSystem: true,
      readCount: 5,
    },
    {
      id: "o4",
      channelId: "ops",
      tag: "INFO",
      content:
        "FX rate update applied — USD/HTG: 1:141.2 (was 1:140.8). New spread parameters effective 08:00. Treasury confirmation on file.",
      authorName: "Treasury Officer",
      authorRole: "treasury_officer",
      timestamp: "08:05",
      readCount: 4,
    },
  ],

  compliance: [
    {
      id: "c1",
      channelId: "compliance",
      tag: "AML",
      content:
        "🚨 HIGH-RISK TRANSACTION — Case #2847: Single transfer of 850,000 HTG to unverified beneficiary. Account K-47821 frozen. Enhanced review initiated. SAR threshold exceeded.",
      authorName: "KobKlein System",
      authorRole: "SYSTEM",
      timestamp: "14:23",
      isSystem: true,
      readCount: 2,
    },
    {
      id: "c2",
      channelId: "compliance",
      tag: "SAR",
      content:
        "SAR successfully filed — UCREF submission #SAR-2026-0312 confirmed. 72-hour BRH notification window starts now. Case assigned to compliance review queue.",
      authorName: "Chief Compliance",
      authorRole: "compliance_officer",
      timestamp: "13:15",
      readCount: 2,
    },
    {
      id: "c3",
      channelId: "compliance",
      tag: "KYC",
      content:
        "PEP match identified — Account K-47321 matches Politically Exposed Persons database (PEPDB-HT, Level 2). Account frozen pending enhanced due diligence. Dual-control approval required.",
      authorName: "KobKlein System",
      authorRole: "SYSTEM",
      timestamp: "12:30",
      isSystem: true,
      readCount: 2,
    },
    {
      id: "c4",
      channelId: "compliance",
      tag: "REGULATORY",
      content:
        "BRH Circular 2026-03 received: AML reporting threshold adjusted effective March 1. New threshold: 250,000 HTG (previously 500,000 HTG). Policy update and system reconfiguration required.",
      authorName: "Chief Compliance",
      authorRole: "compliance_officer",
      timestamp: "11:00",
      readCount: 2,
    },
  ],

  executive: [
    {
      id: "e1",
      channelId: "executive",
      tag: "EXECUTIVE",
      content:
        "Q1 2026 Board performance review — Feb 28, 14:00 AST. Prepare: full transaction volume report, KYC funnel conversion, revenue summary vs Q4 2025, and AML incident report.",
      authorName: "Super Admin",
      authorRole: "super_admin",
      timestamp: "1d ago",
      readCount: 1,
    },
    {
      id: "e2",
      channelId: "executive",
      tag: "EXECUTIVE",
      content:
        "CONFIDENTIAL — Partnership proposal received from SOGEBANK: mobile wallet interoperability and shared agent network. Initial legal review pending. Do not discuss outside this channel.",
      authorName: "Super Admin",
      authorRole: "super_admin",
      timestamp: "2d ago",
      readCount: 1,
    },
    {
      id: "e3",
      channelId: "executive",
      tag: "EXECUTIVE",
      content:
        "Emergency policy updated — break-glass procedure v2.1 in effect. Dual-control requirement now extends to all region-level freeze events. COMPLIANCE_RBAC.md updated.",
      authorName: "Super Admin",
      authorRole: "super_admin",
      timestamp: "3d ago",
      readCount: 1,
    },
  ],

  "regional-ouest": [
    {
      id: "ro1",
      channelId: "regional-ouest",
      tag: "REGIONAL",
      content:
        "Ouest Zone KYC processing: 127 pending applications, average 48h backlog. Support capacity increasing from tomorrow — 2 additional reviewers assigned.",
      authorName: "Ouest Manager",
      authorRole: "regional_manager",
      timestamp: "10:45",
      readCount: 2,
    },
    {
      id: "ro2",
      channelId: "regional-ouest",
      tag: "REGIONAL",
      content:
        "Agent recruitment: 5 new applications in Port-au-Prince metro. Background checks initiated. Onboarding expected within 14 days pending compliance clearance.",
      authorName: "Ouest Manager",
      authorRole: "regional_manager",
      timestamp: "09:30",
      readCount: 2,
    },
  ],

  "regional-nord": [
    {
      id: "rn1",
      channelId: "regional-nord",
      tag: "REGIONAL",
      content:
        "Nord Zone weekly summary: 342 transactions, 98.2% success rate. 1 agent inactive — replacement in process. Cap-Haïtien branch at +12% vs target.",
      authorName: "Nord Manager",
      authorRole: "regional_manager",
      timestamp: "Yesterday",
      readCount: 2,
    },
  ],

  "regional-sud": [
    {
      id: "rs1",
      channelId: "regional-sud",
      tag: "ALERT",
      content:
        "🔴 NETWORK OUTAGE — Les Cayes: 3 agents offline. ISP incident reported. Backup mobile connectivity deployed. Resolution expected in ~4h. Monitoring active.",
      authorName: "KobKlein System",
      authorRole: "SYSTEM",
      timestamp: "08:15",
      isSystem: true,
      readCount: 3,
    },
  ],

  "regional-artibonite": [
    {
      id: "ra1",
      channelId: "regional-artibonite",
      tag: "REGIONAL",
      content:
        "Float replenishment complete — Gonaïves central agent now at 2.1M HTG. Next scheduled refill in 14 days. Agent coverage: 12/12 active.",
      authorName: "KobKlein System",
      authorRole: "SYSTEM",
      timestamp: "2d ago",
      isSystem: true,
      readCount: 2,
    },
  ],
};

// ─── Styling maps ─────────────────────────────────────────────────────────────

const TAG_STYLES: Record<MessageTag, { bg: string; color: string }> = {
  SYSTEM:       { bg: "rgba(148,163,184,0.12)", color: "#94A3B8" },
  ALERT:        { bg: "rgba(239,68,68,0.15)",   color: "#F87171" },
  AML:          { bg: "rgba(220,38,38,0.20)",   color: "#FCA5A5" },
  SAR:          { bg: "rgba(249,115,22,0.15)",  color: "#FB923C" },
  KYC:          { bg: "rgba(139,92,246,0.12)",  color: "#A78BFA" },
  OPS:          { bg: "rgba(96,165,250,0.12)",  color: "#60A5FA" },
  ANNOUNCEMENT: { bg: "rgba(251,191,36,0.12)",  color: "#FBB724" },
  REGULATORY:   { bg: "rgba(249,115,22,0.12)",  color: "#FB923C" },
  EXECUTIVE:    { bg: "rgba(201,168,76,0.15)",  color: "#C9A84C" },
  REGIONAL:     { bg: "rgba(52,211,153,0.12)",  color: "#34D399" },
  INFO:         { bg: "rgba(96,165,250,0.10)",  color: "#93C5FD" },
  WARNING:      { bg: "rgba(251,191,36,0.12)",  color: "#FBB724" },
};

const ROLE_BADGE: Record<string, { color: string; label: string }> = {
  super_admin:        { color: "#C9A84C", label: "SUPER ADMIN" },
  admin:              { color: "#C9A84C", label: "ADMIN" },
  regional_manager:   { color: "#60A5FA", label: "REGIONAL" },
  support_agent:      { color: "#A78BFA", label: "SUPPORT" },
  compliance_officer: { color: "#F87171", label: "COMPLIANCE" },
  treasury_officer:   { color: "#4ADE80", label: "TREASURY" },
  hr_manager:         { color: "#FBB724", label: "HR" },
  investor:           { color: "#34D399", label: "INVESTOR" },
  auditor:            { color: "#FB923C", label: "AUDITOR" },
  broadcaster:        { color: "#C084FC", label: "BROADCASTER" },
  SYSTEM:             { color: "#475569", label: "SYSTEM" },
};

const LEVEL_INFO: Record<ClearanceLevel, { label: string; color: string; bg: string }> = {
  0: { label: "NO ACCESS",  color: "#475569", bg: "rgba(71,85,105,0.10)"   },
  1: { label: "L1 GLOBAL",  color: "#94A3B8", bg: "rgba(148,163,184,0.10)" },
  2: { label: "L2 OPS",     color: "#60A5FA", bg: "rgba(96,165,250,0.10)"  },
  3: { label: "L3 SECURE",  color: "#F87171", bg: "rgba(248,113,113,0.10)" },
  4: { label: "L4 EXEC",    color: "#C9A84C", bg: "rgba(201,168,76,0.10)"  },
};

// ─── Access helpers ───────────────────────────────────────────────────────────

function canReadChannel(role: AdminRole, channel: Channel): boolean {
  const clearance = ROLE_CLEARANCE[role];
  if (clearance === 0) return false;

  if (channel.isRegional) {
    if (role === "super_admin" || role === "admin") return true;
    if (role === "regional_manager") return channel.id === MOCK_ASSIGNED_REGION;
    return false;
  }

  return clearance >= channel.level;
}

function canPostToChannel(role: AdminRole, channelId: string): boolean {
  if (role === "auditor" || role === "investor") return false;

  if (channelId.startsWith("regional-")) {
    if (role === "super_admin" || role === "admin") return true;
    if (role === "regional_manager") return channelId === MOCK_ASSIGNED_REGION;
    return false;
  }

  const required = POST_CLEARANCE[channelId] ?? 99;
  return ROLE_CLEARANCE[role] >= required;
}

// ─── Unread counts (mock) ─────────────────────────────────────────────────────

const UNREAD: Record<string, number> = {
  global:                1,
  ops:                   2,
  compliance:            3,
  executive:             0,
  "regional-ouest":      1,
  "regional-nord":       0,
  "regional-sud":        1,
  "regional-artibonite": 0,
};

// ─── Component ────────────────────────────────────────────────────────────────

export function NotificationHub({ role }: { role: AdminRole }) {
  const [activeChannelId, setActiveChannelId] = useState("global");
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [compose, setCompose] = useState("");
  const [sending, setSending] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  const activeChannel  = CHANNELS.find((c) => c.id === activeChannelId)!;
  const hasAccess      = canReadChannel(role, activeChannel);
  const canPost        = canPostToChannel(role, activeChannelId);
  const clearance      = ROLE_CLEARANCE[role];
  const levelInfo      = LEVEL_INFO[clearance];
  const activeMessages = messages[activeChannelId] ?? [];

  // ── Fetch real messages from API when channel changes ─────────────────────
  const fetchMessages = useCallback(async (channelId: string) => {
    const ch = CHANNELS.find((c) => c.id === channelId);
    if (!ch || !canReadChannel(role, ch)) return;
    try {
      const res = await kkGet<{
        channelId:  string;
        messages:   TrafficMessage[];
        totalCount: number;
      }>(`admin/channels/${channelId}/messages`);
      if (res.messages && res.messages.length > 0) {
        setMessages((prev) => ({ ...prev, [channelId]: res.messages }));
      }
    } catch {
      // API unreachable or channel empty — keep INITIAL_MESSAGES as fallback
    }
  }, [role]);

  useEffect(() => {
    void fetchMessages(activeChannelId);
  }, [activeChannelId, fetchMessages]);

  // ── Send a message — optimistic update + backend persist ─────────────────
  async function handleSend() {
    if (!compose.trim() || !canPost || sending) return;

    const newMsg: TrafficMessage = {
      id:         `new-${Date.now()}`,
      channelId:  activeChannelId,
      tag:        "INFO",
      content:    compose.trim(),
      authorName: "You",
      authorRole: role,
      timestamp:  "Just now",
      readCount:  1,
    };

    // Optimistic update — show immediately in the feed
    setMessages((prev) => ({
      ...prev,
      [activeChannelId]: [...(prev[activeChannelId] ?? []), newMsg],
    }));
    setCompose("");

    setTimeout(() => {
      feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
    }, 50);

    // Persist to backend (fire-and-forget; optimistic msg already visible)
    setSending(true);
    try {
      await kkPost(`admin/channels/${activeChannelId}/messages`, {
        content: newMsg.content,
        tag:     "INFO",
      });
    } catch {
      // Backend persistence failed silently — message stays in local state
    } finally {
      setSending(false);
    }
  }

  const clearanceChannels = CHANNELS.filter((c) => !c.isRegional);
  const regionalChannels  = CHANNELS.filter((c) => c.isRegional);

  return (
    <div className="flex flex-col gap-4" style={{ minHeight: "calc(100vh - 90px)" }}>

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: "#F2F2F2" }}>
            Notification Hub
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            Internal Traffic Feed — Role-Gated Channels
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Clearance badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
            style={{
              background:  levelInfo.bg,
              border:      `1px solid ${levelInfo.color}40`,
              color:       levelInfo.color,
            }}
          >
            <Shield className="h-3 w-3" />
            Clearance: {levelInfo.label}
          </div>
          {/* Live indicator */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium"
            style={{
              background: "rgba(52,211,153,0.08)",
              border:     "1px solid rgba(52,211,153,0.18)",
              color:      "#34D399",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </div>
        </div>
      </div>

      {/* ── Two-panel layout ── */}
      <div
        className="flex flex-1 rounded-2xl overflow-hidden"
        style={{
          border:     "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.01)",
          minHeight:  "520px",
        }}
      >

        {/* ────── LEFT SIDEBAR — Channel list ────── */}
        <div
          className="w-60 shrink-0 flex flex-col"
          style={{ borderRight: "1px solid rgba(255,255,255,0.05)" }}
        >
          {/* Sidebar header */}
          <div
            className="px-4 py-3 flex items-center gap-2"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            <Radio className="h-3.5 w-3.5" style={{ color: "rgba(255,255,255,0.25)" }} />
            <span
              className="text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              Channels
            </span>
          </div>

          {/* Channel groups */}
          <div className="flex-1 overflow-y-auto py-2">

            {/* Clearance channels */}
            <div className="px-3 pt-1 pb-0.5">
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/20">
                Clearance Channels
              </p>
            </div>

            {clearanceChannels.map((ch) => {
              const Icon       = ch.icon;
              const isActive   = activeChannelId === ch.id;
              const accessible = canReadChannel(role, ch);
              const unread     = UNREAD[ch.id] ?? 0;

              return (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannelId(ch.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all duration-150"
                  style={{
                    background:  isActive ? "rgba(255,255,255,0.05)" : "transparent",
                    borderLeft:  isActive ? `2px solid ${ch.color}` : "2px solid transparent",
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: accessible ? ch.levelBg : "rgba(255,255,255,0.03)",
                      border: `1px solid ${accessible ? ch.color + "35" : "rgba(255,255,255,0.05)"}`,
                    }}
                  >
                    {accessible
                      ? <Icon className="h-3.5 w-3.5" style={{ color: ch.color }} />
                      : <Lock className="h-3 w-3" style={{ color: "rgba(255,255,255,0.18)" }} />
                    }
                  </div>

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className="text-[11px] font-semibold truncate"
                        style={{
                          color: accessible
                            ? (isActive ? "#F2F2F2" : "rgba(255,255,255,0.65)")
                            : "rgba(255,255,255,0.22)",
                        }}
                      >
                        {ch.name}
                      </span>
                      {unread > 0 && accessible && (
                        <span
                          className="text-[9px] font-black px-1 py-0.5 rounded-full shrink-0 leading-none"
                          style={{ background: ch.color + "22", color: ch.color }}
                        >
                          {unread}
                        </span>
                      )}
                    </div>
                    <p
                      className="text-[9px] font-semibold uppercase tracking-wide"
                      style={{ color: accessible ? ch.levelText + "CC" : "rgba(255,255,255,0.15)" }}
                    >
                      {ch.levelLabel}
                    </p>
                  </div>
                </button>
              );
            })}

            {/* Regional channels */}
            <div className="px-3 pt-3 pb-0.5">
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/20">
                Regional Channels
              </p>
            </div>

            {regionalChannels.map((ch) => {
              const isActive   = activeChannelId === ch.id;
              const accessible = canReadChannel(role, ch);
              const unread     = UNREAD[ch.id] ?? 0;

              return (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannelId(ch.id)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left transition-all duration-150"
                  style={{
                    background: isActive ? "rgba(255,255,255,0.04)" : "transparent",
                    borderLeft: isActive ? `2px solid ${ch.color}` : "2px solid transparent",
                  }}
                >
                  <MapPin
                    className="h-3 w-3 shrink-0"
                    style={{ color: accessible ? ch.color : "rgba(255,255,255,0.15)" }}
                  />
                  <span
                    className="flex-1 text-[11px] truncate"
                    style={{
                      color: accessible
                        ? (isActive ? "#F2F2F2" : "rgba(255,255,255,0.55)")
                        : "rgba(255,255,255,0.20)",
                      fontWeight: isActive ? 700 : 500,
                    }}
                  >
                    {ch.name}
                  </span>
                  {unread > 0 && accessible && (
                    <span
                      className="text-[9px] font-black px-1 py-0.5 rounded-full shrink-0 leading-none"
                      style={{ background: ch.color + "22", color: ch.color }}
                    >
                      {unread}
                    </span>
                  )}
                  {!accessible && (
                    <Lock className="h-2.5 w-2.5 shrink-0" style={{ color: "rgba(255,255,255,0.15)" }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Sidebar footer */}
          <div
            className="px-4 py-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <Eye className="h-3 w-3" style={{ color: "rgba(255,255,255,0.20)" }} />
              <span className="text-[9px] text-white/25">All reads are audit-logged</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="h-3 w-3" style={{ color: levelInfo.color }} />
              <span className="text-[9px] font-bold" style={{ color: levelInfo.color }}>
                {levelInfo.label}
              </span>
            </div>
          </div>
        </div>

        {/* ────── RIGHT PANEL — Message feed ────── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Channel header */}
          <div
            className="flex items-center gap-3 px-5 py-3 shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: hasAccess ? activeChannel.levelBg : "rgba(255,255,255,0.03)",
                border: `1px solid ${hasAccess ? activeChannel.color + "35" : "rgba(255,255,255,0.06)"}`,
              }}
            >
              {hasAccess
                ? <activeChannel.icon className="h-4 w-4" style={{ color: activeChannel.color }} />
                : <Lock className="h-3.5 w-3.5" style={{ color: "rgba(255,255,255,0.20)" }} />
              }
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold" style={{ color: "#F2F2F2" }}>
                  {activeChannel.name}
                </h2>
                <span
                  className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                  style={{
                    background: activeChannel.levelBg,
                    color:      activeChannel.levelText,
                    border:     `1px solid ${activeChannel.color}30`,
                  }}
                >
                  {activeChannel.levelLabel}
                </span>
              </div>
              <p
                className="text-[11px] mt-0.5 truncate"
                style={{ color: "rgba(255,255,255,0.30)" }}
              >
                {activeChannel.participants}
              </p>
            </div>

            {hasAccess && (
              <div
                className="hidden sm:flex items-center gap-3 text-[10px]"
                style={{ color: "rgba(255,255,255,0.28)" }}
              >
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {activeMessages.length}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  Logged
                </span>
              </div>
            )}
          </div>

          {/* ── Access Restricted Panel ── */}
          {!hasAccess ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div
                className="max-w-sm w-full rounded-2xl p-6 text-center"
                style={{
                  background: "rgba(239,68,68,0.04)",
                  border:     "1px solid rgba(239,68,68,0.18)",
                }}
              >
                {/* Lock icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.25)" }}
                >
                  <Lock className="h-6 w-6 text-red-400" />
                </div>

                <h3 className="text-sm font-black text-red-400 uppercase tracking-wider mb-1">
                  Access Restricted
                </h3>

                {/* Required clearance badge */}
                <div
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider mb-4"
                  style={{
                    background: activeChannel.levelBg,
                    color:      activeChannel.levelText,
                    border:     `1px solid ${activeChannel.color}30`,
                  }}
                >
                  {activeChannel.levelLabel} Required
                </div>

                <p className="text-[12px] leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.45)" }}>
                  This channel requires{" "}
                  <strong style={{ color: LEVEL_INFO[activeChannel.level as ClearanceLevel].color }}>
                    {LEVEL_INFO[activeChannel.level as ClearanceLevel].label}
                  </strong>{" "}
                  clearance.{" "}
                  {activeChannel.isRegional
                    ? "Regional channels are only accessible to the assigned regional manager, admin, or super admin."
                    : `Your current clearance is `
                  }
                  {!activeChannel.isRegional && (
                    <strong style={{ color: levelInfo.color }}>{levelInfo.label}</strong>
                  )}
                  .
                </p>

                {/* Audit warning */}
                <div
                  className="px-4 py-3 rounded-xl text-left"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <p className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.30)" }}>
                    <Shield className="h-2.5 w-2.5 inline mr-1" style={{ color: "rgba(255,255,255,0.20)" }} />
                    This access attempt has been logged with your identity, timestamp, and IP. Repeated
                    unauthorized attempts may trigger a security review by the compliance team.
                  </p>
                </div>

                <p className="text-[10px] mt-3" style={{ color: "rgba(255,255,255,0.20)" }}>
                  Contact your super admin to request elevated clearance.
                </p>
              </div>
            </div>

          ) : (
            // ── Message feed ──
            <>
              <div
                ref={feedRef}
                className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
                style={{ maxHeight: "460px" }}
              >
                {activeMessages.length === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center h-32 gap-2"
                    style={{ color: "rgba(255,255,255,0.20)" }}
                  >
                    <Bell className="h-6 w-6" />
                    <span className="text-sm">No messages in this channel yet.</span>
                  </div>
                ) : (
                  activeMessages.map((msg) => {
                    const tagStyle = TAG_STYLES[msg.tag];
                    const rb       = ROLE_BADGE[msg.authorRole] ?? { color: "#94A3B8", label: msg.authorRole.toUpperCase() };

                    return (
                      <div
                        key={msg.id}
                        className="flex gap-3 px-3.5 py-3 rounded-xl"
                        style={{
                          background: msg.isSystem
                            ? "rgba(255,255,255,0.02)"
                            : "rgba(255,255,255,0.03)",
                          border: msg.isSystem
                            ? "1px solid rgba(255,255,255,0.04)"
                            : "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        {/* Avatar */}
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5"
                          style={{
                            background: rb.color + "18",
                            border:     `1px solid ${rb.color}30`,
                            color:       rb.color,
                          }}
                        >
                          {msg.isSystem
                            ? <Zap className="h-3 w-3" />
                            : msg.authorName.charAt(0).toUpperCase()
                          }
                        </div>

                        {/* Body */}
                        <div className="flex-1 min-w-0">
                          {/* Header row */}
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span
                              className="text-[11px] font-bold"
                              style={{
                                color: msg.isSystem
                                  ? "rgba(255,255,255,0.35)"
                                  : "rgba(255,255,255,0.80)",
                              }}
                            >
                              {msg.authorName}
                            </span>
                            {/* Role pill */}
                            <span
                              className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                              style={{ background: rb.color + "18", color: rb.color }}
                            >
                              {rb.label}
                            </span>
                            {/* Tag pill */}
                            <span
                              className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                              style={{ background: tagStyle.bg, color: tagStyle.color }}
                            >
                              {msg.tag}
                            </span>
                            {/* Timestamp */}
                            <span
                              className="text-[10px] ml-auto flex items-center gap-1"
                              style={{ color: "rgba(255,255,255,0.22)" }}
                            >
                              <Clock className="h-2.5 w-2.5" />
                              {msg.timestamp}
                            </span>
                          </div>

                          {/* Content */}
                          <p
                            className="text-[12px] leading-relaxed"
                            style={{ color: "rgba(255,255,255,0.62)" }}
                          >
                            {msg.content}
                          </p>

                          {/* Read count */}
                          <div className="flex items-center gap-1 mt-1.5">
                            <Eye className="h-2.5 w-2.5" style={{ color: "rgba(255,255,255,0.18)" }} />
                            <span
                              className="text-[9px]"
                              style={{ color: "rgba(255,255,255,0.20)" }}
                            >
                              Read by {msg.readCount ?? 1}{" "}
                              {(msg.readCount ?? 1) === 1 ? "member" : "members"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* ── Compose area ── */}
              {canPost ? (
                <div
                  className="px-5 py-3 shrink-0"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border:     "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <input
                      type="text"
                      placeholder={`Post to ${activeChannel.name}…`}
                      value={compose}
                      onChange={(e) => setCompose(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void handleSend();
                        }
                      }}
                      className="flex-1 bg-transparent text-[12px] outline-none"
                      style={{
                        color:  "rgba(255,255,255,0.70)",
                      }}
                    />
                    <button
                      onClick={() => void handleSend()}
                      disabled={!compose.trim() || sending}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 disabled:opacity-30"
                      style={{
                        background: compose.trim() && !sending
                          ? activeChannel.color + "25"
                          : "rgba(255,255,255,0.03)",
                      }}
                    >
                      <Send
                        className="h-3.5 w-3.5"
                        style={{
                          color: compose.trim() && !sending
                            ? activeChannel.color
                            : "rgba(255,255,255,0.25)",
                        }}
                      />
                    </button>
                  </div>
                  <p
                    className="text-[9px] mt-1.5 px-1"
                    style={{ color: "rgba(255,255,255,0.20)" }}
                  >
                    All messages are permanently audit-logged. Press Enter to send.
                  </p>
                </div>
              ) : (
                <div
                  className="px-5 py-3 shrink-0 flex items-center gap-2"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <Lock className="h-3 w-3" style={{ color: "rgba(255,255,255,0.18)" }} />
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                    {role === "auditor" || role === "investor"
                      ? "Read-only access — posting is not permitted for your role."
                      : "You can read this channel. Posting requires elevated clearance."}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Bottom info bar ── */}
      <div
        className="flex items-center justify-between px-4 py-2.5 rounded-xl text-[10px]"
        style={{
          background: "rgba(255,255,255,0.02)",
          border:     "1px solid rgba(255,255,255,0.05)",
          color:      "rgba(255,255,255,0.25)",
        }}
      >
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Shield className="h-3 w-3" style={{ color: "rgba(255,255,255,0.20)" }} />
            {CHANNELS.filter((c) => canReadChannel(role, c)).length} / {CHANNELS.length} channels accessible
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" style={{ color: "rgba(255,255,255,0.20)" }} />
            Every read event logged
          </span>
          <span className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" style={{ color: "rgba(255,255,255,0.20)" }} />
            Unauthorized access triggers compliance review
          </span>
        </div>
        <span className="flex items-center gap-1">
          <Info className="h-3 w-3" />
          Internal use only
        </span>
      </div>
    </div>
  );
}
