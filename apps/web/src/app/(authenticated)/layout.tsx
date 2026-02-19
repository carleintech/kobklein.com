import { createServerSupabase } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { Providers } from "../providers";
import { AppShell } from "@/components/shell/app-shell";
import type { AuthUser } from "@/context/user-context";

/**
 * Authenticated layout — Supabase session required.
 * Server component: gets Supabase user, extracts user info,
 * then renders Providers + AppShell (sidebar, topbar, mobile nav).
 */
export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Extract user info from Supabase user object
  const meta = user.user_metadata || {};
  const authUser: AuthUser = {
    sub: user.id,
    name: meta.full_name || meta.name || undefined,
    email: user.email || undefined,
    picture: meta.picture || meta.avatar_url || undefined,
    role: meta.role || undefined,
  };

  return (
    <Providers>
      <AppShell user={authUser}>
        {children}
      </AppShell>
    </Providers>
  );
}
