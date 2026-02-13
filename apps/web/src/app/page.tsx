"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
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

export default function HomePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const [user, plan] = await Promise.all([
          apiGet<UserProfile>("v1/users/me"),
          apiGet<{ plan: { slug: string; name: string; tier: number } } | null>("v1/billing/my-plan").catch(() => null),
        ]);
        setProfile({
          ...user,
          planSlug: plan?.plan?.slug,
          planName: plan?.plan?.name,
          planTier: plan?.plan?.tier ?? 0,
        });
      } catch {
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
        <div className="w-10 h-10 rounded-xl bg-primary animate-pulse flex items-center justify-center">
          <span className="text-white font-bold">K</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2 pt-8">
          <div className="w-12 h-12 rounded-2xl bg-primary mx-auto flex items-center justify-center text-xl font-bold text-primary-foreground">
            K
          </div>
          <h1 className="text-2xl font-bold">KobKlein</h1>
          <p className="text-sm text-muted-foreground">
            Lajan dijital ou, an sekirite.
          </p>
        </div>

        <nav className="grid gap-3 pt-4">
          <a
            href="/wallet"
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:bg-secondary transition-colors"
          >
            <span className="text-lg">💰</span>
            <div>
              <div className="font-medium">Wallet</div>
              <div className="text-xs text-muted-foreground">
                Balance &amp; activity
              </div>
            </div>
          </a>
        </nav>
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
