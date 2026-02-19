"use client";

export default function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-cover opacity-[0.35] blur-[0.5px]"
      >
        <source src="/video/gold-dust.mp4" type="video/mp4" />
      </video>
      {/* Teal wave gradients — oceanic depth from BG.png */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_10%_80%,rgba(14,139,120,0.12),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_90%_30%,rgba(14,139,120,0.08),transparent)]" />
      {/* Gold glow accent */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_-10%,rgba(201,168,76,0.10),transparent)]" />
    </div>
  );
}