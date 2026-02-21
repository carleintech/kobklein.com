"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { UserProvider, type AuthUser } from "@/context/user-context";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileNav } from "./mobile-nav";
import { kkGet } from "@/lib/kobklein-api";

// Pages that should NOT trigger an onboarding redirect
const ONBOARDING_EXEMPT = ["/onboarding", "/settings/profile", "/settings/security"];

// Session storage key — set to "1" after onboarding completes so we skip
// the redirect check for the rest of the browser session
const ONBOARDING_DONE_KEY = "kk_onboarding_done";

export function AppShell({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  const [unreadCount, setUnreadCount]                 = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed]       = useState(false);
  // Track whether we've already confirmed onboarding is complete this session
  const [onboardingChecked, setOnboardingChecked]     = useState(false);
  const [onboardingComplete, setOnboardingComplete]   = useState<boolean | null>(null);
  const pathname = usePathname();
  const router   = useRouter();

  useEffect(() => {
    kkGet<{ unread: number }>("v1/notifications/count")
      .then((r) => setUnreadCount(r?.unread ?? 0))
      .catch(() => {});

    const t = setInterval(() => {
      kkGet<{ unread: number }>("v1/notifications/count")
        .then((r) => setUnreadCount(r?.unread ?? 0))
        .catch(() => {});
    }, 60_000);
    return () => clearInterval(t);
  }, []);

  // ── Onboarding check — runs ONCE per session ───────────────────────────────
  useEffect(() => {
    // If we've already confirmed complete this session, skip entirely
    if (onboardingChecked) return;
    if (typeof window !== "undefined" && sessionStorage.getItem(ONBOARDING_DONE_KEY) === "1") {
      setOnboardingChecked(true);
      setOnboardingComplete(true);
      return;
    }

    const isExempt = ONBOARDING_EXEMPT.some((p) => pathname?.startsWith(p));
    if (isExempt) return;

    kkGet<{ onboardingComplete: boolean; role: string }>("v1/users/me")
      .then((profile) => {
        setOnboardingChecked(true);
        setOnboardingComplete(profile.onboardingComplete);
        if (profile.onboardingComplete) {
          // Cache in sessionStorage so we never redirect again this session
          sessionStorage.setItem(ONBOARDING_DONE_KEY, "1");
        } else {
          const role = profile.role || "client";
          router.replace(`/onboarding/${role}`);
        }
      })
      .catch(() => {
        // Silently ignore — if the API is down, don't block the user
        setOnboardingChecked(true);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← Only runs once on mount, not on every route change

  const sidebarWidth = sidebarCollapsed ? 64 : 240;

  return (
    <UserProvider user={user}>
      {/*
        Layout structure:
        ┌─────────────────────────────────────────┐
        │  TOPBAR (fixed, full width, z-50)        │
        ├──────────┬──────────────────────────────┤
        │ SIDEBAR  │  CONTENT                     │
        │ (fixed)  │  (scrollable)                │
        └──────────┴──────────────────────────────┘

        Sidebar: fixed left-0 top-0, z-40, full height
        Topbar:  fixed top-0 left-0 right-0, z-50 (above sidebar)
        Content: margin-left = sidebarWidth, margin-top = topbar height (56px = 14*4)
      */}

      {/* Sidebar — fixed left panel, desktop only */}
      <Sidebar
        unreadCount={unreadCount}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Topbar — fixed top bar, full width */}
      <Topbar
        unreadCount={unreadCount}
        sidebarWidth={sidebarWidth}
      />

      {/* Main content area */}
      <main
        className="min-h-screen pt-14 pb-24 md:pb-8
                   transition-[padding-left] duration-300 ease-in-out
                   max-md:!pl-0"
        style={{ paddingLeft: sidebarWidth, background: "#050F0C" }}
      >
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 md:py-6">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <MobileNav unreadCount={unreadCount} />
    </UserProvider>
  );
}
