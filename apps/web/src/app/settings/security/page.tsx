"use client";

import { kkPost } from "@/lib/kobklein-api";

export default function SecurityPage() {
  async function lock() {
    try {
      await kkPost("security/freeze", {});
      alert("Your account has been locked. Contact support to restore access.");
    } catch (e) {
      console.error("Failed to lock account:", e);
      alert("Failed to lock account. Please try again.");
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-2xl font-semibold">Security</div>

      <div className="border rounded-2xl p-4 space-y-2">
        <div className="font-medium">Emergency Lock</div>
        <div className="text-sm text-muted-foreground">
          Lock your account if your phone is lost or stolen. This will prevent all money transfers and payments.
        </div>

        <button
          className="w-full mt-2 py-2 rounded-xl bg-red-600 text-white font-medium"
          onClick={lock}
        >
          Lock My Account
        </button>
      </div>
    </div>
  );
}