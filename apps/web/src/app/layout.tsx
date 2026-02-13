import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="ht">
      <head>
        <meta name="theme-color" content="#080B14" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-kob-black text-kob-body antialiased">
        <main className="min-h-screen max-w-md mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
