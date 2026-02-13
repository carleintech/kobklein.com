"use client";

export default function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-cover opacity-[0.35] blur-[0.5px]"
      >
        <source src="/video/gold-dust.mp4" type="video/mp4" />
      </video>
    </div>
  );
}