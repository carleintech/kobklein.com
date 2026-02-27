"use client";

// ─── KobKlein Admin — Public Welcome / Landing Page ───────────────────────────
// Shown at http://localhost:3002/ for unauthenticated visitors.
// Displays a serious compliance / access-authorization warning, then routes
// the user to the portal hub (/portal).

import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  Eye,
  Lock,
  Monitor,
  Shield,
  ShieldAlert,
} from "lucide-react";

export function WelcomePage() {
  const year  = new Date().getFullYear();
  const stamp = new Date().toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#060912" }}
    >
      {/* ── Ambient background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, #C9A84C 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, #1F6F4A 0%, transparent 70%)" }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl mx-auto space-y-8">

          {/* ── Logo ── */}
          <div className="flex flex-col items-center gap-4">
            <div
              className="p-3 rounded-2xl"
              style={{
                background: "rgba(201,168,76,0.06)",
                border: "1px solid rgba(201,168,76,0.18)",
              }}
            >
              <Image
                src="/logo.png"
                alt="KobKlein"
                width={200}
                height={56}
                className="h-12 w-auto object-contain"
                priority
              />
            </div>
            <div className="text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#C9A84C]/70">
                Secure Administration Platform
              </p>
              <p className="text-[10px] text-white/25 mt-0.5">
                Internal use only · All access monitored
              </p>
            </div>
          </div>

          {/* ══════════════════════════════════════════════
              SECURITY / COMPLIANCE WARNING BANNER
          ══════════════════════════════════════════════ */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              border: "1px solid rgba(239,68,68,0.30)",
              background: "rgba(239,68,68,0.04)",
            }}
          >
            {/* Warning header */}
            <div
              className="flex items-center gap-3 px-5 py-3"
              style={{ background: "rgba(239,68,68,0.10)", borderBottom: "1px solid rgba(239,68,68,0.20)" }}
            >
              <ShieldAlert className="h-5 w-5 text-red-400 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-black text-red-400 uppercase tracking-wider">
                  ⚠ AUTHORIZED ACCESS ONLY
                </p>
              </div>
              <span
                className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest"
                style={{ background: "rgba(239,68,68,0.15)", color: "#F87171", border: "1px solid rgba(239,68,68,0.30)" }}
              >
                RESTRICTED SYSTEM
              </span>
            </div>

            {/* Warning body */}
            <div className="px-5 py-5 space-y-4">
              <p className="text-sm font-semibold text-white/90 leading-relaxed">
                This computer system is the exclusive property of{" "}
                <span className="text-[#C9A84C] font-bold">KobKlein S.A.</span>{" "}
                and is protected under Haitian law and international cybersecurity statutes.
              </p>

              <p className="text-xs text-white/55 leading-relaxed">
                Access to this system is restricted to <strong className="text-white/75">authorized personnel only</strong>.
                Unauthorized access, attempted access, or misuse of this platform constitutes a
                criminal offense and will be prosecuted to the fullest extent of the law under
                Haitian Penal Code and applicable international regulations including
                <strong className="text-white/75"> BRH Circular 97-1</strong>.
              </p>

              {/* Compliance points */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {[
                  { icon: Eye,     text: "All sessions are monitored in real-time" },
                  { icon: Monitor, text: "Every action is permanently audit-logged" },
                  { icon: Lock,    text: "Multi-factor authentication is mandatory" },
                  { icon: Clock,   text: "Sessions expire after 30 minutes of inactivity" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2.5">
                    <Icon className="h-3.5 w-3.5 text-red-400/70 shrink-0" />
                    <p className="text-[11px] text-white/45">{text}</p>
                  </div>
                ))}
              </div>

              {/* Legal notice */}
              <div
                className="px-4 py-3 rounded-xl mt-1"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <p className="text-[10px] text-white/35 leading-relaxed">
                  By continuing beyond this point, you confirm that you are an authorized
                  KobKlein employee or contractor acting within the scope of your designated role,
                  that you have completed mandatory security training for your role, and that you
                  understand your actions may be subject to review by KobKlein compliance officers,
                  the Banque de la République d&apos;Haïti (BRH), and law enforcement agencies.
                </p>
                <p className="text-[10px] text-white/25 mt-2">
                  Access timestamp: <span className="text-white/40 font-mono">{stamp}</span>
                </p>
              </div>
            </div>
          </div>

          {/* ── Security badges ── */}
          <div className="flex items-center justify-center flex-wrap gap-3">
            {[
              { icon: Shield,    label: "ISO 27001",    color: "#C9A84C" },
              { icon: Lock,      label: "SOC 2 Type II", color: "#60A5FA" },
              { icon: AlertTriangle, label: "BRH Compliant", color: "#4ADE80" },
              { icon: Eye,       label: "GDPR Aligned", color: "#A78BFA" },
            ].map(({ icon: Icon, label, color }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold"
                style={{
                  background: `rgba(255,255,255,0.03)`,
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                <Icon className="h-3 w-3 shrink-0" style={{ color }} />
                {label}
              </div>
            ))}
          </div>

          {/* ── CTA — Enter Hub button ── */}
          <div className="flex flex-col items-center gap-3">
            <Link
              href="/portal"
              className="group relative inline-flex items-center gap-3 px-10 py-4 rounded-2xl font-black text-base tracking-tight text-[#060912] transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl"
              style={{
                background: "linear-gradient(135deg, #C9A84C 0%, #E1C97A 45%, #9F7F2C 100%)",
                boxShadow: "0 8px 32px rgba(201,168,76,0.25), 0 2px 8px rgba(0,0,0,0.4)",
              }}
            >
              {/* Shimmer effect */}
              <span
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
                }}
              />
              <Shield className="h-5 w-5 relative z-10" />
              <span className="relative z-10">ENTER COMMAND HUB</span>
            </Link>

            <p className="text-[10px] text-white/25 text-center max-w-xs">
              You will be asked to authenticate with your assigned credentials.
              Ensure you are on an authorized device and network.
            </p>
          </div>

        </div>
      </div>

      {/* ── Footer ── */}
      <div className="relative z-10 py-5 text-center border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="flex items-center justify-center gap-4 text-[10px]" style={{ color: "rgba(255,255,255,0.20)" }}>
          <span>© {year} KobKlein S.A.</span>
          <span>·</span>
          <span>Port-au-Prince, Haiti</span>
          <span>·</span>
          <span>Regulated by BRH</span>
          <span>·</span>
          <a href="/auth/login" className="hover:text-white/40 transition-colors">Direct Login</a>
        </div>
      </div>
    </div>
  );
}
