import type { Metadata } from "next";
import { createAdminServerClient } from "@/lib/supabase-server";
import { resolveAdminRole } from "@/lib/admin-role";
import { Shell } from "@/components/shell/shell";
import { AdminProviders } from "./providers";
import { SentryInit } from "@/components/sentry-init";
import "./globals.css";

export const metadata: Metadata = {
  title: "KobKlein Admin",
  description: "Operations Command Center",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createAdminServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const adminRole = resolveAdminRole(user as unknown as Record<string, unknown> | undefined);
  const isAuthenticated = !!user;

  return (
    <html lang="en">
      <body>
        <SentryInit />
        <AdminProviders role={adminRole}>
          {isAuthenticated ? (
            <Shell>{children}</Shell>
          ) : (
            // Auth pages / portal render without the shell chrome
            <>{children}</>
          )}
        </AdminProviders>
      </body>
    </html>
  );
}
