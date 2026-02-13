import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KobKlein — Digital Financial Sovereignty for Haiti",
  description:
    "The sovereign digital financial platform. Send money instantly. No banks required. Secure, cashless wallet for Haitians and their families worldwide.",
  keywords: [
    "KobKlein",
    "Haiti",
    "digital wallet",
    "mobile money",
    "remittance",
    "send money Haiti",
    "diaspora",
    "K-Pay",
    "fintech Haiti",
    "K-Card",
    "K-Link",
  ],
  openGraph: {
    title: "KobKlein — Digital Financial Sovereignty",
    description: "Send money instantly. No banks required.",
    type: "website",
    locale: "en_US",
    siteName: "KobKlein",
  },
  twitter: {
    card: "summary_large_image",
    title: "KobKlein — Digital Financial Sovereignty",
    description: "Send money instantly. No banks required.",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-kob-black text-kob-body antialiased">{children}</body>
    </html>
  );
}
