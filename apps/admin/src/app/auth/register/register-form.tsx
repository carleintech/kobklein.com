"use client";

import { Eye, EyeOff, Key, Lock, Mail, Shield, User } from "lucide-react";
import { useState } from "react";

const ROLE_OPTIONS = [
  { value: "super_admin",      label: "Super Admin",       desc: "Full platform access + admin management" },
  { value: "admin",            label: "Admin",             desc: "Full platform access" },
  { value: "regional_manager", label: "Regional Manager",  desc: "Regional network oversight" },
  { value: "support_agent",    label: "Support Agent",     desc: "User support + compliance" },
];

const ERROR_MESSAGES: Record<string, string> = {
  invalid_code:   "Invalid setup code. Please check with your super admin.",
  invalid_role:   "Invalid role selected.",
  invalid_input:  "Please fill all fields. Password must be at least 8 characters.",
};

export default function RegisterForm({
  error,
  registered,
  createAdminAccount,
}: {
  error?: string;
  registered?: string;
  createAdminAccount: (formData: FormData) => Promise<void>;
}) {
  const [showPass, setShowPass] = useState(false);
  const [selectedRole, setSelectedRole] = useState("admin");

  const errorMsg = error
    ? (ERROR_MESSAGES[error] ?? decodeURIComponent(error))
    : null;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "radial-gradient(ellipse at 80% 50%, rgba(201,168,76,0.04) 0%, transparent 60%), #060912" }}
    >
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo + header */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl font-black text-[#060912]"
            style={{ background: "linear-gradient(135deg, #C9A84C 0%, #E1C97A 50%, #9F7F2C 100%)" }}
          >
            K
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Admin Account</h1>
          <p className="text-sm text-white/40 mt-1">Invite-only — requires setup code</p>
        </div>

        {/* Success message */}
        {registered && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm text-emerald-400" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.20)" }}>
            ✓ Account created successfully! You can now <a href="/auth/login" className="underline">sign in</a>.
          </div>
        )}

        {/* Card */}
        <div
          className="rounded-2xl p-6 border"
          style={{
            background: "rgba(255,255,255,0.03)",
            borderColor: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Warning */}
          <div className="flex items-start gap-2 mb-5 px-3 py-2.5 rounded-lg" style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)" }}>
            <Shield className="h-3.5 w-3.5 text-[#C9A84C] shrink-0 mt-0.5" />
            <span className="text-[11px] text-[#C9A84C]/80 leading-relaxed">
              This form creates privileged admin accounts. A valid setup code is required. All account creations are logged.
            </span>
          </div>

          <form action={createAdminAccount} className="space-y-4">
            {/* Setup Code */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Setup Code <span className="text-red-400">*</span></label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
                <input
                  name="setupCode"
                  type="password"
                  required
                  placeholder="Enter admin setup code"
                  className="w-full h-10 pl-9 pr-3 rounded-lg text-sm text-white placeholder:text-white/20 outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
                />
              </div>
            </div>

            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
                  <input
                    name="firstName"
                    type="text"
                    required
                    placeholder="Jean"
                    className="w-full h-10 pl-9 pr-3 rounded-lg text-sm text-white placeholder:text-white/20 outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">Last Name</label>
                <input
                  name="lastName"
                  type="text"
                  required
                  placeholder="Pierre"
                  className="w-full h-10 px-3 rounded-lg text-sm text-white placeholder:text-white/20 outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="admin@kobklein.com"
                  className="w-full h-10 pl-9 pr-3 rounded-lg text-sm text-white placeholder:text-white/20 outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Password <span className="text-white/30">(min 8 chars)</span></label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
                <input
                  name="password"
                  type={showPass ? "text" : "password"}
                  required
                  minLength={8}
                  placeholder="••••••••••••"
                  className="w-full h-10 pl-9 pr-9 rounded-lg text-sm text-white placeholder:text-white/20 outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Role picker */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-2">Admin Role</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map((r) => (
                  <label
                    key={r.value}
                    className="relative flex flex-col gap-0.5 p-3 rounded-xl cursor-pointer transition-all"
                    style={{
                      background: selectedRole === r.value ? "rgba(201,168,76,0.10)" : "rgba(255,255,255,0.03)",
                      border: selectedRole === r.value ? "1px solid rgba(201,168,76,0.35)" : "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r.value}
                      checked={selectedRole === r.value}
                      onChange={() => setSelectedRole(r.value)}
                      className="sr-only"
                    />
                    <span className="text-xs font-semibold" style={{ color: selectedRole === r.value ? "#C9A84C" : "rgba(255,255,255,0.7)" }}>
                      {r.label}
                    </span>
                    <span className="text-[10px] leading-tight" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {r.desc}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Error */}
            {errorMsg && (
              <div className="px-3 py-2 rounded-lg text-xs text-red-400" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.20)" }}>
                {errorMsg}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="w-full h-10 rounded-lg text-sm font-semibold text-[#060912] mt-2"
              style={{ background: "linear-gradient(135deg, #C9A84C 0%, #E1C97A 50%, #C9A84C 100%)" }}
            >
              Create Admin Account
            </button>
          </form>
        </div>

        <div className="flex items-center justify-between mt-4 text-[11px] text-white/30">
          <a href="/portal" className="hover:text-white/50 transition-colors">← Portal Hub</a>
          <a href="/auth/login" className="hover:text-white/50 transition-colors">Already have access? Sign in →</a>
        </div>
      </div>
    </div>
  );
}
