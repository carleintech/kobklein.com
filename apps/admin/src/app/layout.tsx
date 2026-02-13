import type { Metadata } from "next";
import { Auth0Provider } from "@auth0/nextjs-auth0";
import { auth0 } from "@/lib/auth0";
import { Shell } from "@/components/shell/shell";
import { AdminProviders } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "KobKlein Admin",
  description: "Operations Command Center",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth0.getSession();

  return (
    <html lang="en">
      <body>
        <Auth0Provider user={session?.user}>
          <AdminProviders>
            <Shell>{children}</Shell>
          </AdminProviders>
        </Auth0Provider>
      </body>
    </html>
  );
}
