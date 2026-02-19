"use client";

import { useEffect, useState } from "react";
import { kkGet, ApiError } from "@/lib/kobklein-api";
import { ClientDashboard } from "@/components/dashboards/client";
import { DiasporaDashboard } from "@/components/dashboards/diaspora";
import { MerchantDashboard } from "@/components/dashboards/merchant";
import { DistributorDashboard } from "@/components/dashboards/distributor";

type UserProfile = {
  id: string;
  role: string;
  firstName?: string;
  handle?: string;
  kycTier: number;
  kycStatus?: string;
  planSlug?: string;
  planName?: string;
  planTier?: number;
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiDown, setApiDown] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const [user, plan] = await Promise.all([
          kkGet<UserProfile>("v1/users/me"),
          kkGet<{ plan: { slug: string; name: string; tier: number } } | null>("v1/billing/my-plan").catch(() => null),
        ]);
        setProfile({
          ...user,
          planSlug: plan?.plan?.slug,
          planName: plan?.plan?.name,
          planTier: plan?.plan?.tier ?? 0,
        });
      } catch (e) {
        if (e instanceof ApiError && e.isApiUnavailable) setApiDown(true);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-32">
        <div className="w-10 h-10 rounded-xl bg-[#C9A84C] animate-pulse flex items-center justify-center">
          <span className="text-white font-bold">K</span>
        </div>
      </div>
    );
  }

  if (apiDown) {
    return (
      <div className="max-w-lg mx-auto mt-12 rounded-2xl border border-yellow-600/30 bg-yellow-950/20 p-6 text-center space-y-3">
        <p className="text-sm font-medium text-yellow-300">API service is unavailable</p>
        <p className="text-xs text-[#7A8394]">
          The backend server is not responding. Run{" "}
          <code className="font-mono bg-white/5 px-1.5 py-0.5 rounded text-[#C4C7CF]">pnpm dev</code>{" "}
          from the project root to start all services.
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-lg mx-auto mt-12 rounded-2xl border border-red-600/30 bg-red-950/20 p-6 text-center space-y-3">
        <p className="text-sm font-medium text-red-300">Could not load your profile</p>
        <p className="text-xs text-[#7A8394]">
          Please try refreshing or logging out and back in.
        </p>
      </div>
    );
  }

  switch (profile.role) {
    case "diaspora":
      return <DiasporaDashboard profile={profile} />;
    case "merchant":
      return <MerchantDashboard profile={profile} />;
    case "distributor":
      return <DistributorDashboard profile={profile} />;
    default:
      return <ClientDashboard profile={profile} />;
  }
}
