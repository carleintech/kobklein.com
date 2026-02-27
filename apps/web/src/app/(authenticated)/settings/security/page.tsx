"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { kkPost, kkDelete } from "@/lib/kobklein-api";
import { createBrowserSupabase } from "@/lib/supabase";
import {
  ArrowLeft, ShieldAlert, Lock, LockOpen, Loader2, AlertTriangle,
  CheckCircle2, X, ShieldCheck, KeyRound, Mail, Trash2,
} from "lucide-react";

// ─── Lock Confirm modal ────────────────────────────────────────────────────────
function LockConfirmModal({
  onConfirm, onCancel, loading,
}: { onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{ background: "rgba(6,13,31,0.90)", backdropFilter: "blur(8px)" }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 40 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border border-red-500/20 p-6 flex flex-col gap-5"
        style={{ background: "#091C14" }}
      >
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 mx-auto flex items-center justify-center">
          <Lock className="h-7 w-7 text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-lg font-black text-[#F0F1F5]">Lock Your Account?</p>
          <p className="text-sm text-[#7A8394] mt-2 leading-relaxed">
            This will immediately block <span className="text-[#F0F1F5] font-medium">all transfers and payments</span>. Contact support to restore access.
          </p>
        </div>
        <div className="rounded-xl bg-red-500/08 border border-red-500/15 px-4 py-3 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-300/80 leading-relaxed">
            Use this only if your phone is lost or stolen. This action requires contacting support to reverse.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="h-11 rounded-xl bg-[#0D2018] border border-white/[0.07] text-sm font-bold text-[#B8BCC8] hover:text-[#F0F1F5] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="h-11 rounded-xl bg-red-500/15 border border-red-500/25 text-sm font-bold text-red-400 hover:bg-red-500/25 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Lock className="h-4 w-4" /> Lock Now</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Delete Account Confirm modal ─────────────────────────────────────────────
function DeleteConfirmModal({
  onConfirm, onCancel, loading,
}: { onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  const [typed, setTyped] = useState("");
  const confirmed = typed.trim().toUpperCase() === "DELETE";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{ background: "rgba(6,13,31,0.95)", backdropFilter: "blur(8px)" }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 40 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border border-red-500/25 p-6 flex flex-col gap-5"
        style={{ background: "#091C14" }}
      >
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 mx-auto flex items-center justify-center">
          <Trash2 className="h-8 w-8 text-red-400" />
        </div>

        {/* Text */}
        <div className="text-center">
          <p className="text-lg font-black text-[#F0F1F5]">Delete Your Account?</p>
          <p className="text-sm text-[#7A8394] mt-2 leading-relaxed">
            This is <span className="text-red-400 font-bold">permanent and irreversible</span>. All your data, wallet history, and profile information will be erased from our system.
          </p>
        </div>

        {/* Warning list */}
        <div className="rounded-xl bg-red-500/06 border border-red-500/12 px-4 py-3 flex flex-col gap-2">
          {[
            "Your wallet and balance history will be lost",
            "Your K-ID and handle cannot be recovered",
            "Your profile photo will be deleted",
            "You will be signed out immediately",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2">
              <X className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300/80">{item}</p>
            </div>
          ))}
        </div>

        {/* Type confirmation */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-[#5A6B82]">
            Type <span className="font-bold text-red-400">DELETE</span> to confirm
          </label>
          <input
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="DELETE"
            className="w-full bg-[#0D2018] border border-white/[0.07] rounded-xl px-3 py-2.5
                       text-sm text-[#F0F1F5] placeholder-[#3A4558] outline-none
                       focus:border-red-500/40 transition-colors text-center tracking-widest font-bold uppercase"
          />
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="h-11 rounded-xl bg-[#0D2018] border border-white/[0.07] text-sm font-bold text-[#B8BCC8] hover:text-[#F0F1F5] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || !confirmed}
            className="h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: confirmed ? "rgba(239,68,68,0.20)" : "rgba(239,68,68,0.08)",
              border: `1px solid ${confirmed ? "rgba(239,68,68,0.40)" : "rgba(239,68,68,0.15)"}`,
              color: confirmed ? "#F87171" : "#7A8394",
            }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="h-4 w-4" /> Delete</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function SecurityPage() {
  const router = useRouter();

  // Emergency lock / unlock
  const [showConfirm, setShowConfirm]   = useState(false);
  const [locking, setLocking]           = useState(false);
  const [locked, setLocked]             = useState(false);
  const [unlocking, setUnlocking]       = useState(false);
  const [selfUnlocked, setSelfUnlocked] = useState(false);
  const [adminLocked, setAdminLocked]   = useState(false);
  const [error, setError]               = useState("");

  // Unlock request
  const [unlockLoading,  setUnlockLoading]  = useState(false);
  const [unlockSent,     setUnlockSent]     = useState(false);
  const [unlockPending,  setUnlockPending]  = useState(false);
  const [unlockError,    setUnlockError]    = useState("");
  const [unlockReason,   setUnlockReason]   = useState("");
  const [showUnlockForm, setShowUnlockForm] = useState(false);

  // Password reset
  const [pwLoading,   setPwLoading]   = useState(false);
  const [pwSent,      setPwSent]      = useState(false);
  const [pwError,     setPwError]     = useState("");

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting,          setDeleting]          = useState(false);
  const [deleteError,       setDeleteError]       = useState("");

  async function handleLock() {
    setLocking(true);
    setError("");
    try {
      await kkPost("security/freeze", {});
      setShowConfirm(false);
      setLocked(true);
      setSelfUnlocked(false);
    } catch (e: any) {
      setError(e.message || "Failed to lock account. Please try again.");
      setShowConfirm(false);
    } finally {
      setLocking(false);
    }
  }

  async function handleSelfUnlock() {
    setUnlocking(true);
    setError("");
    try {
      const res = await kkPost<{ ok: boolean; adminLocked?: boolean; message?: string }>("security/unfreeze", {});
      if (res.adminLocked) {
        setAdminLocked(true);
      } else {
        setLocked(false);
        setSelfUnlocked(true);
      }
    } catch (e: any) {
      setError(e.message || "Failed to unlock account. Please try again.");
    } finally {
      setUnlocking(false);
    }
  }

  async function handleUnlockRequest() {
    setUnlockLoading(true);
    setUnlockError("");
    try {
      const res = await kkPost<any>("v1/security/request-unlock", { reason: unlockReason || undefined });
      if (res.pending) setUnlockPending(true);
      else setUnlockSent(true);
      setShowUnlockForm(false);
    } catch (e: any) {
      setUnlockError(e.message || "Failed to submit unlock request.");
    } finally {
      setUnlockLoading(false);
    }
  }

  async function handlePasswordReset() {
    setPwLoading(true);
    setPwError("");
    try {
      const supabase = createBrowserSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("No email on file.");
      const { error: sbErr } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (sbErr) throw sbErr;
      setPwSent(true);
    } catch (e: any) {
      setPwError(e.message || "Failed to send password reset email.");
    } finally {
      setPwLoading(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError("");
    try {
      await kkDelete("v1/users/me");
      // Sign out from Supabase
      const supabase = createBrowserSupabase();
      await supabase.auth.signOut();
      // Redirect to home/auth
      router.replace("/");
    } catch (e: any) {
      setDeleteError(e.message || "Failed to delete account. Please try again.");
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="max-w-lg mx-auto flex flex-col gap-6 p-4 md:p-0">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-[#0D2018] hover:bg-[#122A1E] text-[#7A8394] hover:text-[#E0E4EE] transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-[#F0F1F5]">Security</h1>
            <p className="text-xs text-[#5A6B82] mt-0.5">Protect your account</p>
          </div>
        </motion.div>

        {/* Self-unlocked success state */}
        <AnimatePresence>
          {selfUnlocked && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-[#10B981]/20 bg-[#10B981]/05 p-5 flex items-start gap-3"
            >
              <CheckCircle2 className="h-5 w-5 text-[#10B981] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-[#10B981]">Account Unlocked</p>
                <p className="text-xs text-[#7A8394] mt-0.5 leading-relaxed">
                  Your account has been restored. All features are now available.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Locked state — with self-unlock option */}
        <AnimatePresence>
          {locked && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-[#C9A84C]/20 overflow-hidden"
              style={{ background: "#100D08" }}
            >
              <div className="h-0.5 w-full bg-gradient-to-r from-[#C9A84C]/60 via-[#C9A84C]/20 to-transparent" />
              <div className="p-5 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center shrink-0">
                    <Lock className="h-5 w-5 text-[#C9A84C]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#C9A84C]">Account Locked</p>
                    <p className="text-xs text-[#7A8394] mt-0.5 leading-relaxed">
                      {adminLocked
                        ? "Your account was locked by our security team. Contact support to restore access."
                        : "All transfers and payments are currently blocked. You can unlock your account instantly below."}
                    </p>
                  </div>
                </div>

                {!adminLocked && (
                  <motion.button
                    onClick={handleSelfUnlock}
                    disabled={unlocking}
                    whileHover={{ scale: unlocking ? 1 : 1.02 }}
                    whileTap={{ scale: unlocking ? 1 : 0.98 }}
                    className="w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    style={{
                      background: "rgba(16,185,129,0.12)",
                      border: "1px solid rgba(16,185,129,0.25)",
                      color: "#10B981",
                    }}
                  >
                    {unlocking ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <><LockOpen className="h-4 w-4" /> Unlock My Account</>
                    )}
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error state */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-red-500/15 bg-red-500/08 px-4 py-3 flex items-center gap-2.5"
            >
              <X className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-300">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Emergency lock card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07 }}
          className="rounded-2xl border border-red-500/12 overflow-hidden"
          style={{ background: "#1A0909" }}
        >
          <div className="h-0.5 w-full bg-gradient-to-r from-red-500/60 via-red-400/30 to-transparent" />
          <div className="p-5 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <ShieldAlert className="h-5 w-5 text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-[#F0F1F5]">Emergency Lock</p>
                <p className="text-xs text-[#5A6B82] mt-0.5 leading-relaxed">
                  Immediately freeze your account if your phone is lost or stolen. Prevents all money transfers and payments.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-[#0D2018] border border-white/[0.05] p-3 flex flex-col gap-1.5">
              {[
                "Blocks all outgoing transfers instantly",
                "Blocks merchant payments and QR codes",
                "Keeps your balance safe and untouched",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs text-[#7A8394]">
                  <div className="w-1 h-1 rounded-full bg-red-400/60 shrink-0" />
                  {item}
                </div>
              ))}
            </div>

            <motion.button
              onClick={() => { if (!locked) setShowConfirm(true); }}
              disabled={locked}
              whileHover={{ scale: locked ? 1 : 1.02 }}
              whileTap={{ scale: locked ? 1 : 0.98 }}
              className="w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2
                         disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{
                background: locked ? "rgba(239,68,68,0.10)" : "rgba(239,68,68,0.15)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: locked ? "#5A6B82" : "#F87171",
              }}
            >
              <Lock className="h-4 w-4" />
              {locked ? "Account Locked" : "Lock My Account"}
            </motion.button>
          </div>
        </motion.div>

        {/* Info card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.12 }}
          className="rounded-2xl bg-[#081510] border border-white/[0.04] p-4 flex flex-col gap-2.5"
        >
          <p className="text-[10px] font-black text-[#3A4558] uppercase tracking-widest">To restore access</p>
          <p className="text-xs text-[#4A5A72] leading-relaxed">
            After locking your account, contact KobKlein support with your verified identity to restore access. Response time is typically within 2 business hours.
          </p>
        </motion.div>

        {/* ── Unlock Request ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-[#0D9E8A]/[0.12] overflow-hidden"
          style={{ background: "#091C14" }}
        >
          <div className="h-0.5 w-full bg-gradient-to-r from-[#0D9E8A]/60 via-[#0D9E8A]/20 to-transparent" />
          <div className="p-5 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#0D9E8A]/10 border border-[#0D9E8A]/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5 text-[#0D9E8A]" />
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-[#F0F1F5]">Request Account Unlock</p>
                <p className="text-xs text-[#5A6B82] mt-0.5 leading-relaxed">
                  If your account has been locked or frozen, submit an unlock request to support.
                </p>
              </div>
            </div>

            <AnimatePresence>
              {unlockSent && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-[#0D9E8A]/08 border border-[#0D9E8A]/15 px-4 py-3 flex items-center gap-2.5"
                >
                  <CheckCircle2 className="h-4 w-4 text-[#0D9E8A] shrink-0" />
                  <p className="text-xs text-[#0D9E8A]">Unlock request submitted. Support will contact you within 2 business hours.</p>
                </motion.div>
              )}
              {unlockPending && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-[#C9A84C]/08 border border-[#C9A84C]/15 px-4 py-3 flex items-center gap-2.5"
                >
                  <AlertTriangle className="h-4 w-4 text-[#C9A84C] shrink-0" />
                  <p className="text-xs text-[#E1C97A]">You already have a pending unlock request. Support will be in touch soon.</p>
                </motion.div>
              )}
              {unlockError && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-red-500/08 border border-red-500/15 px-4 py-3 flex items-center gap-2.5"
                >
                  <X className="h-4 w-4 text-red-400 shrink-0" />
                  <p className="text-xs text-red-300">{unlockError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {!unlockSent && !unlockPending && (
              <>
                {showUnlockForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    className="overflow-hidden"
                  >
                    <textarea
                      value={unlockReason}
                      onChange={(e) => setUnlockReason(e.target.value)}
                      placeholder="Optional: describe the situation (e.g. phone was lost, account frozen in error…)"
                      rows={3}
                      className="w-full bg-[#0D2018] border border-white/[0.07] rounded-xl px-3 py-2.5
                                 text-sm text-[#B8BCC8] placeholder-[#3A4558] resize-none outline-none
                                 focus:border-[#0D9E8A]/30 transition-colors"
                    />
                  </motion.div>
                )}
                <div className="flex gap-2">
                  {showUnlockForm ? (
                    <>
                      <button
                        onClick={() => setShowUnlockForm(false)}
                        className="flex-1 h-10 rounded-xl bg-[#0D2018] border border-white/[0.07] text-xs font-bold text-[#7A8394] hover:text-[#F0F1F5] transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUnlockRequest}
                        disabled={unlockLoading}
                        className="flex-1 h-10 rounded-xl bg-[#0D9E8A]/15 border border-[#0D9E8A]/25 text-xs font-bold text-[#0D9E8A] hover:bg-[#0D9E8A]/25 transition-all flex items-center justify-center gap-1.5"
                      >
                        {unlockLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><ShieldCheck className="h-3.5 w-3.5" /> Submit Request</>}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setShowUnlockForm(true)}
                      className="w-full h-10 rounded-xl bg-[#0D9E8A]/10 border border-[#0D9E8A]/20 text-sm font-bold text-[#0D9E8A] hover:bg-[#0D9E8A]/20 transition-all flex items-center justify-center gap-2"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Request Unlock
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* ── Change Password ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="rounded-2xl border border-white/[0.06] overflow-hidden"
          style={{ background: "#091C14" }}
        >
          <div className="p-5 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center shrink-0">
                <KeyRound className="h-5 w-5 text-[#C9A84C]" />
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-[#F0F1F5]">Change Password</p>
                <p className="text-xs text-[#5A6B82] mt-0.5 leading-relaxed">
                  We'll send a password reset link to your registered email address.
                </p>
              </div>
            </div>

            <AnimatePresence>
              {pwSent && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-[#C9A84C]/08 border border-[#C9A84C]/15 px-4 py-3 flex items-center gap-2.5"
                >
                  <Mail className="h-4 w-4 text-[#C9A84C] shrink-0" />
                  <p className="text-xs text-[#C9A84C]">Password reset email sent. Check your inbox.</p>
                </motion.div>
              )}
              {pwError && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-red-500/08 border border-red-500/15 px-4 py-3 flex items-center gap-2.5"
                >
                  <X className="h-4 w-4 text-red-400 shrink-0" />
                  <p className="text-xs text-red-300">{pwError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {!pwSent && (
              <button
                onClick={handlePasswordReset}
                disabled={pwLoading}
                className="w-full h-10 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 text-sm font-bold text-[#C9A84C] hover:bg-[#C9A84C]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {pwLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Mail className="h-4 w-4" /> Send Reset Email</>}
              </button>
            )}
          </div>
        </motion.div>

        {/* ── Delete Account ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="rounded-2xl border border-red-900/30 overflow-hidden"
          style={{ background: "#0C0A0A" }}
        >
          <div className="h-0.5 w-full bg-gradient-to-r from-red-900/80 via-red-800/30 to-transparent" />
          <div className="p-5 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-red-900/20 border border-red-900/30 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-red-400">Delete My Account</p>
                <p className="text-xs text-[#4A3A3A] mt-0.5 leading-relaxed">
                  Permanently erase your account and all associated data from our system. This cannot be undone.
                </p>
              </div>
            </div>

            <AnimatePresence>
              {deleteError && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-red-500/08 border border-red-500/15 px-4 py-3 flex items-center gap-2.5"
                >
                  <X className="h-4 w-4 text-red-400 shrink-0" />
                  <p className="text-xs text-red-300">{deleteError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              className="w-full h-10 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all
                         border border-red-900/40 disabled:opacity-50"
              style={{ background: "rgba(120,20,20,0.12)", color: "#EF4444" }}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <><Trash2 className="h-4 w-4" /> Delete My Account</>
              )}
            </button>

            <p className="text-[10px] text-[#3A2020] text-center leading-relaxed">
              Once deleted, your account cannot be recovered. Make sure you have withdrawn your balance before proceeding.
            </p>
          </div>
        </motion.div>

      </div>

      {/* Lock confirm modal */}
      <AnimatePresence>
        {showConfirm && (
          <LockConfirmModal
            onConfirm={handleLock}
            onCancel={() => setShowConfirm(false)}
            loading={locking}
          />
        )}
      </AnimatePresence>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <DeleteConfirmModal
            onConfirm={handleDeleteAccount}
            onCancel={() => setShowDeleteConfirm(false)}
            loading={deleting}
          />
        )}
      </AnimatePresence>
    </>
  );
}
