import type { Metadata } from "next";
import Analytics from "./analytics";
import "./globals.css";

const BASE_URL = "https://kobklein.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
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
  alternates: {
    languages: {
      en: `${BASE_URL}/en`,
      fr: `${BASE_URL}/fr`,
      es: `${BASE_URL}/es`,
      ht: `${BASE_URL}/ht`,
    },
  },
  openGraph: {
    title: "KobKlein — Digital Financial Sovereignty",
    description: "Send money instantly. No banks required.",
    type: "website",
    locale: "en_US",
    siteName: "KobKlein",
    url: BASE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "KobKlein — Digital Financial Sovereignty",
    description: "Send money instantly. No banks required.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": ["Organization", "FinancialService"],
  name: "KobKlein",
  url: BASE_URL,
  logo: `${BASE_URL}/logo.png`,
  description:
    "The sovereign digital financial platform for Haiti. Send money instantly, pay merchants, and access the global economy.",
  foundingDate: "2024",
  areaServed: [
    { "@type": "Country", name: "Haiti" },
    { "@type": "Country", name: "United States" },
    { "@type": "Country", name: "Canada" },
    { "@type": "Country", name: "France" },
  ],
  sameAs: [
    "https://twitter.com/kobklein",
    "https://instagram.com/kobklein",
    "https://facebook.com/kobklein",
    "https://youtube.com/@kobklein",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    email: "support@kobklein.com",
    availableLanguage: ["English", "French", "Spanish", "Haitian Creole"],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-kob-black text-kob-body antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
