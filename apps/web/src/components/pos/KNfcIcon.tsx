"use client";

import { motion } from "framer-motion";

/**
 * K-NFC Icon — KobKlein Phone-as-POS brand mark.
 *
 * A stylized "K" letterform with 3 concentric NFC arcs radiating from
 * the upper-right of the K (where the arm tips point outward).
 * Designed to evoke contactless payment capability at a glance.
 *
 * Props:
 *   size    — pixel diameter (default 56)
 *   active  — green glow when POS is activated; gold pulse when inactive
 *   onClick — tap / click handler
 */

type KNfcIconProps = {
  size?: number;
  active?: boolean;
  onClick?: () => void;
  className?: string;
};

export function KNfcIcon({ size = 56, active = false, onClick, className = "" }: KNfcIconProps) {
  const s  = size;
  const cx = s / 2;
  const cy = s / 2;

  // The K letterform occupies roughly 55% of the icon diameter (centered-left)
  // The NFC arcs radiate from the upper-right corner of the K's arm tips

  // K geometry (viewBox = size × size)
  // Vertical stem: x=cx*0.30, y=cy*0.20 → cy*1.80
  const stemX    = cx * 0.30;
  const stemW    = cx * 0.14;
  const topY     = cy * 0.20;
  const botY     = cy * 1.80;

  // Upper arm: stem → upper-right
  const armMidY  = cy;           // hinge at vertical center
  const armTipX  = cx * 1.18;   // right tip of upper arm
  const armTipY  = cy * 0.22;   // upper tip y

  // Lower arm: stem → lower-right
  const legTipX  = cx * 1.22;
  const legTipY  = cy * 1.78;

  // NFC arc center: near the upper-arm tip
  const arcCx = armTipX - cx * 0.02;
  const arcCy = armTipY + cy * 0.02;

  // Arc radii (3 concentric)
  const r1 = cx * 0.18;
  const r2 = cx * 0.30;
  const r3 = cx * 0.42;

  // Active color = emerald, inactive = imperial gold
  const primaryColor = active ? "#16C784" : "#C9A84C";
  const glowColor    = active ? "rgba(22,199,132,0.35)" : "rgba(201,168,76,0.35)";
  const bgColor      = active ? "rgba(22,199,132,0.10)" : "rgba(201,168,76,0.10)";
  const borderColor  = active ? "rgba(22,199,132,0.35)" : "rgba(201,168,76,0.25)";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`relative flex items-center justify-center rounded-2xl select-none ${className}`}
      style={{
        width:  s,
        height: s,
        background: bgColor,
        border:     `1.5px solid ${borderColor}`,
        cursor:     onClick ? "pointer" : "default",
      }}
      whileHover={onClick ? { scale: 1.06 } : undefined}
      whileTap={onClick   ? { scale: 0.94 } : undefined}
    >
      {/* Ambient pulse ring — only when inactive (invite to activate) */}
      {!active && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ border: `2px solid ${primaryColor}` }}
          animate={{ opacity: [0.6, 0], scale: [1, 1.25] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
        />
      )}

      {/* Active glow */}
      {active && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ boxShadow: `0 0 18px 4px ${glowColor}` }}
        />
      )}

      {/* K + NFC SVG */}
      <svg
        width={s * 0.76}
        height={s * 0.76}
        viewBox={`0 0 ${s} ${s}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="K-NFC"
      >
        {/* ── K stem (vertical bar) ─────────────────────────────── */}
        <rect
          x={stemX}
          y={topY}
          width={stemW}
          height={botY - topY}
          rx={stemW / 2}
          fill={primaryColor}
        />

        {/* ── K upper arm ──────────────────────────────────────── */}
        <polygon
          points={`
            ${stemX + stemW},${armMidY - stemW * 0.5}
            ${stemX + stemW},${armMidY - stemW * 2.5}
            ${armTipX},${armTipY}
            ${armTipX - stemW * 1.2},${armTipY + stemW * 2}
          `}
          fill={primaryColor}
        />

        {/* ── K lower arm ──────────────────────────────────────── */}
        <polygon
          points={`
            ${stemX + stemW},${armMidY + stemW * 0.5}
            ${stemX + stemW},${armMidY + stemW * 2.5}
            ${legTipX},${legTipY}
            ${legTipX - stemW * 1.2},${legTipY - stemW * 2}
          `}
          fill={primaryColor}
        />

        {/* ── NFC arc 1 (innermost) ────────────────────────────── */}
        <motion.path
          d={describeArc(arcCx, arcCy, r1, -45, 45)}
          stroke={primaryColor}
          strokeWidth={cx * 0.09}
          strokeLinecap="round"
          fill="none"
          animate={!active ? { opacity: [0.4, 1, 0.4] } : { opacity: 1 }}
          transition={{ duration: 1.6, repeat: Infinity, delay: 0, ease: "easeInOut" }}
        />

        {/* ── NFC arc 2 (middle) ───────────────────────────────── */}
        <motion.path
          d={describeArc(arcCx, arcCy, r2, -50, 50)}
          stroke={primaryColor}
          strokeWidth={cx * 0.075}
          strokeLinecap="round"
          fill="none"
          animate={!active ? { opacity: [0.3, 0.85, 0.3] } : { opacity: 0.75 }}
          transition={{ duration: 1.6, repeat: Infinity, delay: 0.22, ease: "easeInOut" }}
        />

        {/* ── NFC arc 3 (outermost) ────────────────────────────── */}
        <motion.path
          d={describeArc(arcCx, arcCy, r3, -55, 55)}
          stroke={primaryColor}
          strokeWidth={cx * 0.06}
          strokeLinecap="round"
          fill="none"
          animate={!active ? { opacity: [0.2, 0.6, 0.2] } : { opacity: 0.45 }}
          transition={{ duration: 1.6, repeat: Infinity, delay: 0.44, ease: "easeInOut" }}
        />
      </svg>
    </motion.button>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert polar → Cartesian for SVG arc path */
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

/** Build an SVG arc `d` string for the given center, radius, startAngle, endAngle */
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end   = polarToCartesian(cx, cy, r, startAngle);
  const large = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`;
}
