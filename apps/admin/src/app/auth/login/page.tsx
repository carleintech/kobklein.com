"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAdminBrowserClient } from "@/lib/supabase";
import { Eye, EyeOff, Lock, Mail, Shield } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createAdminBrowserClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Verify admin role
    const meta = data.user?.user_metadata as Record<string, string> | undefined;
    const role = meta?.["admin_role"] ?? meta?.["role"] ?? "";
    const ADMIN_ROLES = [
      "admin", "super_admin", "regional_manager", "support_agent",
      "compliance_officer", "treasury_officer", "hr_manager",
      "investor", "auditor", "broadcaster",
    ];

    if (!ADMIN_ROLES.includes(role)) {
      await supabase.auth.signOut();
      setError("This account does not have admin access.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "radial-gradient(ellipse at 20% 50%, rgba(201,168,76,0.04) 0%, transparent 60%), #060912" }}
    >
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo + header */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl font-black text-[#060912]"
            style={{ background: "linear-gradient(135deg, #C9A84C 0%, #E1C97A 50%, #9F7F2C 100%)" }}
          >
            K
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">KobKlein Admin</h1>
          <p className="text-sm text-white/40 mt-1">Operations Command Center</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6 border"
          style={{
            background: "rgba(255,255,255,0.03)",
            borderColor: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Security badge */}
          <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-lg" style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)" }}>
            <Shield className="h-3.5 w-3.5 text-[#C9A84C] shrink-0" />
            <span className="text-[11px] text-[#C9A84C]/80">Restricted access — authorized personnel only</span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@kobklein.com"
                  className="w-full h-10 pl-9 pr-3 rounded-lg text-sm text-white placeholder:text-white/20 outline-none transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.50)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.10)")}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-10 pl-9 pr-9 rounded-lg text-sm text-white placeholder:text-white/20 outline-none transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.50)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.10)")}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="px-3 py-2 rounded-lg text-xs text-red-400" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.20)" }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg text-sm font-semibold text-[#060912] transition-all duration-200 disabled:opacity-50 mt-2"
              style={{ background: loading ? "rgba(201,168,76,0.5)" : "linear-gradient(135deg, #C9A84C 0%, #E1C97A 50%, #C9A84C 100%)" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verifying…
                </span>
              ) : (
                "Access Command Center"
              )}
            </button>
          </form>
        </div>

        {/* Footer links */}
        <div className="flex items-center justify-between mt-4 text-[11px] text-white/30">
          <a href="/portal" className="hover:text-white/50 transition-colors">← Portal Hub</a>
          <a href="/auth/register" className="hover:text-white/50 transition-colors">Request Access →</a>
        </div>
      </div>
    </div>
  );
}
