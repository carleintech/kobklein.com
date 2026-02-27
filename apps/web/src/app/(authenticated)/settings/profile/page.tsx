"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { kkGet, kkPatch } from "@/lib/kobklein-api";
import { createBrowserSupabase } from "@/lib/supabase";
import { useToast } from "@kobklein/ui";
import {
  ArrowLeft, Loader2, User, Mail, Phone, AtSign, Check, Lock,
  Camera, X, AlertTriangle, ArrowRight,
} from "lucide-react";

type UserProfile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  handle: string | null;
  profilePhotoUrl: string | null;
  onboardingComplete: boolean;
  role: string;
};

function Field({
  label, value, onChange, icon: Icon, readOnly, type = "text", placeholder,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  icon: React.ElementType;
  readOnly?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black text-[#5A6B82] uppercase tracking-widest">{label}</label>
      <div
        className="relative rounded-xl border transition-all overflow-hidden"
        style={{
          background: readOnly ? "#080F1C" : "#091C14",
          borderColor: readOnly ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.08)",
        }}
      >
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <Icon className="h-4 w-4" style={{ color: readOnly ? "#2A3448" : "#5A6B82" }} />
        </div>
        {readOnly && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Lock className="h-3.5 w-3.5 text-[#2A3448]" />
          </div>
        )}
        <input
          type={type}
          value={value}
          readOnly={readOnly}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent pl-9 pr-9 py-3 text-sm outline-none transition-colors"
          style={{
            color: readOnly ? "#3A4558" : "#F0F1F5",
            cursor: readOnly ? "not-allowed" : "text",
          }}
          onFocus={(e) => {
            if (!readOnly) {
              const parent = e.currentTarget.closest(".relative") as HTMLElement;
              if (parent) parent.style.borderColor = "rgba(201,168,76,0.40)";
            }
          }}
          onBlur={(e) => {
            const parent = e.currentTarget.closest(".relative") as HTMLElement;
            if (parent && !readOnly) parent.style.borderColor = "rgba(255,255,255,0.08)";
          }}
        />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router  = useRouter();
  const toast   = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile,   setProfile]   = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [photoUrl,  setPhotoUrl]  = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await kkGet<UserProfile>("v1/users/me");
        setProfile(data);
        setFirstName(data.firstName ?? "");
        setLastName(data.lastName ?? "");
        setPhotoUrl(data.profilePhotoUrl ?? null);
      } catch {
        toast.show("Failed to load profile", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Photo upload ─────────────────────────────────────────────────────────────
  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side size check (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.show("Photo must be under 5 MB", "error");
      return;
    }

    setUploading(true);
    try {
      const supabase = createBrowserSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload to Supabase Storage → bucket: profile-photos
      const ext  = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        // Give a helpful message for the "bucket not found" case
        if (
          uploadError.message?.toLowerCase().includes("bucket") ||
          uploadError.message?.toLowerCase().includes("not found") ||
          (uploadError as any).statusCode === 400 ||
          (uploadError as any).error === "Bucket not found"
        ) {
          throw new Error(
            "Storage bucket not set up yet. Go to Supabase Dashboard → Storage → New bucket → name it 'profile-photos' → set to Public."
          );
        }
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(path);

      const publicUrl = urlData.publicUrl + `?t=${Date.now()}`;
      setPhotoUrl(publicUrl);

      // Persist to backend
      await kkPatch("v1/users/profile", { profilePhotoUrl: publicUrl });
      toast.show("Photo updated!", "success");
    } catch (err: any) {
      toast.show(err.message || "Failed to upload photo", "error");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await kkPatch("v1/users/profile", { firstName, lastName });
      toast.show("Profile updated", "success");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      toast.show(e.message || "Failed to save changes", "error");
    } finally {
      setSaving(false);
    }
  }

  const isDirty  = firstName !== (profile?.firstName ?? "") || lastName !== (profile?.lastName ?? "");
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "?";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center pt-32 gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
          className="w-10 h-10 rounded-full border-2 border-transparent"
          style={{ borderTopColor: "#C9A84C" }}
        />
        <p className="text-sm text-[#5A6B82]">Loading profile…</p>
      </div>
    );
  }

  return (
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
          <h1 className="text-2xl font-black text-[#F0F1F5]">Profile</h1>
          <p className="text-xs text-[#5A6B82] mt-0.5">Your personal information</p>
        </div>
      </motion.div>

      {/* Onboarding banner — show if not complete */}
      <AnimatePresence>
        {profile && !profile.onboardingComplete && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onClick={() => router.push(`/onboarding/${profile.role || "client"}`)}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all"
            style={{
              background: "linear-gradient(135deg, rgba(201,168,76,0.10), rgba(201,168,76,0.04))",
              border: "1px solid rgba(201,168,76,0.25)",
            }}
          >
            <AlertTriangle className="h-5 w-5 text-[#C9A84C] shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-[#C9A84C]">Complete your onboarding</p>
              <p className="text-xs text-[#7A8394] mt-0.5">Set your handle, date of birth & transaction PIN to unlock all features.</p>
            </div>
            <ArrowRight className="h-4 w-4 text-[#C9A84C] shrink-0" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Avatar with photo upload */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05 }}
        className="flex items-center gap-4 rounded-2xl bg-[#091C14] border border-white/[0.06] p-5"
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Profile photo"
              className="w-16 h-16 rounded-2xl object-cover"
              style={{ border: "2px solid rgba(201,168,76,0.30)" }}
            />
          ) : (
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black text-white"
              style={{ background: "linear-gradient(135deg, #C9A84C, #9F7F2C)" }}
            >
              {initials}
            </div>
          )}

          {/* Camera overlay */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-[#C9A84C] flex items-center justify-center
                       shadow-lg hover:bg-[#E1C97A] transition-colors disabled:opacity-50"
            title="Upload photo"
          >
            {uploading
              ? <Loader2 className="h-3.5 w-3.5 text-[#060D1F] animate-spin" />
              : <Camera className="h-3.5 w-3.5 text-[#060D1F]" />
            }
          </button>

          {/* Hidden file input */}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-[#F0F1F5]">
            {firstName || lastName ? `${firstName} ${lastName}`.trim() : "Your Name"}
          </p>
          {profile?.handle && (
            <p className="text-sm text-[#5A6B82] mt-0.5">@{profile.handle}</p>
          )}
          {profile?.email && (
            <p className="text-xs text-[#3A4558] mt-0.5 truncate">{profile.email}</p>
          )}
          <p className="text-[10px] text-[#2A3448] mt-1">Tap the camera icon to change your photo</p>
        </div>
      </motion.div>

      {/* Editable fields */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl bg-[#091C14] border border-white/[0.06] p-5 flex flex-col gap-4"
      >
        <p className="text-[10px] font-black text-[#5A6B82] uppercase tracking-widest">Editable</p>
        <Field label="First Name" value={firstName} onChange={setFirstName} icon={User} placeholder="Your first name" />
        <Field label="Last Name"  value={lastName}  onChange={setLastName}  icon={User} placeholder="Your last name" />
      </motion.div>

      {/* Read-only fields */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.12 }}
        className="rounded-2xl bg-[#081510] border border-white/[0.04] p-5 flex flex-col gap-4"
      >
        <p className="text-[10px] font-black text-[#3A4558] uppercase tracking-widest">Read-only</p>
        <Field label="Email"    value={profile?.email ?? ""}                                  icon={Mail}   readOnly type="email" />
        <Field label="Phone"    value={profile?.phone ?? "Not set"}                            icon={Phone}  readOnly />
        <Field label="K-Handle" value={profile?.handle ? `@${profile.handle}` : "Not set"}   icon={AtSign} readOnly />
      </motion.div>

      {/* Your K-ID */}
      {profile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.14 }}
          className="rounded-2xl border border-[#0D9E8A]/[0.15] bg-[#071812] p-4 flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-xl bg-[#0D9E8A]/10 flex items-center justify-center shrink-0">
            <span className="text-[#0D9E8A] text-xs font-black">K</span>
          </div>
          <div>
            <p className="text-[10px] text-[#3A4558] uppercase tracking-widest">Your K-ID</p>
            <p className="text-sm font-bold text-[#0D9E8A] font-mono tracking-wider">
              {(profile as any).kId ?? "—"}
            </p>
          </div>
        </motion.div>
      )}

      {/* Save button */}
      <motion.button
        onClick={handleSave}
        disabled={saving || !isDirty || saved}
        whileHover={{ scale: isDirty && !saving ? 1.02 : 1 }}
        whileTap={{ scale: isDirty && !saving ? 0.98 : 1 }}
        className="w-full h-13 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2
                   disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        style={{
          background: saved
            ? "linear-gradient(135deg, #10B981, #059669)"
            : "linear-gradient(135deg, #E2CA6E, #C9A84C, #9F7F2C)",
          boxShadow: isDirty && !saving && !saved ? "0 8px 24px -4px rgba(201,168,76,0.4)" : "none",
          color: "#060D1F",
        }}
      >
        {saving  ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
        : saved   ? <><Check className="h-4 w-4" /> Saved!</>
        :            "Save Changes"
        }
      </motion.button>
    </div>
  );
}
