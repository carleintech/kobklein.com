"use client";

import { useEffect, useState } from "react";
import { UserProvider, type AuthUser } from "@/context/user-context";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileNav } from "./mobile-nav";
import { kkGet } from "@/lib/kobklein-api";

export function AppShell({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  const [unreadCount, setUnreadCount]           = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  const sidebarWidth = sidebarCollapsed ? 64 : 240;

  return (
    <UserProvider user={user}>
      {/* Sidebar — renders as hidden on mobile, visible on md+ */}
      <Sidebar
        unreadCount={unreadCount}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Topbar — offset shifts with sidebar on desktop */}
      <Topbar
        unreadCount={unreadCount}
        sidebarWidth={sidebarWidth}
      />

      {/*
        Content wrapper.
        - Mobile (< md): no sidebar → padding-left stays 0 via the "pl-0" class.
          We override the inline style with a higher-specificity class using md: prefix logic below.
        - Desktop (≥ md): sidebar is visible → apply inline padding-left = sidebarWidth.
      */}
      <ContentWrapper sidebarWidth={sidebarWidth}>
        {children}
      </ContentWrapper>

      {/* Mobile bottom nav */}
      <MobileNav unreadCount={unreadCount} />
    </UserProvider>
  );
}

/**
 * Separate component so we can use a ref to toggle the class after mount.
 * Simpler: just render two overlapping divs – one for mobile (no pl), one for desktop (with pl).
 * Both render `children` once via a portal-like trick using CSS display.
 *
 * Actually the cleanest approach: use a single div. On mobile, CSS overrides the inline style to 0.
 */
function ContentWrapper({
  sidebarWidth,
  children,
}: {
  sidebarWidth: number;
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Inline style sets desktop padding. The `max-md:!pl-0` Tailwind class resets it on mobile. */}
      <div
        className="transition-[padding-left] duration-300 ease-in-out max-md:!pl-0 pb-24 md:pb-8 min-h-screen"
        style={{ paddingLeft: sidebarWidth }}
      >
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 md:py-6">
          {children}
        </div>
      </div>
    </>
  );
}
