"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { kkGet, kkPost } from "@/lib/kobklein-api";
import { useToast } from "@kobklein/ui";
import {
  Shield, ShieldCheck, Camera, FileText, MapPin,
  Upload, CheckCircle2, Loader2, ChevronRight,
  Lock, Sparkles, AlertCircle, ArrowLeft,
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
  { tier: 1, label: "Basic",       limit: "$500/mo",    color: "#F59E0B", bg: "rgba(245,158,11,0.10)"  },
  { tier: 2, label: "Verified",    limit: "$5,000/mo",  color: "#10B981", bg: "rgba(16,185,129,0.10)"  },
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
                  background: filled ? "#10B981" : active ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.04)",
                  borderColor: filled ? "#10B981" : active ? "#C9A84C" : "rgba(255,255,255,0.08)",
                  color: filled ? "#fff" : active ? "#C9A84C" : "#3A4558",
                }}
              >
                {filled ? <CheckCircle2 className="h-3.5 w-3.5" /> : t + 1}
              </div>
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold" style={{ color: filled ? "#10B981" : active ? "#C9A84C" : "#3A4558" }}>
                {TIERS[t].label}
              </div>
            </div>
            {/* Connector */}
            {i < 2 && (
              <div className="flex-1 h-0.5 mx-1 rounded-full overflow-hidden bg-[#162038]">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: currentTier > t ? "100%" : "0%",
                    background: "linear-gradient(90deg, #10B981, #C9A84C)",
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
        background: done ? "rgba(16,185,129,0.04)" : "#0E1829",
        borderColor: done ? "rgba(16,185,129,0.20)" : "rgba(255,255,255,0.06)",
      }}
    >
      <div className="p-4 flex items-center gap-3">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: done ? "rgba(16,185,129,0.12)" : "rgba(201,168,76,0.10)",
            border: `1px solid ${done ? "rgba(16,185,129,0.20)" : "rgba(201,168,76,0.15)"}`,
          }}
        >
          {done
            ? <CheckCircle2 className="h-5 w-5 text-[#10B981]" />
            : <Icon className="h-5 w-5 text-[#C9A84C]" />
          }
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${done ? "text-[#10B981]" : "text-[#F0F1F5]"}`}>{label}</p>
          <p className="text-xs text-[#5A6B82] mt-0.5">{sublabel}</p>
        </div>

        {/* Status / button */}
        {done ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/20">
            <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            <span className="text-[10px] font-black text-[#10B981] uppercase tracking-wide">Done</span>
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
          className="p-2 rounded-xl bg-[#162038] hover:bg-[#1A2640] text-[#7A8394] hover:text-[#E0E4EE] transition-all"
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
          background: `linear-gradient(135deg, ${tierCfg.bg}, rgba(14,24,41,0.8))`,
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
              background: currentTier >= t.tier ? `${t.color}08` : "#0A1422",
              borderColor: currentTier >= t.tier ? `${t.color}20` : "rgba(255,255,255,0.04)",
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
          className="rounded-2xl border border-[#10B981]/20 bg-[#10B981]/05 p-6 flex flex-col items-center gap-3 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#10B981]/10 flex items-center justify-center">
            <ShieldCheck className="h-7 w-7 text-[#10B981]" />
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
                  <div className="rounded-2xl bg-[#0E1829] border border-white/[0.06] p-4 flex flex-col gap-3">
                    {/* Doc type selector */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-[#5A6B82] uppercase tracking-wider">Document Type</label>
                      <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#162038] border border-white/[0.07]
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
                        className="w-full px-3 py-2.5 rounded-xl bg-[#162038] border border-white/[0.07]
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

          {/* Submitted notice */}
          <AnimatePresence>
            {status?.documentUrl && status?.selfieUrl && currentTier === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-[#C9A84C]/20 p-4 flex items-start gap-3"
                style={{ background: "rgba(201,168,76,0.05)" }}
              >
                <AlertCircle className="h-5 w-5 text-[#C9A84C] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-[#C9A84C]">Documents Submitted</p>
                  <p className="text-xs text-[#7A8394] mt-0.5 leading-relaxed">
                    Our team is reviewing your documents. You'll receive a notification within 24 hours once verified.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* What to expect */}
          <div className="rounded-2xl bg-[#0A1422] border border-white/[0.04] p-4 flex flex-col gap-2.5">
            <p className="text-[10px] font-black text-[#3A4558] uppercase tracking-widest">What happens next</p>
            {[
              { step: "1", text: "Upload your government ID and take a selfie" },
              { step: "2", text: "Our team reviews your documents (up to 24h)" },
              { step: "3", text: "Get verified and unlock higher limits" },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-3 text-xs text-[#5A6B82]">
                <div className="w-5 h-5 rounded-full bg-[#162038] border border-white/[0.06] flex items-center justify-center text-[9px] font-black text-[#3A4558] shrink-0">
                  {item.step}
                </div>
                {item.text}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="h-4" />
    </div>
  );
}
