"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-[#060D1F]">
      {/* Logo */}
      <div className="w-16 h-16 rounded-2xl bg-[#C9A84C]/20 flex items-center justify-center text-3xl font-bold text-[#C9A84C] mb-6">
        K
      </div>

      <h1
        className="text-3xl font-bold text-[#F0F1F5] mb-3"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        You&apos;re Offline
      </h1>

      <p className="text-[#7A8394] max-w-sm mb-8">
        It looks like you&apos;ve lost your internet connection.
        Please check your network and try again.
      </p>

      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 rounded-xl bg-[#C9A84C] text-[#060D1F] font-semibold hover:bg-[#E2CA6E] transition-colors"
      >
        Try Again
      </button>

      <p className="mt-8 text-xs text-[#4A5568]">
        KobKlein · Lajan dijital ou, an sekirite.
      </p>
    </div>
  );
}
