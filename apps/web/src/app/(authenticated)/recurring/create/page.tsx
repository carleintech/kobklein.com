"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { kkGet, kkPost } from "@/lib/kobklein-api";
import { useToast } from "@kobklein/ui";
import {
  ArrowLeft, Calendar, Check, ChevronRight,
  Crown, Loader2, RefreshCcw, Sparkles, Star, Zap,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type FamilyMember = {
  id: string;
  nickname?: string;
  relationship?: string;
  isFavorite?: boolean;
  familyUser: {
    id: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    handle?: string;
  };
};

type Schedule = { id: string; status: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const RELATIONSHIP_CONFIG: Record<string, { emoji: string; color: string[] }> = {
  parent:  { emoji: "👩", color: ["#C9A84C", "#9F7F2C"] },
  child:   { emoji: "👧", color: ["#0D9E8A", "#077A60"] },
  sibling: { emoji: "🧑", color: ["#10B981", "#059669"] },
  spouse:  { emoji: "💑", color: ["#EC4899", "#BE185D"] },
  cousin:  { emoji: "🤝", color: ["#8B5CF6", "#7C3AED"] },
  other:   { emoji: "👤", color: ["#6B7280", "#4B5563"] },
};

function memberDisplayName(m: FamilyMember): string {
  if (m.nickname) return m.nickname;
  if (m.familyUser.firstName) {
    const last = m.familyUser.lastName ? ` ${m.familyUser.lastName[0]}.` : "";
    return m.familyUser.firstName + last;
  }
  if (m.familyUser.handle) return `@${m.familyUser.handle}`;
  if (m.familyUser.phone) return m.familyUser.phone;
  return "Family";
}

function memberInitials(m: FamilyMember): string {
  return memberDisplayName(m).replace("@", "").slice(0, 2).toUpperCase();
}

const FREQ_OPTIONS = [
  {
    value: "weekly",
    label: "Every Week",
    desc: "4× per month",
    icon: Zap,
    color: "#10B981",
  },
  {
    value: "biweekly",
    label: "Every 2 Weeks",
    desc: "2× per month",
    icon: RefreshCcw,
    color: "#0D9E8A",
  },
  {
    value: "monthly",
    label: "Every Month",
    desc: "1× per month",
    icon: Calendar,
    color: "#C9A84C",
  },
];

// ─── Member selector card ─────────────────────────────────────────────────────
function MemberCard({
  member, selected, onClick,
}: { member: FamilyMember; selected: boolean; onClick: () => void }) {
  const name = memberDisplayName(member);
  const initials = memberInitials(member);
  const rel = member.relationship || "other";
  const { emoji, color } = RELATIONSHIP_CONFIG[rel] || RELATIONSHIP_CONFIG.other;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className="relative w-full rounded-2xl border p-3 text-left transition-all overflow-hidden"
      style={{
        background: selected ? "rgba(201,168,76,0.06)" : "#091C14",
        borderColor: selected ? "rgba(201,168,76,0.35)" : "rgba(255,255,255,0.06)",
        boxShadow: selected ? "0 0 20px -4px rgba(201,168,76,0.15)" : "none",
      }}
    >
      <div className="flex items-center gap-2.5">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
          style={{ background: `linear-gradient(135deg, ${color[0]}, ${color[1]})` }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-[#F0F1F5] truncate">{name}</span>
            {member.isFavorite && <Star className="h-3 w-3 text-[#C9A84C] fill-[#C9A84C] shrink-0" />}
          </div>
          <div className="text-[10px] text-[#5A6B82] flex items-center gap-1 mt-0.5">
            <span>{emoji}</span>
            <span className="capitalize">{rel}</span>
          </div>
        </div>
        {/* Check */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="w-5 h-5 rounded-full bg-[#C9A84C] flex items-center justify-center shrink-0"
            >
              <Check className="h-3 w-3 text-[#060D1F]" strokeWidth={3} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
}

// ─── Frequency selector ───────────────────────────────────────────────────────
function FreqCard({
  opt, selected, onClick, monthlyEst,
}: {
  opt: typeof FREQ_OPTIONS[number];
  selected: boolean;
  onClick: () => void;
  monthlyEst: number;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className="relative w-full rounded-2xl border p-4 text-left transition-all"
      style={{
        background: selected ? `${opt.color}09` : "#091C14",
        borderColor: selected ? `${opt.color}40` : "rgba(255,255,255,0.06)",
        boxShadow: selected ? `0 0 20px -4px ${opt.color}20` : "none",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${opt.color}15`, border: `1px solid ${opt.color}25` }}
        >
          <opt.icon className="h-5 w-5" style={{ color: opt.color }} />
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-[#F0F1F5]">{opt.label}</div>
          <div className="text-xs text-[#5A6B82]">{opt.desc}</div>
        </div>
        {selected && monthlyEst > 0 && (
          <div className="text-right shrink-0">
            <div className="text-xs font-black" style={{ color: opt.color }}>
              ~${Math.round(monthlyEst)}/mo
            </div>
          </div>
        )}
        {selected && (
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
            style={{ background: opt.color }}
          >
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          </div>
        )}
      </div>
    </motion.button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CreateRecurringPage() {
  const router = useRouter();
  const toast = useToast();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [amountUsd, setAmountUsd] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isGated, setIsGated] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1=member, 2=amount+freq, 3=review

  useEffect(() => {
    async function init() {
      try {
        const [members, schedulesRes, planRes] = await Promise.all([
          kkGet<FamilyMember[]>("v1/family/members"),
          kkGet<{ ok: boolean; schedules: Schedule[] } | Schedule[]>("v1/remittance/schedules").catch(() => []),
          kkGet<{ plan: { tier: number } } | null>("v1/billing/my-plan").catch(() => null),
        ]);
        setFamilyMembers(members);
        const schedules = Array.isArray(schedulesRes) ? schedulesRes : (schedulesRes as any).schedules || [];
        const activeCount = schedules.filter((s: Schedule) => s.status === "active").length;
        const planTier = (planRes as any)?.plan?.tier ?? 0;
        setIsGated(planTier === 0 && activeCount >= 1);
      } catch {
        toast.show("Failed to load data", "error");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function handleSubmit() {
    const member = familyMembers.find((m) => m.id === selectedMemberId);
    if (!member) return;
    setSubmitting(true);
    try {
      await kkPost("v1/remittance/schedule", {
        recipientUserId: member.familyUser.id,
        amountUsd: Number(amountUsd),
        frequency,
        note: note || undefined,
      });
      toast.show("Scheduled transfer created!", "success");
      router.push("/recurring");
    } catch (e: any) {
      toast.show(e.message || "Failed to create schedule", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const sortedMembers = [...familyMembers].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return 0;
  });

  const selectedMember = familyMembers.find((m) => m.id === selectedMemberId);
  const numAmount = parseFloat(amountUsd) || 0;
  const freqMults: Record<string, number> = { weekly: 4.33, biweekly: 2.17, monthly: 1 };
  const monthlyEst = numAmount * (freqMults[frequency] || 1);
  const freqOpt = FREQ_OPTIONS.find((f) => f.value === frequency)!;

  // Step indicator
  const steps = [
    { n: 1, label: "Recipient" },
    { n: 2, label: "Amount" },
    { n: 3, label: "Review" },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center pt-32 gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
          className="w-10 h-10 rounded-full border-2 border-transparent"
          style={{ borderTopColor: "#C9A84C" }}
        />
        <p className="text-sm text-[#5A6B82]">Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6 p-4 md:p-0">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <button
          type="button"
          onClick={() => (step > 1 ? setStep((s) => (s - 1) as 1 | 2 | 3) : router.back())}
          aria-label={step > 1 ? "Go to previous step" : "Go back"}
          title={step > 1 ? "Go to previous step" : "Go back"}
          className="p-2 rounded-xl bg-[#0D2018] hover:bg-[#122A1E] text-[#7A8394] hover:text-[#E0E4EE] transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-black text-[#F0F1F5]">New Scheduled Transfer</h1>
          <p className="text-xs text-[#5A6B82]">Step {step} of 3 — {steps[step - 1].label}</p>
        </div>
      </motion.div>

      {/* Step progress bar */}
      <div className="flex gap-1.5">
        {steps.map((s) => (
          <div
            key={s.n}
            className="flex-1 h-1 rounded-full transition-all duration-500"
            style={{
              background: step >= s.n
                ? "linear-gradient(90deg, #C9A84C, #E2CA6E)"
                : "rgba(255,255,255,0.06)",
            }}
          />
        ))}
      </div>

      {/* Plan gate */}
      {isGated && (
        <motion.button
          type="button"
          onClick={() => router.push("/settings/plan")}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full rounded-2xl border border-[#C9A84C]/25 bg-gradient-to-r from-[#C9A84C]/8 to-transparent p-4 flex items-center gap-3 text-left hover:border-[#C9A84C]/40 transition-all group"
        >
          <Crown className="h-7 w-7 text-[#C9A84C] shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-[#B8BCC8]">Upgrade Required</p>
            <p className="text-xs text-[#5A6B82]">Free plan: 1 active schedule. Upgrade for unlimited.</p>
          </div>
          <ChevronRight className="h-4 w-4 text-[#3A4558] group-hover:text-[#C9A84C] transition-colors" />
        </motion.button>
      )}

      {/* STEP 1: Select member */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="flex flex-col gap-4"
          >
            <p className="text-xs font-bold text-[#5A6B82] uppercase tracking-wider">
              Select Family Member
            </p>

            {sortedMembers.length === 0 ? (
              <div className="rounded-2xl bg-[#091C14] border border-white/[0.06] p-8 text-center">
                <p className="text-sm text-[#5A6B82]">No family members linked.</p>
                <p className="text-xs text-[#3A4558] mt-1">Add family from your dashboard first.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {sortedMembers.map((member) => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    selected={selectedMemberId === member.id}
                    onClick={() => setSelectedMemberId(member.id)}
                  />
                ))}
              </div>
            )}

            <motion.button
              onClick={() => {
                if (!selectedMemberId) { toast.show("Please select a family member", "error"); return; }
                setStep(2);
              }}
              disabled={!selectedMemberId || isGated}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-14 rounded-2xl font-bold text-base text-[#060D1F] flex items-center justify-center gap-2
                         disabled:opacity-40 disabled:cursor-not-allowed transition-all mt-2"
              style={{
                background: "linear-gradient(135deg, #E2CA6E 0%, #C9A84C 50%, #9F7F2C 100%)",
                boxShadow: selectedMemberId && !isGated ? "0 8px 24px -4px rgba(201,168,76,0.4)" : "none",
              }}
            >
              Continue <ChevronRight className="h-4 w-4" />
            </motion.button>
          </motion.div>
        )}

        {/* STEP 2: Amount + Frequency */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="flex flex-col gap-5"
          >
            {/* Selected member recap */}
            {selectedMember && (
              <div className="rounded-2xl bg-[#091C14] border border-white/[0.06] px-4 py-3 flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${(RELATIONSHIP_CONFIG[selectedMember.relationship || "other"] || RELATIONSHIP_CONFIG.other).color[0]}, ${(RELATIONSHIP_CONFIG[selectedMember.relationship || "other"] || RELATIONSHIP_CONFIG.other).color[1]})`,
                  }}
                >
                  {memberInitials(selectedMember)}
                </div>
                <span className="text-sm font-bold text-[#F0F1F5]">{memberDisplayName(selectedMember)}</span>
                <button
                  onClick={() => setStep(1)}
                  className="ml-auto text-xs text-[#5A6B82] hover:text-[#C9A84C] transition-colors"
                >
                  Change
                </button>
              </div>
            )}

            {/* Amount input */}
            <div className="rounded-2xl bg-[#091C14] border border-white/[0.07] p-5 flex flex-col gap-3">
              <label className="text-xs font-bold text-[#5A6B82] uppercase tracking-wider">Amount (USD)</label>
              <div
                className="relative rounded-xl border-2 transition-all"
                style={{
                  borderColor: numAmount > 0 ? "#C9A84C" : "rgba(255,255,255,0.08)",
                  boxShadow: numAmount > 0 ? "0 0 20px -4px rgba(201,168,76,0.2)" : "none",
                }}
              >
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6B82] text-sm font-bold">$</div>
                <input
                  type="number"
                  value={amountUsd}
                  onChange={(e) => setAmountUsd(e.target.value)}
                  placeholder="0.00"
                  min="1"
                  className="w-full bg-transparent text-right pr-4 pl-8 py-4 text-3xl font-black text-[#F0F1F5] placeholder-[#2A3448] outline-none"
                />
              </div>
              {numAmount > 0 && (
                <p className="text-xs text-[#5A6B82] text-center">
                  ≈ <span className="text-[#C9A84C] font-bold">${Math.round(monthlyEst)}/month</span> equivalent
                </p>
              )}
            </div>

            {/* Frequency */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[#5A6B82] uppercase tracking-wider">Frequency</label>
              {FREQ_OPTIONS.map((opt) => (
                <FreqCard
                  key={opt.value}
                  opt={opt}
                  selected={frequency === opt.value}
                  onClick={() => setFrequency(opt.value)}
                  monthlyEst={frequency === opt.value ? monthlyEst : 0}
                />
              ))}
            </div>

            {/* Note */}
            <div className="rounded-2xl bg-[#091C14] border border-white/[0.07] p-5 flex flex-col gap-3">
              <label className="text-xs font-bold text-[#5A6B82] uppercase tracking-wider">
                Note <span className="normal-case text-[#3A4558]">(optional)</span>
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g., School fees, groceries…"
                maxLength={60}
                className="w-full bg-[#0D2018] border border-white/[0.07] rounded-xl px-4 py-3 text-sm text-[#F0F1F5] placeholder-[#2A3448] outline-none focus:border-[#C9A84C]/40 transition-colors"
              />
            </div>

            <motion.button
              onClick={() => {
                if (!amountUsd || numAmount <= 0) { toast.show("Please enter a valid amount", "error"); return; }
                setStep(3);
              }}
              disabled={numAmount <= 0}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-14 rounded-2xl font-bold text-base text-[#060D1F] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              style={{
                background: "linear-gradient(135deg, #E2CA6E 0%, #C9A84C 50%, #9F7F2C 100%)",
                boxShadow: numAmount > 0 ? "0 8px 24px -4px rgba(201,168,76,0.4)" : "none",
              }}
            >
              Review <ChevronRight className="h-4 w-4" />
            </motion.button>
          </motion.div>
        )}

        {/* STEP 3: Review + Confirm */}
        {step === 3 && selectedMember && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="flex flex-col gap-5"
          >
            {/* Summary card */}
            <div className="rounded-2xl bg-[#091C14] border border-white/[0.07] overflow-hidden">
              {/* Gold header */}
              <div className="p-5 text-center border-b border-white/[0.05]"
                style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.08), rgba(201,168,76,0.02))" }}>
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <Sparkles className="h-4 w-4 text-[#C9A84C]" />
                  <p className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest">Schedule Summary</p>
                </div>
                <p className="text-4xl font-black text-[#F0F1F5]">${numAmount.toFixed(2)}</p>
                <p className="text-sm text-[#5A6B82] mt-1">USD per {frequency === "biweekly" ? "2 weeks" : frequency === "weekly" ? "week" : "month"}</p>
              </div>

              {/* Detail rows */}
              <div className="p-5 space-y-4">
                {[
                  { label: "Recipient", value: memberDisplayName(selectedMember) },
                  {
                    label: "Frequency",
                    value: FREQ_OPTIONS.find((f) => f.value === frequency)?.label || frequency,
                  },
                  { label: "Monthly equivalent", value: `~$${Math.round(monthlyEst)} USD` },
                  ...(note ? [{ label: "Note", value: note }] : []),
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center text-sm">
                    <span className="text-[#5A6B82]">{row.label}</span>
                    <span className="text-[#B8BCC8] font-medium text-right max-w-[180px] truncate">{row.value}</span>
                  </div>
                ))}

                <div className="border-t border-white/[0.05] pt-3 flex justify-between items-center text-sm">
                  <span className="text-[#5A6B82]">First transfer</span>
                  <span className="text-[#C9A84C] font-black">Today or next cycle</span>
                </div>
              </div>
            </div>

            {/* Confirm button */}
            <motion.button
              onClick={handleSubmit}
              disabled={submitting}
              whileHover={{ scale: submitting ? 1 : 1.02 }}
              whileTap={{ scale: submitting ? 1 : 0.98 }}
              className="w-full h-14 rounded-2xl font-bold text-base text-[#060D1F] flex items-center justify-center gap-2 disabled:opacity-70 transition-all"
              style={{
                background: "linear-gradient(135deg, #E2CA6E 0%, #C9A84C 50%, #9F7F2C 100%)",
                boxShadow: "0 8px 24px -4px rgba(201,168,76,0.45)",
              }}
            >
              {submitting ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Creating Schedule…</>
              ) : (
                <><Calendar className="h-5 w-5" /> Confirm Schedule</>
              )}
            </motion.button>

            <p className="text-center text-[10px] text-[#3A4558]">
              You can pause or cancel this schedule at any time
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
