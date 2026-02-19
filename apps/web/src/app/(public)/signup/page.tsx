"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserSupabase } from "@/lib/supabase";
import {
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Shield,
  Zap,
  Globe,
  UserPlus,
  CheckCircle2,
  Lock,
  Sparkles,
  Users,
  Store,
  Building2,
  Plane,
} from "lucide-react";
import type { UserRole } from "@/lib/types/roles";
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from "@/lib/types/roles";
import { baseSignupSchema, phoneInternationalSchema, phoneHaitiSchema } from "@/lib/validation/onboarding";
import type { BaseSignupInput } from "@/lib/validation/onboarding";

/* ── Deterministic floating particles ── */
const PARTICLES = [
  { size: 2.8, x: 15, y: 25, opacity: 0.16, delay: 0.5, dur: 5 },
  { size: 3.5, x: 80, y: 18, opacity: 0.18, delay: 1.8, dur: 4.3 },
  { size: 2.2, x: 50, y: 75, opacity: 0.14, delay: 0, dur: 5.8 },
  { size: 4, x: 65, y: 50, opacity: 0.12, delay: 2.2, dur: 4 },
  { size: 3, x: 30, y: 60, opacity: 0.2, delay: 3.5, dur: 5.5 },
  { size: 2.5, x: 92, y: 80, opacity: 0.15, delay: 1, dur: 6.2 },
  { size: 3.3, x: 10, y: 85, opacity: 0.17, delay: 2.8, dur: 4.6 },
  { size: 2, x: 48, y: 8, opacity: 0.22, delay: 0.3, dur: 5.3 },
];

const FEATURES = [
  {
    icon: Shield,
    title: "Bank-Level Security",
    desc: "Your funds protected with 256-bit encryption",
  },
  {
    icon: Zap,
    title: "Instant Transfers",
    desc: "Send and receive money in seconds",
  },
  {
    icon: Globe,
    title: "Global Network",
    desc: "Connect with family and businesses worldwide",
  },
];

const ROLE_OPTIONS: {
  role: UserRole;
  icon: typeof Users;
  color: string;
  gradient: string;
}[] = [
  {
    role: "client",
    icon: Users,
    color: "#C9A84C",
    gradient: "from-[#C9A84C]/20 to-[#C9A84C]/5",
  },
  {
    role: "diaspora",
    icon: Plane,
    color: "#5B9FD8",
    gradient: "from-[#5B9FD8]/20 to-[#5B9FD8]/5",
  },
  {
    role: "merchant",
    icon: Store,
    color: "#8B5CF6",
    gradient: "from-[#8B5CF6]/20 to-[#8B5CF6]/5",
  },
  {
    role: "distributor",
    icon: Building2,
    color: "#1F6F4A",
    gradient: "from-[#1F6F4A]/20 to-[#1F6F4A]/5",
  },
];

const INPUT_CLASS =
  "w-full px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-[#F0F1F5] text-sm placeholder:text-[#7A8394]/60 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 focus:border-[#C9A84C]/40 focus:bg-white/[0.05] transition-all duration-300 backdrop-blur-sm";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: 0.1 * i,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
};

