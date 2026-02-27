"use client";

import { useState } from "react";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  PlayCircle,
  Star,
  Users,
} from "lucide-react";

type TrackId = "merchants" | "distributors" | "agents" | "diaspora" | "admin";

type Module = {
  id: string;
  title: string;
  duration: string;
  type: "video" | "quiz" | "reading";
  done: boolean;
};

type Track = {
  id: TrackId;
  label: string;
  color: string;
  totalModules: number;
  completedModules: number;
  certTitle: string;
  modules: Module[];
};

const TRACKS: Track[] = [
  {
    id: "merchants",
    label: "Merchant Onboarding",
    color: "#C9A84C",
    totalModules: 6,
    completedModules: 4,
    certTitle: "Certified KobKlein Merchant Partner",
    modules: [
      { id: "m1", title: "Welcome to KobKlein", duration: "5 min", type: "video", done: true },
      { id: "m2", title: "Setting up your POS", duration: "12 min", type: "video", done: true },
      { id: "m3", title: "Processing Transactions", duration: "8 min", type: "video", done: true },
      { id: "m4", title: "Managing your Wallet", duration: "6 min", type: "video", done: true },
      { id: "m5", title: "Merchant Compliance Quiz", duration: "10 min", type: "quiz", done: false },
      { id: "m6", title: "Final Certification Exam", duration: "20 min", type: "quiz", done: false },
    ],
  },
  {
    id: "distributors",
    label: "K-Agent Training",
    color: "#A78BFA",
    totalModules: 8,
    completedModules: 2,
    certTitle: "Certified K-Agent",
    modules: [
      { id: "d1", title: "K-Agent Program Overview", duration: "7 min", type: "video", done: true },
      { id: "d2", title: "Float Management Basics", duration: "10 min", type: "video", done: true },
      { id: "d3", title: "Onboarding New Merchants", duration: "15 min", type: "video", done: false },
      { id: "d4", title: "Cash-In Cash-Out Procedures", duration: "9 min", type: "video", done: false },
      { id: "d5", title: "Know Your Customer (KYC)", duration: "12 min", type: "reading", done: false },
      { id: "d6", title: "AML Fundamentals", duration: "10 min", type: "reading", done: false },
      { id: "d7", title: "K-Agent Compliance Quiz", duration: "15 min", type: "quiz", done: false },
      { id: "d8", title: "Certification Exam", duration: "25 min", type: "quiz", done: false },
    ],
  },
  {
    id: "admin",
    label: "Admin Operations",
    color: "#60A5FA",
    totalModules: 5,
    completedModules: 5,
    certTitle: "Certified KobKlein Admin Operator",
    modules: [
      { id: "a1", title: "Admin Dashboard Orientation", duration: "8 min", type: "video", done: true },
      { id: "a2", title: "User Management Deep Dive", duration: "12 min", type: "video", done: true },
      { id: "a3", title: "Compliance & AML Operations", duration: "15 min", type: "video", done: true },
      { id: "a4", title: "Float & Settlement Operations", duration: "10 min", type: "video", done: true },
      { id: "a5", title: "Admin Certification Exam", duration: "20 min", type: "quiz", done: true },
    ],
  },
  {
    id: "diaspora",
    label: "Diaspora Remittance",
    color: "#34D399",
    totalModules: 4,
    completedModules: 1,
    certTitle: "KobKlein Diaspora Partner Certified",
    modules: [
      { id: "r1", title: "KobKlein Diaspora Overview", duration: "6 min", type: "video", done: true },
      { id: "r2", title: "Sending Money to Haiti", duration: "8 min", type: "video", done: false },
      { id: "r3", title: "FX Rates & Fees Explained", duration: "10 min", type: "reading", done: false },
      { id: "r4", title: "Diaspora Partner Quiz", duration: "12 min", type: "quiz", done: false },
    ],
  },
];

const MODULE_TYPE_ICONS = {
  video: PlayCircle,
  quiz: Star,
  reading: BookOpen,
};

const MODULE_TYPE_COLORS = {
  video: "#60A5FA",
  quiz: "#C9A84C",
  reading: "#34D399",
};

