"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { kkGet, kkPost } from "@/lib/kobklein-api";
import { useToast } from "@kobklein/ui";
import { trackEvent } from "@/lib/analytics";
import {
  Shield, ShieldCheck, Camera, FileText, MapPin,
  Upload, CheckCircle2, Loader2, ChevronRight,
  Lock, Sparkles, AlertCircle, ArrowLeft, UserCheck,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type KycStatus = {
  kycTier: number;
  kycStatus: string;
  documentUrl?: string;
  selfieUrl?: string;
  addressProof?: string;
};

type UploadStep = "document" | "selfie" | "address";

// ─── Tier config ──────────────────────────────────────────────────────────────
const TIERS = [
  { tier: 0, label: "Unverified",  limit: "$50/mo",     color: "#EF4444", bg: "rgba(239,68,68,0.10)"   },
  { tier: 1, label: "Basic",       limit: "$500/mo",    color: "#C9A84C", bg: "rgba(201,168,76,0.10)"  },
  { tier: 2, label: "Verified",    limit: "$5,000/mo",  color: "#16C784", bg: "rgba(22,199,132,0.10)"  },
  { tier: 3, label: "Enhanced",    limit: "Unlimited",  color: "#C9A84C", bg: "rgba(201,168,76,0.10)"  },
];

const DOC_TYPES = [
  { value: "national_id",      label: "National ID (CIN)"  },
  { value: "passport",         label: "Passport"           },
  { value: "drivers_license",  label: "Driver License"     },
];

// ─── Tier progress bar ────────────────────────────────────────────────────────
function TierProgress({ currentTier }: { currentTier: number }) {
  return (
    <div className="flex items-center gap-0">
      {[0, 1, 2].map((t, i) => {
        const filled = currentTier > t;
        const active = currentTier === t;
        const tierCfg = TIERS[t + 1]; // next tier color
        return (
          <div key={t} className="flex items-center flex-1">
            {/* Node */}
            <div className="relative flex-shrink-0">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all"
                style={{
                  background: filled ? "#16C784" : active ? "rgba(201,168,76,0.15)" : "rgba(165,150,201,0.06)",
                  borderColor: filled ? "#16C784" : active ? "#C9A84C" : "rgba(165,150,201,0.20)",
                  color: filled ? "#fff" : active ? "#C9A84C" : "#6E558B",
                }}
              >
                {filled ? <CheckCircle2 className="h-3.5 w-3.5" /> : t + 1}
              </div>
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold" style={{ color: filled ? "#16C784" : active ? "#C9A84C" : "#6E558B" }}>
                {TIERS[t].label}
              </div>
            </div>
            {/* Connector */}
            {i < 2 && (
              <div className="flex-1 h-0.5 mx-1 rounded-full overflow-hidden" style={{ background: "rgba(165,150,201,0.15)" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: currentTier > t ? "100%" : "0%",
                    background: "linear-gradient(90deg, #16C784, #C9A84C)",
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Upload zone ──────────────────────────────────────────────────────────────
function UploadZone({
  step, done, uploading, onTrigger, icon: Icon, label, sublabel, accept, capture,
}: {
  step: UploadStep;
  done: boolean;
  uploading: UploadStep | null;
  onTrigger: () => void;
  icon: React.ElementType;
  label: string;
  sublabel: string;
  accept: string;
  capture?: "user" | "environment";
}) {
  const isUploading = uploading === step;

  return (
    <motion.div
      layout
      className="rounded-2xl border overflow-hidden transition-all"
      style={{
        background: done ? "rgba(22,199,132,0.04)" : "var(--dash-shell-bg, #1C0A35)",
        borderColor: done ? "rgba(22,199,132,0.20)" : "var(--dash-shell-border, rgba(165,150,201,0.22))",
      }}
    >
      <div className="p-4 flex items-center gap-3">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: done ? "rgba(22,199,132,0.12)" : "rgba(201,168,76,0.10)",
            border: `1px solid ${done ? "rgba(22,199,132,0.20)" : "rgba(201,168,76,0.15)"}`,
          }}
        >
          {done
            ? <CheckCircle2 className="h-5 w-5" style={{ color: "#16C784" }} />
            : <Icon className="h-5 w-5 text-[#C9A84C]" />
          }
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${done ? "" : "text-[#F0F1F5]"}`} style={done ? { color: "#16C784" } : undefined}>{label}</p>
          <p className="text-xs text-[#5A6B82] mt-0.5">{sublabel}</p>
        </div>

        {/* Status / button */}
        {done ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(22,199,132,0.10)", border: "1px solid rgba(22,199,132,0.20)" }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#16C784" }} />
            <span className="text-[10px] font-black uppercase tracking-wide" style={{ color: "#16C784" }}>Done</span>
          </div>
        ) : (
          <motion.button
            onClick={onTrigger}
            disabled={isUploading}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-1.5 px-3 h-8 rounded-xl text-xs font-bold
                       text-[#060D1F] disabled:opacity-50 transition-all shrink-0"
            style={{
              background: "linear-gradient(135deg, #E2CA6E, #C9A84C)",
              boxShadow: isUploading ? "none" : "0 4px 12px -2px rgba(201,168,76,0.4)",
            }}
          >
            {isUploading
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <><Upload className="h-3.5 w-3.5" /> Upload</>
            }
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function VerifyPage() {
  const router = useRouter();
  const toast  = useToast();

  const [status, setStatus]     = useState<KycStatus | null>(null);
  const [loading, setLoading]   = useState(true);
  const [uploading, setUploading] = useState<UploadStep | null>(null);
  const [docType, setDocType]   = useState("national_id");
  const [idNumber, setIdNumber] = useState("");
  const [showDocForm, setShowDocForm] = useState(false);

  // Level 1 form state
  const [l1FullName, setL1FullName] = useState("");
  const [l1Dob, setL1Dob]         = useState("");
  const [l1Country, setL1Country] = useState("HT");
  const [l1Address, setL1Address] = useState("");
  const [submittingL1, setSubmittingL1] = useState(false);

  const docInputRef     = useRef<HTMLInputElement>(null);
  const selfieInputRef  = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadStatus(); }, []);

  async function loadStatus() {
    try {
      const res = await kkGet<KycStatus>("v1/kyc/status");
      setStatus(res);
    } catch {
      toast.show("Failed to load KYC status", "error");
    } finally {
      setLoading(false);
    }
  }

  async function uploadFile(step: UploadStep, file: File) {
    setUploading(step);
    try {
      const reader  = new FileReader();
      const dataUri = await new Promise<string>((resolve, reject) => {
        reader.onload  = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const endpoint =
        step === "document" ? "v1/kyc/upload/document" :
        step === "selfie"   ? "v1/kyc/upload/selfie"   :
                              "v1/kyc/upload/address";

      const body: Record<string, string> = { file: dataUri };
      if (step === "document") {
        body.documentType = docType;
        if (idNumber) body.idNumber = idNumber;
      }

      await kkPost(endpoint, body);
      toast.show(
        step === "document" ? "ID document uploaded!" :
        step === "selfie"   ? "Selfie uploaded!" :
                              "Address proof uploaded!",
        "success"
      );
      await loadStatus();
    } catch (e: any) {
      toast.show(e.message || `Failed to upload ${step}`, "error");
    } finally {
      setUploading(null);
    }
  }

  function handleFileSelect(step: UploadStep, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.show("File too large. Maximum 10MB.", "error");
      return;
    }
    uploadFile(step, file);
    e.target.value = "";
  }

  async function submitLevel1() {
    if (!l1FullName.trim() || !l1Dob || !l1Country) {
      toast.show("Please fill in all required fields", "error");
      return;
    }
    setSubmittingL1(true);
    try {
      trackEvent("KYC Started");
      await kkPost("v1/kyc/level1", {
        fullName: l1FullName.trim(),
        dob: l1Dob,
        country: l1Country,
        address: l1Address.trim() || undefined,
      });
      toast.show("Identity info saved!", "success");
      await loadStatus();
    } catch (e: unknown) {
      toast.show((e as Error).message || "Failed to save identity info", "error");
    } finally {
      setSubmittingL1(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center pt-32 gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
          className="w-10 h-10 rounded-full border-2 border-transparent"
          style={{ borderTopColor: "#C9A84C" }}
        />
        <p className="text-sm text-[#5A6B82]">Loading your KYC status…</p>
      </div>
    );
  }

  const currentTier = status?.kycTier ?? 0;
  const tierCfg     = TIERS[Math.min(currentTier, TIERS.length - 1)];
  const isFullyVerified = currentTier >= 2;

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6 p-4 md:p-0">

      {/* Hidden file inputs */}
      <input ref={docInputRef}     type="file" accept="image/*,.pdf"  className="hidden" onChange={(e) => handleFileSelect("document", e)} />
      <input ref={selfieInputRef}  type="file" accept="image/*"       capture="user"     className="hidden" onChange={(e) => handleFileSelect("selfie", e)} />
      <input ref={addressInputRef} type="file" accept="image/*,.pdf"  className="hidden" onChange={(e) => handleFileSelect("address", e)} />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl text-[#6E558B] hover:text-[#E0E4EE] hover:bg-[#2A1050] transition-all"
          style={{ background: "var(--dash-shell-bg, #1C0A35)", border: "1px solid var(--dash-shell-border, rgba(165,150,201,0.22))" }}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-[#F0F1F5]">Verify Identity</h1>
          <p className="text-xs text-[#5A6B82] mt-0.5">Unlock higher limits and more features</p>
        </div>
      </motion.div>

      {/* ── Status hero card ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05 }}
        className="rounded-3xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${tierCfg.bg}, var(--dash-shell-bg, #1C0A35))`,
          border: `1px solid ${tierCfg.color}25`,
          boxShadow: `0 0 40px -12px ${tierCfg.color}30`,
        }}
      >
        <div className="p-6 flex flex-col items-center gap-3 text-center">
          {/* Shield icon */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: tierCfg.bg, border: `1.5px solid ${tierCfg.color}30` }}
          >
            {isFullyVerified
              ? <ShieldCheck className="h-8 w-8" style={{ color: tierCfg.color }} />
              : <Shield className="h-8 w-8" style={{ color: tierCfg.color }} />
            }
          </div>

          {/* Tier label */}
          <div>
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-2"
              style={{ background: tierCfg.bg, color: tierCfg.color, border: `1px solid ${tierCfg.color}25` }}
            >
              {isFullyVerified && <Sparkles className="h-3 w-3" />}
              KYC Tier {currentTier} — {tierCfg.label}
            </div>
            <p className="text-3xl font-black text-[#F0F1F5]">{tierCfg.limit}</p>
            <p className="text-xs text-[#5A6B82] mt-1">transfer limit</p>
          </div>
        </div>

        {/* Tier progress */}
        <div className="px-6 pb-6 pt-2">
          <TierProgress currentTier={currentTier} />
        </div>
      </motion.div>

      {/* ── Limits comparison ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-2"
      >
        {TIERS.slice(0, 3).map((t) => (
          <div
            key={t.tier}
            className="rounded-2xl border p-3 text-center transition-all"
            style={{
              background: currentTier >= t.tier ? `${t.color}08` : "var(--dash-shell-bg, #1C0A35)",
              borderColor: currentTier >= t.tier ? `${t.color}20` : "rgba(165,150,201,0.15)",
            }}
          >
            {currentTier >= t.tier
              ? <CheckCircle2 className="h-4 w-4 mx-auto mb-1" style={{ color: t.color }} />
              : <Lock className="h-4 w-4 mx-auto mb-1 text-[#3A4558]" />
            }
            <p className="text-[10px] font-black uppercase tracking-wide" style={{ color: currentTier >= t.tier ? t.color : "#3A4558" }}>
              {t.label}
            </p>
            <p className="text-xs font-bold text-[#F0F1F5] mt-0.5">{t.limit}</p>
          </div>
        ))}
      </motion.div>

      {/* ── Fully verified state ────────────────────────────────────────── */}
      {isFullyVerified ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 flex flex-col items-center gap-3 text-center"
          style={{ border: "1px solid rgba(22,199,132,0.20)", background: "rgba(22,199,132,0.04)" }}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(22,199,132,0.10)" }}>
            <ShieldCheck className="h-7 w-7" style={{ color: "#16C784" }} />
          </div>
          <div>
            <p className="text-lg font-black text-[#F0F1F5]">You're Fully Verified</p>
            <p className="text-sm text-[#5A6B82] mt-1">
              You have full access to KobKlein with a limit of {tierCfg.limit}.
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 px-5 h-10 rounded-xl text-sm font-bold text-[#060D1F]"
            style={{ background: "linear-gradient(135deg, #E2CA6E, #C9A84C)" }}
          >
            Back to Dashboard <ChevronRight className="h-4 w-4" />
          </button>
        </motion.div>
      ) : (
        /* ── Upload steps ──────────────────────────────────────────────── */
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col gap-4"
        >
          {/* ── Level 1 Identity Form (only shown when tier === 0) ──────── */}
          {currentTier === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl overflow-hidden"
              style={{ background: "var(--dash-shell-bg, #1C0A35)", border: "1px solid rgba(212,175,55,0.20)" }}
            >
              <div className="px-5 pt-5 pb-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--dash-shell-border, rgba(165,150,201,0.22))" }}>
                <div className="w-9 h-9 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center shrink-0">
                  <UserCheck className="h-4.5 w-4.5 text-[#C9A84C]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#F0F1F5]">Step 1 — Basic Identity</p>
                  <p className="text-[11px] text-[#5A6B82] mt-0.5">Enter your personal information to get started</p>
                </div>
              </div>

              <div className="p-5 flex flex-col gap-3">
                {/* Full name */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="l1-fullname" className="text-[10px] font-bold text-[#5A6B82] uppercase tracking-wider">
                    Full Legal Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="l1-fullname"
                    type="text"
                    value={l1FullName}
                    onChange={(e) => setL1FullName(e.target.value)}
                    placeholder="As it appears on your ID"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#240E3C]/60 border border-[#A596C9]/[0.20]
                               text-sm text-[#F0F1F5] placeholder-[#2A3448] outline-none
                               focus:border-[#C9A84C]/40 transition-colors"
                  />
                </div>

                {/* DOB + Country row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="l1-dob" className="text-[10px] font-bold text-[#5A6B82] uppercase tracking-wider">
                      Date of Birth <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="l1-dob"
                      type="date"
                      value={l1Dob}
                      onChange={(e) => setL1Dob(e.target.value)}
                      max={new Date(Date.now() - 18 * 365.25 * 86400000).toISOString().split("T")[0]}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#240E3C]/60 border border-[#A596C9]/[0.20]
                                 text-sm text-[#F0F1F5] outline-none focus:border-[#C9A84C]/40
                                 transition-colors [color-scheme:dark]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="l1-country" className="text-[10px] font-bold text-[#5A6B82] uppercase tracking-wider">
                      Country <span className="text-red-400">*</span>
                    </label>
                    <select
                      id="l1-country"
                      value={l1Country}
                      onChange={(e) => setL1Country(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#240E3C]/60 border border-[#A596C9]/[0.20]
                                 text-sm text-[#F0F1F5] outline-none focus:border-[#C9A84C]/40 transition-colors"
                    >
                      <option value="HT">Haiti</option>
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="FR">France</option>
                      <option value="DO">Dominican Republic</option>
                      <option value="BR">Brazil</option>
                      <option value="MX">Mexico</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                {/* Address (optional) */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="l1-address" className="text-[10px] font-bold text-[#5A6B82] uppercase tracking-wider">
                    Address <span className="font-normal normal-case text-[#3A4558]">(optional)</span>
                  </label>
                  <input
                    id="l1-address"
                    type="text"
                    value={l1Address}
                    onChange={(e) => setL1Address(e.target.value)}
                    placeholder="Street, city"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#240E3C]/60 border border-[#A596C9]/[0.20]
                               text-sm text-[#F0F1F5] placeholder-[#2A3448] outline-none
                               focus:border-[#C9A84C]/40 transition-colors"
                  />
                </div>

                {/* Submit */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={submitLevel1}
                  disabled={submittingL1 || !l1FullName.trim() || !l1Dob}
                  className="w-full h-11 rounded-xl flex items-center justify-center gap-2
                             text-sm font-bold text-[#060D1F] disabled:opacity-50 mt-1 transition-all"
                  style={{
                    background: "linear-gradient(135deg, #E2CA6E, #C9A84C)",
                    boxShadow: submittingL1 ? "none" : "0 6px 18px -4px rgba(201,168,76,0.4)",
                  }}
                >
                  {submittingL1
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                    : <><ChevronRight className="h-4 w-4" /> Continue to Document Upload</>
                  }
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── Document upload zones (only after Level 1 done) ─────────── */}
          {currentTier >= 1 && (<>
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-[#5A6B82] uppercase tracking-widest">
              Required Documents
            </p>
            <div className="flex items-center gap-1.5 text-xs text-[#5A6B82]">
              <Lock className="h-3 w-3" />
              End-to-end encrypted
            </div>
          </div>

          {/* Step 1 — Government ID */}
          <div className="flex flex-col gap-2">
            <UploadZone
              step="document"
              done={!!status?.documentUrl}
              uploading={uploading}
              onTrigger={() => {
                if (!status?.documentUrl) setShowDocForm((v) => !v);
              }}
              icon={FileText}
              label="Government ID"
              sublabel="National ID, passport, or driver license"
              accept="image/*,.pdf"
            />

            {/* Doc form — only when no doc uploaded yet */}
            <AnimatePresence>
              {!status?.documentUrl && showDocForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: "var(--dash-page-bg, #240E3C)", border: "1px solid var(--dash-shell-border, rgba(165,150,201,0.22))" }}>
                    {/* Doc type selector */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-[#5A6B82] uppercase tracking-wider">Document Type</label>
                      <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#240E3C]/60 border border-[#A596C9]/[0.20]
                                   text-sm text-[#F0F1F5] outline-none focus:border-[#C9A84C]/40 transition-colors"
                      >
                        {DOC_TYPES.map((d) => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* ID number */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-[#5A6B82] uppercase tracking-wider">
                        ID Number <span className="normal-case font-normal text-[#3A4558]">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value)}
                        placeholder="Enter your ID number"
                        className="w-full px-3 py-2.5 rounded-xl bg-[#240E3C]/60 border border-[#A596C9]/[0.20]
                                   text-sm text-[#F0F1F5] placeholder-[#2A3448] outline-none
                                   focus:border-[#C9A84C]/40 transition-colors"
                      />
                    </div>

                    {/* Upload button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => docInputRef.current?.click()}
                      disabled={uploading === "document"}
                      className="w-full h-11 rounded-xl flex items-center justify-center gap-2
                                 text-sm font-bold text-[#060D1F] disabled:opacity-50 transition-all"
                      style={{
                        background: "linear-gradient(135deg, #E2CA6E, #C9A84C)",
                        boxShadow: uploading === "document" ? "none" : "0 6px 18px -4px rgba(201,168,76,0.4)",
                      }}
                    >
                      {uploading === "document"
                        ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>
                        : <><Upload className="h-4 w-4" /> Choose File & Upload</>
                      }
                    </motion.button>

                    <p className="text-[10px] text-[#3A4558] text-center">Max 10MB · JPG, PNG, PDF accepted</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Step 2 — Selfie */}
          <UploadZone
            step="selfie"
            done={!!status?.selfieUrl}
            uploading={uploading}
            onTrigger={() => selfieInputRef.current?.click()}
            icon={Camera}
            label="Selfie Verification"
            sublabel="A clear photo of your face"
            accept="image/*"
            capture="user"
          />

          {/* Step 3 — Address proof (only for tier 1) */}
          {currentTier === 1 && (
            <UploadZone
              step="address"
              done={!!status?.addressProof}
              uploading={uploading}
              onTrigger={() => addressInputRef.current?.click()}
              icon={MapPin}
              label="Proof of Address"
              sublabel="Utility bill, bank statement, or official letter"
              accept="image/*,.pdf"
            />
          )}

          {/* Submitted notice + CTA */}
          <AnimatePresence>
            {status?.documentUrl && status?.selfieUrl && status?.kycStatus === "pending" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-[#C9A84C]/20 overflow-hidden"
                style={{ background: "rgba(201,168,76,0.05)" }}
              >
                {/* Notice */}
                <div className="p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-[#C9A84C] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-[#C9A84C]">
                      ✓ Documents Submitted — Under Review
                    </p>
                    <p className="text-xs text-[#7A8394] mt-0.5 leading-relaxed">
                      All done! Our compliance team is reviewing your documents. You&apos;ll
                      be notified within 24 hours once verified.
                    </p>
                  </div>
                </div>
                {/* Action buttons */}
                <div className="px-4 pb-4 flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push("/")}
                    className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2
                               text-sm font-bold text-[#060D1F] transition-all"
                    style={{
                      background: "linear-gradient(135deg, #E2CA6E, #C9A84C)",
                      boxShadow: "0 6px 18px -4px rgba(201,168,76,0.4)",
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                    Back to Dashboard
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push("/support")}
                    className="px-4 h-11 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: "var(--dash-shell-bg, #1C0A35)",
                      border: "1px solid var(--dash-shell-border, rgba(165,150,201,0.22))",
                      color: "#7A8394",
                    }}
                  >
                    Need Help?
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* What to expect */}
          <div className="rounded-2xl p-4 flex flex-col gap-2.5" style={{ background: "var(--dash-shell-bg, #1C0A35)", border: "1px solid rgba(165,150,201,0.12)" }}>
            <p className="text-[10px] font-black text-[#6E558B] uppercase tracking-widest">What happens next</p>
            {[
              { step: "1", text: "Fill in your identity info to complete Level 1" },
              { step: "2", text: "Upload your government ID and take a selfie" },
              { step: "3", text: "Our team reviews your documents (up to 24h)" },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-3 text-xs text-[#5A6B82]">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-[#6E558B] shrink-0" style={{ background: "var(--dash-page-bg, #240E3C)", border: "1px solid rgba(165,150,201,0.20)" }}>
                  {item.step}
                </div>
                {item.text}
              </div>
            ))}
          </div>
          </>)}
        </motion.div>
      )}

      <div className="h-4" />
    </div>
  );
}