type SignupStep = "role" | "details" | "success";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<SignupStep>("role");

  // Step 1: Role selection
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // Step 2: Account details
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+1"); // Default for Diaspora
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRoleSelect(role: UserRole) {
    setSelectedRole(role);
    setStep("details");
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedRole) {
      setError("Please select a role first");
      return;
    }

    // Format phone and validate based on role
    let formattedPhone = phone;
    let phoneValidationResult;
    if (selectedRole === "diaspora") {
      // Diaspora: use selected country code and phone, validate with phoneInternationalSchema
      formattedPhone = countryCode + phone.replace(/[^\d]/g, "");
      phoneValidationResult = phoneInternationalSchema.safeParse(formattedPhone);
    } else {
      // Haiti: always +509, validate with phoneHaitiSchema
      formattedPhone = `+509${phone.replace(/[^\d]/g, "")}`;
      phoneValidationResult = phoneHaitiSchema.safeParse(formattedPhone);
    }

    if (!phoneValidationResult.success) {
      // Zod v4 uses .issues; fall back to .errors for compatibility
      const phoneIssues = (phoneValidationResult.error as any).issues ?? (phoneValidationResult.error as any).errors;
      setError(phoneIssues?.[0]?.message || "Invalid phone number format.");
      return;
    }

    const formData: BaseSignupInput = {
      role: selectedRole,
      firstName,
      lastName,
      email,
      phone: formattedPhone,
      password,
    };

    // Validate the rest of the form
    const validation = baseSignupSchema.safeParse(formData);
    if (!validation.success) {
      const issues = (validation.error as any).issues ?? (validation.error as any).errors ?? [];
      const errorDetails = issues.map((e: { path?: string[]; message: string }) => `${(e.path ?? []).join('.')}: ${e.message}`).join(' | ');
      setError(errorDetails || validation.error?.message || "Invalid input. Please check your data.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createBrowserSupabase();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`.trim(),
            phone: formattedPhone,
            role: selectedRole, // ← Store role in user_metadata
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      setStep("success");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex overflow-hidden">
      {/* ═══ ANIMATED BACKGROUND ═══ */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/web-bg.png"
          alt=""
          fill
          className="object-cover object-center scale-[1.02]"
          priority
          quality={90}
        />
        <div className="absolute inset-0 bg-gradient-to-bl from-[#060D1F]/95 via-[#060D1F]/85 to-[#060D1F]/70" />
        <div className="absolute inset-0 bg-[#060D1F]/20 mix-blend-multiply" />
      </div>

      {/* Animated gradient orbs */}
      <motion.div
        animate={{ x: [0, 35, 0], y: [0, -25, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-[#C9A84C]/[0.04] rounded-full blur-[150px] pointer-events-none z-0"
      />
      <motion.div
        animate={{ x: [0, -35, 0], y: [0, 30, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[15%] left-[5%] w-[400px] h-[400px] bg-[#1F6F4A]/[0.04] rounded-full blur-[130px] pointer-events-none z-0"
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[40%] left-[40%] w-[350px] h-[350px] bg-[#C9A84C]/[0.02] rounded-full blur-[100px] pointer-events-none z-0"
      />

      {/* Gold dust particles */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-[#C9A84C] animate-pulse"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              left: `${p.x}%`,
              top: `${p.y}%`,
              opacity: p.opacity,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.dur}s`,
            }}
          />
        ))}
      </div>

      {/* ═══ CONTENT GRID ═══ */}
      <div className="relative z-10 w-full grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* ─── LEFT: Branding Panel (desktop only) ─── */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.1,
            ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
          }}
          className="hidden lg:flex flex-col justify-center px-12 xl:px-20 py-16"
        >
          <Link href="/">
            <Image
              src="/images/kobklein-logo.png"
              alt="KobKlein"
              width={160}
              height={160}
              className="h-20 w-auto mb-10 hover:scale-105 transition-transform duration-300"
            />
          </Link>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#C9A84C]/20 bg-[#C9A84C]/[0.06] w-fit mb-6"
          >
            <Sparkles size={12} className="text-[#C9A84C]" />
            <span className="text-[11px] font-medium text-[#C9A84C] tracking-wide uppercase">
              Free to Join
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="text-4xl xl:text-5xl font-bold font-serif text-[#F0F1F5] leading-[1.1] mb-4"
          >
            Join Haiti&apos;s{" "}
            <span className="bg-gradient-to-r from-[#C9A84C] via-[#E2CA6E] to-[#C9A84C] bg-clip-text text-transparent">
              Digital Economy
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="text-base text-[#B8BCC8] max-w-md mb-10 leading-relaxed"
          >
            Create your account to send and receive money securely, without
            banks, borders, or hidden fees.
          </motion.p>

          <div className="space-y-5 mb-10">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={3 + i}
                className="flex items-start gap-4 group"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#C9A84C]/[0.08] border border-[#C9A84C]/15 flex items-center justify-center group-hover:bg-[#C9A84C]/[0.15] group-hover:border-[#C9A84C]/30 transition-all duration-300">
                  <f.icon className="h-5 w-5 text-[#C9A84C]" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#F0F1F5] group-hover:text-[#E2CA6E] transition-colors duration-300">
                    {f.title}
                  </div>
                  <div className="text-xs text-[#7A8394] mt-0.5">{f.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Trust badge */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={6}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] w-fit"
          >
            <Lock className="h-3.5 w-3.5 text-[#1F6F4A]" />
            <span className="text-xs text-[#7A8394]">
              256-bit encrypted • No fees to create an account
            </span>
          </motion.div>
        </motion.div>

        {/* ─── RIGHT: Form Panel ─── */}
        <div className="flex items-center justify-center px-4 sm:px-8 pt-20 pb-12 lg:pt-8 lg:pb-8">
          {/* Mobile-only compact branding */}
          <div className="lg:hidden absolute top-6 left-4 flex items-center gap-2">
            <Link href="/">
              <Image
                src="/images/kobklein-logo.png"
                alt="KobKlein"
                width={80}
                height={80}
                className="h-10 w-auto"
              />
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.7,
              delay: 0.2,
              ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
            }}
            className="w-full max-w-md"
          >
            <AnimatePresence mode="wait">
              {step === "success" ? (
                /* ═══ SUCCESS STATE ═══ */
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="relative rounded-3xl overflow-hidden"
                >
                  <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-[#1F6F4A]/30 via-white/[0.06] to-[#1F6F4A]/15" />
                  <div className="relative rounded-3xl bg-[#111A30]/80 backdrop-blur-2xl p-10 text-center">
                    <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-[#1F6F4A]/30 to-transparent" />

                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        duration: 0.5,
                        type: "spring",
                        stiffness: 200,
                      }}
                      className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#1F6F4A]/20 to-[#1F6F4A]/5 border border-[#1F6F4A]/25 flex items-center justify-center mb-6"
                    >
                      <CheckCircle2 className="h-8 w-8 text-[#1F6F4A]" />
                    </motion.div>

                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-2xl font-bold font-serif text-[#F0F1F5] mb-3"
                    >
                      Check Your Email
                    </motion.h2>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-sm text-[#7A8394] leading-relaxed mb-8"
                    >
                      We sent a confirmation link to{" "}
                      <span className="text-[#B8BCC8] font-medium">{email}</span>.
                      Click the link to activate your account and complete your{" "}
                      <span className="text-[#C9A84C]">{selectedRole}</span> onboarding.
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Link
                        href="/login"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#E2CA6E] text-[#060D1F] text-sm font-bold hover:shadow-lg hover:shadow-[#C9A84C]/20 transition-all"
                      >
                        Go to Sign In
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </motion.div>
                  </div>
                </motion.div>
              ) : step === "role" ? (
                /* ═══ STEP 1: ROLE SELECTION ═══ */
                <motion.div
                  key="role"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="relative rounded-3xl overflow-hidden"
                >
                  <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-[#C9A84C]/20 via-white/[0.06] to-[#C9A84C]/10" />
                  <div className="relative rounded-3xl bg-[#111A30]/80 backdrop-blur-2xl p-8 sm:p-10">
                    <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-[#C9A84C]/30 to-transparent" />

                    {/* Header */}
                    <div className="mb-8">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          duration: 0.6,
                          delay: 0.4,
                          type: "spring",
                          stiffness: 200,
                        }}
                        className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C9A84C]/20 to-[#C9A84C]/5 border border-[#C9A84C]/20 flex items-center justify-center mb-4"
                      >
                        <UserPlus className="h-6 w-6 text-[#C9A84C]" />
                      </motion.div>
                      <h2 className="text-2xl font-bold font-serif text-[#F0F1F5]">
                        Choose Your Role
                      </h2>
                      <p className="text-sm text-[#7A8394] mt-1">
                        Select how you&apos;ll use KobKlein
                      </p>
                    </div>

                    {/* Role Cards */}
                    <div className="grid grid-cols-1 gap-3 mb-6">
                      {ROLE_OPTIONS.map((option) => (
                        <motion.button
                          key={option.role}
                          type="button"
                          onClick={() => handleRoleSelect(option.role)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="relative p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.15] transition-all duration-300 text-left group"
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${option.gradient} border border-[${option.color}]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                            >
                              <option.icon
                                className="h-6 w-6"
                                style={{ color: option.color }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-bold text-[#F0F1F5] mb-1">
                                {ROLE_LABELS[option.role].en}
                              </div>
                              <div className="text-xs text-[#7A8394] leading-relaxed">
                                {ROLE_DESCRIPTIONS[option.role].en}
                              </div>
                            </div>
                            <ArrowRight className="flex-shrink-0 h-4 w-4 text-[#7A8394] group-hover:text-[#C9A84C] group-hover:translate-x-1 transition-all duration-300" />
                          </div>
                        </motion.button>
                      ))}
                    </div>

                    {/* Sign in link */}
                    <p className="text-center text-sm text-[#7A8394]">
                      Already have an account?{" "}
                      <Link
                        href="/login"
                        className="text-[#C9A84C] hover:text-[#E2CA6E] font-semibold transition-colors"
                      >
                        Sign In
                      </Link>
                    </p>
                  </div>
                </motion.div>
              ) : (
                /* ═══ STEP 2: ACCOUNT DETAILS ═══ */
                <motion.div
                  key="details"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="relative rounded-3xl overflow-hidden"
                >
                  <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-[#C9A84C]/20 via-white/[0.06] to-[#C9A84C]/10" />
                  <div className="relative rounded-3xl bg-[#111A30]/80 backdrop-blur-2xl p-8 sm:p-10">
                    <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-[#C9A84C]/30 to-transparent" />

                    {/* Back button */}
                    <button
                      type="button"
                      onClick={() => setStep("role")}
                      className="mb-6 flex items-center gap-2 text-sm text-[#7A8394] hover:text-[#B8BCC8] transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Change role
                    </button>

                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                      <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${
                          ROLE_OPTIONS.find((r) => r.role === selectedRole)
                            ?.gradient
                        } border border-[${
                          ROLE_OPTIONS.find((r) => r.role === selectedRole)
                            ?.color
                        }]/20 flex items-center justify-center`}
                      >
                        {selectedRole &&
                          (() => {
                            const Icon = ROLE_OPTIONS.find(
                              (r) => r.role === selectedRole
                            )?.icon;
                            return Icon ? (
                              <Icon
                                className="h-6 w-6"
                                style={{
                                  color:
                                    ROLE_OPTIONS.find(
                                      (r) => r.role === selectedRole
                                    )?.color || "#C9A84C",
                                }}
                              />
                            ) : null;
                          })()}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold font-serif text-[#F0F1F5]">
                          Create Account
                        </h2>
                        <p className="text-sm text-[#7A8394]">
                          {selectedRole && ROLE_LABELS[selectedRole].en}
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleSignup} className="space-y-4">
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-center gap-2"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                          {error}
                        </motion.div>
                      )}

                      {/* First Name + Last Name */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label
                            htmlFor="firstName"
                            className="block text-xs font-medium text-[#B8BCC8] tracking-wide"
                          >
                            First Name
                          </label>
                          <input
                            id="firstName"
                            type="text"
                            required
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="John"
                            className={INPUT_CLASS}
                            autoComplete="given-name"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label
                            htmlFor="lastName"
                            className="block text-xs font-medium text-[#B8BCC8] tracking-wide"
                          >
                            Last Name
                          </label>
                          <input
                            id="lastName"
                            type="text"
                            required
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Doe"
                            className={INPUT_CLASS}
                            autoComplete="family-name"
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="email"
                          className="block text-xs font-medium text-[#B8BCC8] tracking-wide"
                        >
                          Email Address
                        </label>
                        <input
                          id="email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          className={INPUT_CLASS}
                          autoComplete="email"
                        />
                      </div>

                      {/* Phone */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="phone"
                          className="block text-xs font-medium text-[#B8BCC8] tracking-wide"
                        >
                          Phone Number
                        </label>
                        {selectedRole === "diaspora" ? (
                          <div className="flex gap-2">
                            <select
                              id="countryCode"
                              className="px-2 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-[#F0F1F5] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B9FD8]/40 focus:border-[#5B9FD8]/40 focus:bg-white/[0.05] transition-all duration-300 backdrop-blur-sm"
                              value={countryCode}
                              onChange={(e) => setCountryCode(e.target.value)}
                              style={{ minWidth: 90 }}
                              required
                            >
                              <option value="+1">🇺🇸 +1 (US/Canada)</option>
                              <option value="+33">🇫🇷 +33 (France)</option>
                              <option value="+44">🇬🇧 +44 (UK)</option>
                              <option value="+509">🇭🇹 +509 (Haiti)</option>
                              <option value="+590">🇬🇵 +590 (Guadeloupe)</option>
                              <option value="+594">🇬🇫 +594 (French Guiana)</option>
                              <option value="+1809">🇩🇴 +1-809 (DR)</option>
                              <option value="+1829">🇩🇴 +1-829 (DR)</option>
                              <option value="+1849">🇩🇴 +1-849 (DR)</option>
                            </select>
                            <input
                              type="text"
                              id="phone"
                              className={INPUT_CLASS + " flex-1"}
                              placeholder="Phone number (no country code)"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                              autoComplete="tel"
                              required
                            />
                          </div>
                        ) : (
                          <div className="flex">
                            <span className="inline-flex items-center px-3.5 rounded-l-xl bg-white/[0.03] border border-r-0 border-white/[0.08] text-sm text-[#7A8394] font-medium backdrop-blur-sm">
                              +509
                            </span>
                            <input
                              id="phone"
                              type="tel"
                              required
                              value={phone}
                              onChange={(e) =>
                                setPhone(e.target.value.replace(/\D/g, ""))
                              }
                              placeholder="1234 5678"
                              className={`${INPUT_CLASS} rounded-l-none`}
                              autoComplete="tel"
                            />
                          </div>
                        )}
                        <p className="text-xs text-[#7A8394]/70">
                          {selectedRole === "diaspora"
                            ? "Include country code (e.g., +1 for US/Canada, +33 for France)"
                            : "Haiti mobile number"}
                        </p>
                      </div>

                      {/* Password */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="password"
                          className="block text-xs font-medium text-[#B8BCC8] tracking-wide"
                        >
                          Password
                        </label>
                        <div className="relative">
                          <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min. 8 characters with uppercase, lowercase, and number"
                            className={`${INPUT_CLASS} pr-11`}
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[#7A8394] hover:text-[#B8BCC8] hover:bg-white/[0.05] transition-all"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Submit */}
                      <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="relative w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl text-[#060D1F] font-bold text-sm tracking-wide overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed group mt-2"
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-[#C9A84C] to-[#E2CA6E]" />
                        <span className="absolute inset-0 bg-gradient-to-r from-[#E2CA6E] via-[#F0DC82] to-[#C9A84C] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <span className="relative flex items-center gap-2">
                          {loading ? (
                            <div className="w-5 h-5 border-2 border-[#060D1F]/30 border-t-[#060D1F] rounded-full animate-spin" />
                          ) : (
                            <>
                              Create Your Account
                              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                            </>
                          )}
                        </span>
                      </motion.button>
                    </form>

                    {/* Trust indicators */}
                    <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-[#7A8394]">
                      <div className="flex items-center gap-1.5">
                        <Lock className="h-3 w-3 text-[#1F6F4A]" />
                        <span>Encrypted</span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-white/10" />
                      <div className="flex items-center gap-1.5">
                        <Shield className="h-3 w-3 text-[#1F6F4A]" />
                        <span>Free</span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-white/10" />
                      <div className="flex items-center gap-1.5">
                        <Zap className="h-3 w-3 text-[#C9A84C]" />
                        <span>Instant</span>
                      </div>
                    </div>

                    {/* Terms */}
                    <p className="mt-4 text-center text-[11px] text-[#7A8394]/70 leading-relaxed">
                      By signing up, you agree to our{" "}
                      <Link
                        href="/terms"
                        className="text-[#C9A84C]/80 hover:text-[#C9A84C] transition-colors"
                      >
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy"
                        className="text-[#C9A84C]/80 hover:text-[#C9A84C] transition-colors"
                      >
                        Privacy Policy
                      </Link>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
