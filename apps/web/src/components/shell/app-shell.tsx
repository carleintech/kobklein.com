"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShieldAlert, X } from "lucide-react";
import { UserProvider, type AuthUser } from "@/context/user-context";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileNav } from "./mobile-nav";
import { kkGet, kkPost } from "@/lib/kobklein-api";
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications";
import { useRealtimeWallet } from "@/hooks/use-realtime-wallet";

const ONBOARDING_EXEMPT = ["/onboarding", "/settings/profile", "/settings/security"];
const ONBOARDING_DONE_KEY = "kk_onboarding_done";

/** Convert VAPID base64url public key to Uint8Array for PushManager.subscribe */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function AppShell({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  const [unreadCount, setUnreadCount]               = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed]     = useState(false);
  const [onboardingChecked, setOnboardingChecked]   = useState(false);
  const [fraudAlert, setFraudAlert]                 = useState<string | null>(null);
  const [localUserId, setLocalUserId]               = useState<string | null>(null);
  /** DB profilePhotoUrl — kept in sync with the profile page via custom event */
  const [profilePhotoUrl, setProfilePhotoUrl]       = useState<string | undefined>(
    user.profilePhotoUrl || user.picture || undefined,
  );
  const avatarSetRef = useRef(false); // prevent double-fetch
  const pathname = usePathname();
  const router   = useRouter();

  // ── Fetch initial unread count + localUserId (DB cuid for Realtime filters) ─
  useEffect(() => {
    kkGet<{ unread: number }>("v1/notifications/count")
      .then((r) => setUnreadCount(r?.unread ?? 0))
      .catch(() => {});
  }, []);

  // Fetch localUserId + profilePhotoUrl once (needed for Realtime filters + avatar)
  useEffect(() => {
    if (avatarSetRef.current) return;
    avatarSetRef.current = true;

    kkGet<{ id: string; profilePhotoUrl?: string | null }>("v1/users/me")
      .then((p) => {
        if (p?.id) setLocalUserId(p.id);
        if (p?.profilePhotoUrl) setProfilePhotoUrl(p.profilePhotoUrl);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Note: kk:profile-photo-updated event is handled inside UserProvider itself,
  // so no listener is needed here. AppShell only populates the initial DB value.

  // ── Realtime: new Notification → increment badge + detect fraud ──────────
  const handleNewNotification = useCallback((row: Record<string, unknown>) => {
    if (!row.read) {
      setUnreadCount((n) => n + 1);
    }
    if (row.type === "fraud.alert" && !row.read && typeof row.title === "string") {
      setFraudAlert(row.title);
    }
  }, []);

  useRealtimeNotifications(localUserId, handleNewNotification);

  // ── Realtime: Wallet UPDATE → log for downstream dashboard refresh ────────
  const handleWalletUpdate = useCallback((_row: Record<string, unknown>) => {
    // Dispatch a custom event so dashboard components can react without prop drilling
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("kk:wallet-updated", { detail: _row }));
    }
  }, []);

  useRealtimeWallet(localUserId, handleWalletUpdate);

  // ── Onboarding check — runs ONCE per session ──────────────────────────────
  useEffect(() => {
    if (onboardingChecked) return;
    if (typeof window !== "undefined" && sessionStorage.getItem(ONBOARDING_DONE_KEY) === "1") {
      setOnboardingChecked(true);
      return;
    }

    const isExempt = ONBOARDING_EXEMPT.some((p) => pathname?.startsWith(p));
    if (isExempt) return;

    kkGet<{ onboardingComplete: boolean; role: string }>("v1/users/me")
      .then((profile) => {
        setOnboardingChecked(true);
        if (profile.onboardingComplete) {
          sessionStorage.setItem(ONBOARDING_DONE_KEY, "1");
        } else {
          const role = profile.role || "client";
          router.replace(`/onboarding/${role}`);
        }
      })
      .catch(() => {
        setOnboardingChecked(true);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── GPS location registration (once per session) ──────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("kk_location_set")) return;
    if (!("geolocation" in navigator)) return;

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        kkPost("v1/users/location", { lat: coords.latitude, lng: coords.longitude })
          .then(() => sessionStorage.setItem("kk_location_set", "1"))
          .catch(() => {});
      },
      () => {}, // silently ignore denied/unavailable
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 3_600_000 },
    );
  }, []);

  // ── VAPID web push subscription ───────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (sessionStorage.getItem("kk_push_registered")) return;

    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          sessionStorage.setItem("kk_push_registered", "1");
          return;
        }

        const { publicKey } = await kkGet<{ publicKey: string }>("v1/push/vapid-public-key");
        if (!publicKey) return;

        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer,
        });

        await kkPost("v1/push/register", { webSubscription: sub.toJSON(), platform: "web" });
        sessionStorage.setItem("kk_push_registered", "1");
      } catch {
        // Silently ignore — push is optional
      }
    })();
  }, []);

  // ── Fraud alert banner ────────────────────────────────────────────────────
  useEffect(() => {
    kkGet<{ items: { id: string; title: string; read: boolean; type: string }[] }>(
      "v1/notifications?limit=10",
    )
      .then((r) => {
        const alert = r?.items?.find((n) => n.type === "fraud.alert" && !n.read);
        if (alert) setFraudAlert(alert.title);
      })
      .catch(() => {});
  }, []);

  const sidebarWidth = sidebarCollapsed ? 64 : 240;

  // Inject resolved avatar into user object so UserProvider initialises with it
  const resolvedUser: AuthUser = { ...user, profilePhotoUrl: profilePhotoUrl ?? user.profilePhotoUrl };

  return (
    <UserProvider user={resolvedUser} localUserId={localUserId ?? undefined}>
      {/* Sidebar — fixed left panel, desktop only */}
      <Sidebar unreadCount={unreadCount} onCollapsedChange={setSidebarCollapsed} />

      {/* Topbar — fixed top bar, full width */}
      <Topbar unreadCount={unreadCount} sidebarWidth={sidebarWidth} />

      {/* Fraud alert banner — fixed below topbar when unread fraud.alert exists */}
      {fraudAlert && (
        <div
          className="fixed left-0 right-0 z-40 flex items-center gap-3 px-4 py-2 max-md:pl-4"
          style={{
            top: 56,
            paddingLeft: sidebarWidth,
            background: "rgba(127,29,29,0.95)",
            borderBottom: "1px solid rgba(248,113,113,0.3)",
            backdropFilter: "blur(12px)",
          }}
        >
          <ShieldAlert className="w-4 h-4 shrink-0" style={{ color: "#F87171" }} />
          <span className="text-xs flex-1 truncate" style={{ color: "#FECACA" }}>{fraudAlert}</span>
          <Link href="/notifications" className="text-xs underline shrink-0" style={{ color: "#F87171" }}>
            View
          </Link>
          <button
            type="button"
            aria-label="Dismiss fraud alert"
            onClick={() => setFraudAlert(null)}
            className="ml-1 shrink-0"
          >
            <X className="w-4 h-4" style={{ color: "#F87171" }} />
          </button>
        </div>
      )}

      {/* Main content area */}
      <main
        className="min-h-screen pb-24 md:pb-8 transition-[padding-left] duration-300 ease-in-out max-md:!pl-0"
        style={{
          paddingLeft: sidebarWidth,
          paddingTop: fraudAlert ? 88 : 56,
          background: "var(--dash-main-bg, var(--dash-page-bg, #050F0C))",
        }}
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
