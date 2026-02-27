"use client";

/**
 * RoleTheme - sets data-role on <html> via useEffect so CSS vars cascade to
 * ALL elements including fixed sidebar, topbar, and mobile nav.
 *
 * Setting data-role on <html> (documentElement) ensures CSS vars cascade from
 * the topmost ancestor to every descendant, including position:fixed elements.
 *
 * Also injects an inline <style> on first render as a synchronous fallback
 * to prevent any flash before the useEffect runs.
 */

import { useEffect } from "react";

// Star field + nebula gradient for the Diaspora page background
const DIASPORA_MAIN_BG = [
  // ── Star field — 26 dots at varied positions/sizes/opacities ──────────────
  "radial-gradient(1px   1px   at  9%  5%,  rgba(255,255,255,0.55) 0%, transparent 100%)",
  "radial-gradient(1px   1px   at 82%  4%,  rgba(255,255,255,0.40) 0%, transparent 100%)",
  "radial-gradient(1.5px 1.5px at 40% 12%,  rgba(220,200,255,0.45) 0%, transparent 100%)",
  "radial-gradient(2px   2px   at 65%  9%,  rgba(200,175,255,0.30) 0%, transparent 100%)",
  "radial-gradient(1px   1px   at 21% 24%,  rgba(255,255,255,0.35) 0%, transparent 100%)",
  "radial-gradient(1px   1px   at 93% 21%,  rgba(255,255,255,0.30) 0%, transparent 100%)",
  "radial-gradient(1px   1px   at 53% 31%,  rgba(255,255,255,0.25) 0%, transparent 100%)",
  "radial-gradient(1.5px 1.5px at 77% 38%,  rgba(200,180,255,0.38) 0%, transparent 100%)",
  "radial-gradient(1px   1px   at  6% 44%,  rgba(255,255,255,0.30) 0%, transparent 100%)",
  "radial-gradient(1px   1px   at 31% 50%,  rgba(255,255,255,0.20) 0%, transparent 100%)",
  "radial-gradient(1px   1px   at 88% 48%,  rgba(255,255,255,0.28) 0%, transparent 100%)",
  "radial-gradient(2px   2px   at 48% 58%,  rgba(180,155,255,0.25) 0%, transparent 100%)",
  "radial-gradient(1px   1px   at 14% 65%,  rgba(255,255,255,0.32) 0%, transparent 100%)",
  "radial-gradient(1px   1px   at 71% 62%,  rgba(255,255,255,0.22) 0%, transparent 100%)",
  "radial-gradient(1.5px 1.5px at 59% 74%,  rgba(200,180,255,0.30) 0%, transparent 100%)",
  "radial-gradient(1px   1px   at 25% 79%,  rgba(255,255,255,0.18) 0%, transparent 100%)",
  "radial-gradient(1px   1px   at 96% 76%,  rgba(255,255,255,0.25) 0%, transparent 100%)",
  "radial-gradient(1px   1px   at 43% 85%,  rgba(255,255,255,0.22) 0%, transparent 100%)",
  "radial-gradient(1px   1px   at 17% 90%,  rgba(255,255,255,0.18) 0%, transparent 100%)",
  "radial-gradient(1.5px 1.5px at 85% 88%,  rgba(200,175,255,0.28) 0%, transparent 100%)",
  "radial-gradient(1px   1px   at 36% 96%,  rgba(255,255,255,0.15) 0%, transparent 100%)",
  "radial-gradient(1px   1px   at 62% 43%,  rgba(255,255,255,0.20) 0%, transparent 100%)",
  "radial-gradient(2px   2px   at 74% 18%,  rgba(165,150,201,0.35) 0%, transparent 100%)",
  "radial-gradient(1px   1px   at  3% 33%,  rgba(255,255,255,0.25) 0%, transparent 100%)",
  "radial-gradient(1px   1px   at 50%  2%,  rgba(255,255,255,0.45) 0%, transparent 100%)",
  "radial-gradient(1px   1px   at 29% 16%,  rgba(255,255,255,0.30) 0%, transparent 100%)",
  // ── Nebula glow — blue-indigo cloud in upper-center ───────────────────────
  "radial-gradient(ellipse 90% 50% at 58% -8%, rgba(48,12,172,0.62) 0%, rgba(28,8,130,0.25) 40%, transparent 68%)",
  "radial-gradient(ellipse 55% 35% at 80% 42%, rgba(65,16,145,0.22) 0%, transparent 58%)",
  "radial-gradient(ellipse 40% 30% at 20% 70%, rgba(80,20,160,0.15) 0%, transparent 60%)",
  // ── Base dark-to-purple gradient ──────────────────────────────────────────
  "linear-gradient(168deg, #0D0220 0%, #190730 18%, #240E3C 46%, #1E0838 70%, #0F021C 100%)",
].join(", ");

