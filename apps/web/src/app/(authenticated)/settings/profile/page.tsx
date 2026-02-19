"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { kkGet, kkPatch } from "@/lib/kobklein-api";
import { useToast } from "@kobklein/ui";
import { ArrowLeft, Loader2 } from "lucide-react";

type UserProfile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  handle: string | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Editable fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await kkGet<UserProfile>("v1/users/me");
        setProfile(data);
        setFirstName(data.firstName ?? "");
        setLastName(data.lastName ?? "");
      } catch (e: any) {
        toast.show("Failed to load profile", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    setSaving(true);
    try {
      await kkPatch("v1/users/profile", { firstName, lastName });
      toast.show("Profile updated", "success");
    } catch (e: any) {
      toast.show(e.message || "Failed to save changes", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-32">
        <Loader2 className="h-8 w-8 animate-spin text-[#C9A84C]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 text-[#6B7489]" />
        </button>
        <h1
          className="text-2xl font-semibold text-[#F0F1F5]"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Profile
        </h1>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* First Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#6B7489] uppercase tracking-wider">
            First Name
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-xl bg-[#0F1D35] border border-white/10 px-4 py-2.5 text-sm text-[#F0F1F5] placeholder-[#6B7489] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/50 focus:border-[#C9A84C]/50 transition-colors"
          />
        </div>

        {/* Last Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#6B7489] uppercase tracking-wider">
            Last Name
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-xl bg-[#0F1D35] border border-white/10 px-4 py-2.5 text-sm text-[#F0F1F5] placeholder-[#6B7489] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/50 focus:border-[#C9A84C]/50 transition-colors"
          />
        </div>

        {/* Email (read-only) */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#6B7489] uppercase tracking-wider">
            Email
          </label>
          <input
            type="email"
            value={profile?.email ?? ""}
            readOnly
            className="w-full rounded-xl bg-[#0F1D35]/50 border border-white/5 px-4 py-2.5 text-sm text-[#6B7489] cursor-not-allowed"
          />
        </div>

        {/* Phone (read-only) */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#6B7489] uppercase tracking-wider">
            Phone
          </label>
          <input
            type="tel"
            value={profile?.phone ?? "Not set"}
            readOnly
            className="w-full rounded-xl bg-[#0F1D35]/50 border border-white/5 px-4 py-2.5 text-sm text-[#6B7489] cursor-not-allowed"
          />
        </div>

        {/* K-handle (read-only) */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#6B7489] uppercase tracking-wider">
            K-Handle
          </label>
          <input
            type="text"
            value={profile?.handle ? `@${profile.handle}` : "Not set"}
            readOnly
            className="w-full rounded-xl bg-[#0F1D35]/50 border border-white/5 px-4 py-2.5 text-sm text-[#6B7489] cursor-not-allowed"
          />
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2.5 rounded-xl bg-[#C9A84C] hover:bg-[#A07E2E] disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
