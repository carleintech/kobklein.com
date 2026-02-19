"use client";

import { UserProvider, type AuthUser } from "@/context/user-context";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileNav } from "./mobile-nav";

export function AppShell({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  return (
    <UserProvider user={user}>
      <Sidebar />
      <Topbar />

      <div className="md:pl-[240px]">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 pb-20 md:pb-6">
          {children}
        </div>
      </div>

      <MobileNav />
    </UserProvider>
  );
}