export default function TrainingPortalPage() {
  const [activeTrack, setActiveTrack] = useState<TrackId>("merchants");
  const track = TRACKS.find((t) => t.id === activeTrack)!;
  const pct = Math.round((track.completedModules / track.totalModules) * 100);
  const allDone = track.completedModules === track.totalModules;

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-5 w-5 rounded flex items-center justify-center" style={{ background: "rgba(251,146,60,0.15)" }}>
              <BookOpen className="h-3 w-3 text-orange-400" />
            </div>
            <span className="text-[11px] font-semibold text-orange-400 uppercase tracking-wider">Learning Management System</span>
          </div>
          <h1 className="text-xl font-bold text-kob-text tracking-tight">Training & Onboarding Portal</h1>
          <p className="text-xs text-kob-muted mt-0.5">Complete tracks to earn role certifications</p>
        </div>

        <div
          className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-[11px]"
          style={{ background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.15)" }}
        >
          <Award className="h-3.5 w-3.5 text-orange-400" />
          <span className="text-orange-400/80">{TRACKS.filter((t) => t.completedModules === t.totalModules).length} / {TRACKS.length} certifications earned</span>
        </div>
      </div>

      {/* Track selector */}
      <div className="flex gap-2 flex-wrap">
        {TRACKS.map((t) => {
          const tPct = Math.round((t.completedModules / t.totalModules) * 100);
          const isActive = t.id === activeTrack;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTrack(t.id)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: isActive ? t.color + "18" : "rgba(255,255,255,0.04)",
                border: `1px solid ${isActive ? t.color + "40" : "rgba(255,255,255,0.08)"}`,
                color: isActive ? t.color : "rgba(255,255,255,0.50)",
              }}
            >
              {tPct === 100 && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
              {t.label}
              <span className="text-[10px] opacity-70">{tPct}%</span>
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Module List */}
        <div
          className="lg:col-span-2 rounded-xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {/* Track header */}
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-kob-text">{track.label}</h2>
              <span className="text-[11px]" style={{ color: track.color }}>{track.completedModules}/{track.totalModules} modules</span>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: track.color }}
              />
            </div>
          </div>

          {/* Modules */}
          <div className="divide-y divide-white/5">
            {track.modules.map((mod, i) => {
              const TypeIcon = MODULE_TYPE_ICONS[mod.type];
              const typeColor = MODULE_TYPE_COLORS[mod.type];
              const isUnlocked = mod.done || (i === 0) || track.modules[i - 1]?.done;

              return (
                <div
                  key={mod.id}
                  className="flex items-center gap-3 px-4 py-3 transition-colors"
                  style={{
                    opacity: isUnlocked ? 1 : 0.45,
                    cursor: isUnlocked ? "pointer" : "not-allowed",
                  }}
                  onMouseEnter={(e) => isUnlocked && ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                >
                  {/* Done state */}
                  <div className="shrink-0">
                    {mod.done ? (
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />
                    ) : (
                      <Circle className="h-4.5 w-4.5 text-white/20" />
                    )}
                  </div>

                  {/* Type icon */}
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: typeColor + "15" }}
                  >
                    <TypeIcon className="h-3.5 w-3.5" style={{ color: typeColor }} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-kob-text truncate">{mod.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-kob-muted capitalize">{mod.type}</span>
                      <span className="text-[10px] text-kob-muted/50">·</span>
                      <span className="flex items-center gap-0.5 text-[10px] text-kob-muted">
                        <Clock className="h-2.5 w-2.5" />
                        {mod.duration}
                      </span>
                    </div>
                  </div>

                  {/* CTA */}
                  {isUnlocked && !mod.done && (
                    <button
                      type="button"
                      className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors"
                      style={{ background: track.color + "15", color: track.color, border: `1px solid ${track.color}25` }}
                    >
                      {mod.type === "quiz" ? "Start Quiz" : "Begin"}
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  )}

                  {mod.done && (
                    <span className="shrink-0 text-[10px] text-emerald-400">✓ Done</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar: Cert card + stats */}
        <div className="space-y-3">
          {/* Certification Card */}
          <div
            className="rounded-xl p-4 text-center"
            style={{
              background: allDone ? `${track.color}10` : "rgba(255,255,255,0.02)",
              border: `1px solid ${allDone ? track.color + "30" : "rgba(255,255,255,0.06)"}`,
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
              style={{ background: allDone ? track.color + "20" : "rgba(255,255,255,0.05)" }}
            >
              <Award className="h-7 w-7" style={{ color: allDone ? track.color : "rgba(255,255,255,0.25)" }} />
            </div>
            <h3 className="text-xs font-bold text-kob-text mb-1">
              {allDone ? "🎉 Certified!" : "Earn Certificate"}
            </h3>
            <p className="text-[10px] leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.45)" }}>
              {track.certTitle}
            </p>
            {allDone ? (
              <button
                type="button"
                className="w-full py-2 rounded-lg text-xs font-semibold text-[#060912]"
                style={{ background: `linear-gradient(135deg, ${track.color} 0%, ${track.color}CC 100%)` }}
              >
                Download Certificate
              </button>
            ) : (
              <div>
                <div className="flex justify-between text-[10px] text-kob-muted mb-1">
                  <span>Progress</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: track.color }} />
                </div>
                <p className="text-[10px] text-kob-muted mt-2">
                  {track.totalModules - track.completedModules} modules remaining
                </p>
              </div>
            )}
          </div>

          {/* Platform stats */}
          <div
            className="rounded-xl p-4"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <h3 className="text-xs font-semibold text-kob-text mb-3">Platform Training Stats</h3>
            <div className="space-y-2.5">
              {[
                { icon: Users, label: "Trained Staff", value: "47", color: "#C9A84C" },
                { icon: Award, label: "Certifications", value: "128", color: "#34D399" },
                { icon: BookOpen, label: "Modules Active", value: "23", color: "#60A5FA" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2 text-kob-muted">
                    <Icon className="h-3.5 w-3.5" style={{ color }} />
                    {label}
                  </div>
                  <span className="font-semibold text-kob-body">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* All tracks progress */}
          <div
            className="rounded-xl p-4"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <h3 className="text-xs font-semibold text-kob-text mb-3">Your Progress</h3>
            <div className="space-y-2">
              {TRACKS.map((t) => {
                const tp = Math.round((t.completedModules / t.totalModules) * 100);
                return (
                  <div key={t.id}>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-kob-muted">{t.label}</span>
                      <span style={{ color: tp === 100 ? "#34D399" : "rgba(255,255,255,0.45)" }}>
                        {tp === 100 ? "✓ Certified" : `${tp}%`}
                      </span>
                    </div>
                    <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: `${tp}%`, background: tp === 100 ? "#34D399" : t.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
