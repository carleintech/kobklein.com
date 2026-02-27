import { createServerSupabase } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { ROLE_DASHBOARD } from "@/lib/types/roles";
import type { UserRole } from "@/lib/types/roles";

/**
 * /dashboard — role-based redirect only.
 * Reads the authenticated user role from Supabase session and
 * redirects to their role-owned dashboard URL.
 * Server component — no client JS, instant redirect.
 */
export default async function DashboardPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = (user.user_metadata?.role ?? "client") as UserRole;
  redirect(ROLE_DASHBOARD[role] ?? "/client/dashboard");
}
