import { createServerSupabase } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { Providers } from "../providers";
import { AppShell } from "@/components/shell/app-shell";
import { RoleTheme } from "@/components/shell/role-theme";
import type { AuthUser } from "@/context/user-context";

/**
 * Authenticated layout — Supabase session required.
 * Server component: gets Supabase user, extracts user info,
 * then renders Providers + AppShell (sidebar, topbar, mobile nav).
 *
 * RoleTheme is rendered HERE (not in per-role segment layouts) so the theme
 * persists across ALL authenticated pages — /wallet, /send, /transactions,
 * /settings, etc. — not just the role-owned dashboard routes.
 * Per-role layouts (client/, merchant/, etc.) are now pass-through only.
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
  const role = meta.role || "client";
  const authUser: AuthUser = {
    sub: user.id,
    name: meta.full_name || meta.name || undefined,
    email: user.email || undefined,
    picture: meta.picture || meta.avatar_url || undefined,
    role,
  };

  return (
    <Providers>
      {/* RoleTheme at root level — covers every authenticated page */}
      <RoleTheme role={role} />
      <AppShell user={authUser}>
        {children}
      </AppShell>
    </Providers>
  );
}