const ROLE_TOKENS: Record<string, {
  pageBg: string; mainBg: string; shellBg: string; shellBorder: string; shellGlow: string;
  accent: string; accentMuted: string; textPrimary: string; textMuted: string; textFaint: string;
}> = {
  //  Royal Purple palette — matches Diaspora Dashboard Color System spec
  diaspora: {
    pageBg:      "#240E3C",            // Royal Purple — used for card surfaces
    mainBg:      DIASPORA_MAIN_BG,     // Star field + nebula gradient — page bg only
    shellBg:     "#1C0A35",            // Deep purple sidebar/topbar panel
    shellBorder: "rgba(165,150,201,0.28)",
    shellGlow:   "rgba(138,80,200,0.22)",
    accent:      "#D4AF37",            // Sovereign Gold (primary CTA/active)
    accentMuted: "rgba(212,175,55,0.14)",
    textPrimary: "#E6DBF7",            // light lavender
    textMuted:   "#A596C9",
    textFaint:   "#6E558B",
  },
  merchant: {
    pageBg:      "#0A1628",
    mainBg:      "#0A1628",
    shellBg:     "#0F1E3A",
    shellBorder: "rgba(100,140,220,0.28)",
    shellGlow:   "rgba(100,140,220,0.18)",
    accent:      "#C9A84C",
    accentMuted: "rgba(201,168,76,0.12)",
    textPrimary: "#E0E8F8",
    textMuted:   "#7A90B8",
    textFaint:   "#3A5070",
  },
  distributor: {
    pageBg:      "#07080C",            // Near-black — card surfaces
    mainBg:      "#07080C",            // Near-black — page background
    shellBg:     "#0D0F14",            // Slightly lighter for sidebar/topbar
    shellBorder: "rgba(255,255,255,0.10)",
    shellGlow:   "rgba(255,255,255,0.06)",
    accent:      "#D4AF37",            // Sovereign Gold CTA
    accentMuted: "rgba(212,175,55,0.12)",
    textPrimary: "#FFFFFF",
    textMuted:   "rgba(255,255,255,0.58)",
    textFaint:   "rgba(255,255,255,0.14)",
  },
  client: {
    pageBg:      "#050F0C",
    mainBg:      "#050F0C",
    shellBg:     "#071A15",
    shellBorder: "rgba(13,158,138,0.35)",
    shellGlow:   "rgba(13,158,138,0.25)",
    accent:      "#C9A84C",
    accentMuted: "rgba(201,168,76,0.12)",
    textPrimary: "#E0E8E4",
    textMuted:   "#8A99AC",
    textFaint:   "#3A4A42",
  },
};

export function RoleTheme({ role }: { role: string }) {
  const t = ROLE_TOKENS[role] ?? ROLE_TOKENS.client;

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-role", role);
    root.style.setProperty("--dash-page-bg",       t.pageBg);
    root.style.setProperty("--dash-main-bg",        t.mainBg);
    root.style.setProperty("--dash-shell-bg",       t.shellBg);
    root.style.setProperty("--dash-shell-border",   t.shellBorder);
    root.style.setProperty("--dash-shell-glow",     t.shellGlow);
    root.style.setProperty("--dash-accent",         t.accent);
    root.style.setProperty("--dash-accent-muted",   t.accentMuted);
    root.style.setProperty("--dash-text-primary",   t.textPrimary);
    root.style.setProperty("--dash-text-muted",     t.textMuted);
    root.style.setProperty("--dash-text-faint",     t.textFaint);

    return () => {
      root.removeAttribute("data-role");
      root.style.removeProperty("--dash-page-bg");
      root.style.removeProperty("--dash-main-bg");
      root.style.removeProperty("--dash-shell-bg");
      root.style.removeProperty("--dash-shell-border");
      root.style.removeProperty("--dash-shell-glow");
      root.style.removeProperty("--dash-accent");
      root.style.removeProperty("--dash-accent-muted");
      root.style.removeProperty("--dash-text-primary");
      root.style.removeProperty("--dash-text-muted");
      root.style.removeProperty("--dash-text-faint");
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const css = `
    :root[data-role="${role}"] {
      --dash-page-bg:      ${t.pageBg};
      --dash-main-bg:      ${t.mainBg};
      --dash-shell-bg:     ${t.shellBg};
      --dash-shell-border: ${t.shellBorder};
      --dash-shell-glow:   ${t.shellGlow};
      --dash-accent:       ${t.accent};
      --dash-accent-muted: ${t.accentMuted};
      --dash-text-primary: ${t.textPrimary};
      --dash-text-muted:   ${t.textMuted};
      --dash-text-faint:   ${t.textFaint};
    }
  `;

  // eslint-disable-next-line react/no-danger
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
