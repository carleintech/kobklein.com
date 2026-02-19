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
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    kkGet<{ unread: number }>("v1/notifications/count")
      .then((r) => setUnreadCount(r?.unread ?? 0))
      .catch(() => {});

    // Refresh every 60 seconds
    const t = setInterval(() => {
      kkGet<{ unread: number }>("v1/notifications/count")
        .then((r) => setUnreadCount(r?.unread ?? 0))
        .catch(() => {});
    }, 60_000);
    return () => clearInterval(t);
  }, []);

  return (
    <UserProvider user={user}>
      <Sidebar unreadCount={unreadCount} />
      <Topbar unreadCount={unreadCount} />

      <div className="md:pl-[240px]">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-8">
          {children}
        </div>
      </div>

      <MobileNav unreadCount={unreadCount} />
    </UserProvider>
  );
}
