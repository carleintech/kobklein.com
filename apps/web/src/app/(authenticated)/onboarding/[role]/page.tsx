"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { UserRole } from "@/lib/types/roles";
import { ROLE_LABELS, ROLE_DASHBOARD } from "@/lib/types/roles";
import { getOnboardingSchema } from "@/lib/validation/onboarding";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  User,
  Shield,
  Sparkles,
} from "lucide-react";

type OnboardingStep = "profile" | "role_specific" | "security" | "complete";

const INPUT_CLASS =
  "w-full px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-[#F0F1F5] text-sm placeholder:text-[#7A8394]/60 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 focus:border-[#C9A84C]/40 focus:bg-white/[0.05] transition-all duration-300";

export default function OnboardingPage() {
  const params = useParams();
  const router = useRouter();
  const role = params.role as UserRole;

  const [step, setStep] = useState<OnboardingStep>("profile");
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleComplete() {
    setError(null);

    // Validate with Zod
    const schema = getOnboardingSchema(role);
    const validation = schema.safeParse(formData);

    if (!validation.success) {
      // Zod v4 uses .issues instead of .errors
      const firstIssue = validation.error.issues?.[0] ?? (validation.error as any).errors?.[0];
      setError(firstIssue?.message || "Please check your information.");
      return;
    }

    setLoading(true);
    try {
      // Strip fields that are not in the DTO for the given role.
      // The API has forbidNonWhitelisted: true — any extra key = 400.
      // - `country` is only accepted by client DTO
      // - `dateOfBirth` is only accepted by client + diaspora DTOs
      const payload = { ...formData };
      if (role !== "client") {
        delete payload.country;
      }
      if (role === "merchant" || role === "distributor") {
        delete payload.dateOfBirth;
      }

      // The proxy at /api/kobklein/[...path] injects the Bearer token from
      // server-side cookies automatically — no manual session fetch needed.
      const response = await fetch(`/api/kobklein/v1/onboarding/${role}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to complete onboarding");
      }

      // Mark onboarding as done in sessionStorage so AppShell never redirects
      // us back here during this browser session
      if (typeof window !== "undefined") {
        sessionStorage.setItem("kk_onboarding_done", "1");
      }

      setStep("complete");

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push(ROLE_DASHBOARD[role]);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to save your information. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function updateFormData(field: string, value: any) {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="min-h-screen bg-[#080B14] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <AnimatePresence mode="wait">
          {step === "complete" ? (
            /* ═══ COMPLETE STATE ═══ */
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative rounded-3xl overflow-hidden"
            >
              <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-[#1F6F4A]/30 via-white/[0.06] to-[#1F6F4A]/15" />
              <div className="relative rounded-3xl bg-[#111A30]/90 backdrop-blur-2xl p-12 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#1F6F4A]/20 to-[#1F6F4A]/5 border border-[#1F6F4A]/25 flex items-center justify-center mb-6"
                >
                  <CheckCircle2 className="h-10 w-10 text-[#1F6F4A]" />
                </motion.div>

                <h2 className="text-3xl font-bold font-serif text-[#F0F1F5] mb-4">
                  Welcome to KobKlein!
                </h2>

                <p className="text-[#7A8394] mb-2">
                  Your {ROLE_LABELS[role].en} account is ready.
                </p>
                <p className="text-sm text-[#7A8394]/70">
                  Redirecting you to your dashboard...
                </p>
              </div>
            </motion.div>
          ) : (
            /* ═══ ONBOARDING FORM ═══ */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative rounded-3xl overflow-hidden"
            >
              <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-[#C9A84C]/20 via-white/[0.06] to-[#C9A84C]/10" />
              <div className="relative rounded-3xl bg-[#111A30]/90 backdrop-blur-2xl p-8 sm:p-12">
                {/* Progress bar */}
                <div className="mb-8">
                  <div className="flex justify-between mb-2 text-xs font-medium text-[#7A8394]">
                    <span>Step {step === "profile" ? "1" : step === "role_specific" ? "2" : "3"} of 3</span>
                    <span>{Math.round(((step === "profile" ? 1 : step === "role_specific" ? 2 : 3) / 3) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#C9A84C] to-[#E2CA6E]"
                      initial={{ width: "0%" }}
                      animate={{
                        width: step === "profile" ? "33%" : step === "role_specific" ? "66%" : "100%",
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                {/* Header */}
                <div className="mb-8">
                  <h1 className="text-3xl font-bold font-serif text-[#F0F1F5] mb-2">
                    Complete Your Profile
                  </h1>
                  <p className="text-[#7A8394]">
                    {ROLE_LABELS[role].en} Account Setup
                  </p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400"
                  >
                    {error}
                  </motion.div>
                )}

                {/* STEP 1: PROFILE */}
                {step === "profile" && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[#B8BCC8] mb-2">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.dateOfBirth || ""}
                          onChange={(e) => updateFormData("dateOfBirth", e.target.value)}
                          className={INPUT_CLASS}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#B8BCC8] mb-2">
                          Country
                        </label>
                        <select
                          required
                          value={formData.country || ""}
                          onChange={(e) => updateFormData("country", e.target.value)}
                          className={INPUT_CLASS}
                        >
                          <option value="">Select country</option>
                          <option value="HT">Haiti</option>
                          <option value="US">United States</option>
                          <option value="CA">Canada</option>
                          <option value="FR">France</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep("role_specific")}
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#E2CA6E] text-[#060D1F] font-bold text-sm hover:shadow-lg transition-all"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* STEP 2: ROLE-SPECIFIC */}
                {step === "role_specific" && (
                  <div className="space-y-6">
                    {role === "client" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[#B8BCC8] mb-2">
                            Handle (username)
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="@yourhandle"
                            value={formData.handle || ""}
                            onChange={(e) => updateFormData("handle", e.target.value.toLowerCase())}
                            className={INPUT_CLASS}
                          />
                          <p className="text-xs text-[#7A8394]/70 mt-1">
                            3-20 characters, lowercase letters, numbers, and underscores only
                          </p>
                        </div>
                      </div>
                    )}

                    {role === "diaspora" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[#B8BCC8] mb-2">
                            Handle (username)
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="@yourhandle"
                            value={formData.handle || ""}
                            onChange={(e) => updateFormData("handle", e.target.value.toLowerCase())}
                            className={INPUT_CLASS}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#B8BCC8] mb-2">
                            Country of Residence
                          </label>
                          <select
                            required
                            value={formData.countryOfResidence || ""}
                            onChange={(e) => updateFormData("countryOfResidence", e.target.value)}
                            className={INPUT_CLASS}
                          >
                            <option value="">Select country</option>
                            <option value="US">United States</option>
                            <option value="CA">Canada</option>
                            <option value="FR">France</option>
                            <option value="GP">Guadeloupe</option>
                            <option value="GF">French Guiana</option>
                            <option value="MQ">Martinique</option>
                            <option value="DO">Dominican Republic</option>
                            <option value="GB">United Kingdom</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#B8BCC8] mb-2">
                            Preferred Currency
                          </label>
                          <select
                            value={formData.preferredCurrency || "USD"}
                            onChange={(e) => updateFormData("preferredCurrency", e.target.value)}
                            className={INPUT_CLASS}
                          >
                            <option value="USD">USD — US Dollar</option>
                            <option value="EUR">EUR — Euro</option>
                            <option value="CAD">CAD — Canadian Dollar</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {role === "merchant" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[#B8BCC8] mb-2">
                            Business Name
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Your business name"
                            value={formData.businessName || ""}
                            onChange={(e) => updateFormData("businessName", e.target.value)}
                            className={INPUT_CLASS}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#B8BCC8] mb-2">
                            Business Category
                          </label>
                          <select
                            required
                            value={formData.category || ""}
                            onChange={(e) => updateFormData("category", e.target.value)}
                            className={INPUT_CLASS}
                          >
                            <option value="">Select category</option>
                            <option value="retail">Retail / Boutique</option>
                            <option value="food">Food & Restaurant</option>
                            <option value="services">Services</option>
                            <option value="health">Health & Pharmacy</option>
                            <option value="transport">Transport</option>
                            <option value="education">Education</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#B8BCC8] mb-2">
                            Business Location
                          </label>
                          <input
                            type="text"
                            placeholder="City, department (optional)"
                            value={formData.locationText || ""}
                            onChange={(e) => updateFormData("locationText", e.target.value)}
                            className={INPUT_CLASS}
                          />
                        </div>
                      </div>
                    )}

                    {role === "distributor" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[#B8BCC8] mb-2">
                            Agent Name / Business Name
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Your agent or business name"
                            value={formData.businessName || ""}
                            onChange={(e) => updateFormData("businessName", e.target.value)}
                            className={INPUT_CLASS}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#B8BCC8] mb-2">
                            Location / Zone
                          </label>
                          <input
                            type="text"
                            placeholder="City, neighborhood, department"
                            value={formData.locationText || ""}
                            onChange={(e) => updateFormData("locationText", e.target.value)}
                            className={INPUT_CLASS}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#B8BCC8] mb-2">
                            Public Phone (for clients to find you)
                          </label>
                          <input
                            type="tel"
                            placeholder="+509XXXXXXXX"
                            value={formData.phonePublic || ""}
                            onChange={(e) => updateFormData("phonePublic", e.target.value)}
                            className={INPUT_CLASS}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStep("profile")}
                        className="px-6 py-4 rounded-xl border border-white/[0.08] text-[#7A8394] hover:text-[#F0F1F5] hover:border-white/[0.15] transition-all"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep("security")}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#E2CA6E] text-[#060D1F] font-bold text-sm hover:shadow-lg transition-all"
                      >
                        Continue
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: SECURITY */}
                {step === "security" && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-[#B8BCC8] mb-2">
                        Transaction PIN
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="4-6 digits"
                        maxLength={6}
                        value={formData.transactionPin || ""}
                        onChange={(e) => updateFormData("transactionPin", e.target.value.replace(/\D/g, ""))}
                        className={INPUT_CLASS}
                      />
                      <p className="text-xs text-[#7A8394]/70 mt-1">
                        You'll use this PIN to confirm transactions
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStep("role_specific")}
                        className="px-6 py-4 rounded-xl border border-white/[0.08] text-[#7A8394] hover:text-[#F0F1F5] hover:border-white/[0.15] transition-all"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleComplete}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#E2CA6E] text-[#060D1F] font-bold text-sm hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-[#060D1F]/30 border-t-[#060D1F] rounded-full animate-spin" />
                        ) : (
                          <>
                            Complete Setup
                            <CheckCircle2 className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
