"use client";

import { AlertTriangle } from "lucide-react";

export function ApiUnavailableBanner() {
  return (
    <div className="rounded-2xl border border-yellow-600/30 bg-yellow-950/20 p-4 flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-yellow-300">API service is unavailable</p>
        <p className="text-xs text-[#7A8394] mt-1">
          The backend server is not responding. Run{" "}
          <code className="font-mono bg-white/5 px-1.5 py-0.5 rounded text-[#C4C7CF]">pnpm dev</code>{" "}
          from the project root to start all services.
        </p>
      </div>
    </div>
  );
}
