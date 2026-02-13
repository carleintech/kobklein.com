"use client";

import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-[#C6A756]/10 flex items-center justify-center mb-6">
        <ShieldAlert className="h-8 w-8 text-[#C6A756]" />
      </div>

      {/* Heading */}
      <h1
        className="text-2xl font-semibold text-[#F2F2F2] mb-2"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Something went wrong
      </h1>

      {/* Error message */}
      <p className="text-sm text-[#7A8394] max-w-xs mb-1">
        An unexpected error occurred. Please try again or return to the
        dashboard.
      </p>

      {error.digest && (
        <p className="text-xs text-[#7A8394]/60 mb-8 font-mono">
          Error ID: {error.digest}
        </p>
      )}

      {!error.digest && <div className="mb-8" />}

      {/* Actions */}
      <div className="flex gap-3 w-full max-w-xs">
        <button
          onClick={reset}
          className="flex-1 py-2.5 rounded-xl bg-[#C6A756] hover:bg-[#9F7F2C] text-white text-sm font-medium transition-colors"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="flex-1 py-2.5 rounded-xl border border-white/10 text-[#C4C7CF] hover:bg-white/5 text-sm font-medium transition-colors text-center"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
