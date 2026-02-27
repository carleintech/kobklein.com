// ─── KobKlein Admin — Notification Hub (Server Page) ─────────────────────────
// Route: /notifications
// Auth: required — resolves role from Supabase JWT, passes to client hub.
// The client component (NotificationHub) enforces clearance-gated channel access.

import { redirect } from "next/navigation";
import { createAdminServerClient } from "@/lib/supabase-server";
import { resolveAdminRole } from "@/lib/admin-role";
import { NotificationHub } from "@/components/notifications/notification-hub";

export const metadata = {
  title: "Notification Hub — KobKlein Admin",
};

export default async function NotificationsPage() {
  const supabase = await createAdminServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const role = resolveAdminRole(user as unknown as Record<string, unknown>);

  return <NotificationHub role={role} />;
}
