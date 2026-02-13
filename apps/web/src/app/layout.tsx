import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { LanguageSwitcher } from "@/components/language-switcher";

export const metadata: Metadata = {
  title: "KobKlein",
  description: "Lajan dijital ou, an sekirite. Digital wallet for Haiti.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "KobKlein",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#080B14" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-kob-black text-kob-body antialiased">
        <Providers>
          {/* Top header bar */}
          <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#080B14]/90 backdrop-blur-md">
            <div className="max-w-md mx-auto flex items-center justify-between px-4 py-2.5">
              {/* Logo */}
              <a href="/" className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#C6A756] flex items-center justify-center text-white text-sm font-bold leading-none">
                  K
                </span>
                <span
                  className="text-sm font-semibold text-[#F2F2F2] tracking-wide"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  KobKlein
                </span>
              </a>

              {/* Language Switcher */}
              <LanguageSwitcher />
            </div>
          </header>

          <main className="min-h-screen max-w-md mx-auto px-4 py-6">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
