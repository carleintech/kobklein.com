import { ShieldAlert, AlertTriangle } from "lucide-react";

const sections = [
  {
    number: "1",
    title: "Introduction",
    content:
      "This Risk Disclosure Statement is provided by KobKlein Inc. to inform users of the potential risks associated with using our digital financial services. By using the KobKlein platform, you acknowledge that you have read, understood, and accepted the risks described herein. This document supplements our Terms of Service and should be read in conjunction with all other legal documents available on our website.",
  },
  {
    number: "2",
    title: "Digital Currency & Electronic Money Risks",
    content:
      "Digital wallets and electronic money services carry inherent risks. The value stored in your KobKlein wallet is denominated in Haitian Gourdes (HTG) or other supported currencies and is subject to exchange rate fluctuations. Unlike traditional bank deposits, funds stored in digital wallets may not be protected by government deposit insurance programs such as FDIC (United States) or CDIC (Canada). KobKlein maintains segregated accounts and reserves to protect user funds, but no system is without risk.",
  },
  {
    number: "3",
    title: "Transaction Risks",
    content:
      "Once a transaction is initiated and confirmed on the KobKlein platform, it may not be reversible. Users should verify all transaction details including recipient information, amounts, and currencies before confirming. Errors in recipient phone numbers, K-IDs, or amounts may result in funds being sent to unintended recipients. While KobKlein provides dispute resolution mechanisms, recovery of funds sent in error is not guaranteed. Transaction processing times may vary due to network conditions, regulatory holds, or compliance reviews.",
  },
  {
    number: "4",
    title: "Technology & Cybersecurity Risks",
    content:
      "Digital financial services depend on technology infrastructure including servers, networks, mobile devices, and the internet. Service interruptions, system failures, cyberattacks, or software defects could temporarily or permanently affect your ability to access your account or complete transactions. While KobKlein employs bank-grade encryption, multi-factor authentication, and continuous security monitoring, no system can guarantee complete protection against all cyber threats. Users are responsible for maintaining the security of their devices and login credentials.",
  },
  {
    number: "5",
    title: "Regulatory & Legal Risks",
    content:
      "KobKlein operates across multiple jurisdictions including Haiti, the United States, Canada, and the European Union. Changes in laws, regulations, or government policies in any of these jurisdictions could affect the availability, features, or terms of our services. Regulatory actions could require KobKlein to modify, suspend, or terminate certain services. Users in specific jurisdictions may be subject to local financial regulations, tax obligations, and reporting requirements that are their responsibility to understand and comply with.",
  },
  {
    number: "6",
    title: "Foreign Exchange (FX) Risks",
    content:
      "International transfers and currency conversions are subject to foreign exchange rate fluctuations. The exchange rate quoted at the time of initiating a transaction may differ from the rate at the time of settlement. KobKlein applies a spread to exchange rates to cover operational costs and currency risk. Rates for USD/HTG, CAD/HTG, EUR/HTG, and other currency pairs are determined by market conditions and KobKlein\u2019s treasury operations. Historical exchange rates are not indicative of future rates. Users should consider FX risk when making cross-border transfers.",
  },
  {
    number: "7",
    title: "Operational & Third-Party Risks",
    content:
      "KobKlein relies on third-party service providers including payment processors, banking partners, identity verification services, and telecommunications providers. Failures, delays, or disruptions in these third-party services could affect KobKlein\u2019s ability to process transactions or provide services. The K-Agent distributor network consists of independent operators whose availability and performance may vary. Cash-in and cash-out services at K-Agent locations are subject to float availability and local operating conditions.",
  },
  {
    number: "8",
    title: "Account Suspension & Freeze Risks",
    content:
      "KobKlein\u2019s risk engine and compliance systems may automatically or manually freeze, suspend, or restrict accounts based on unusual activity patterns, compliance concerns, or regulatory requirements. Account restrictions may be imposed without prior notice when required by law or to protect the integrity of the platform. While users may request account unfreezing through our support channels, resolution times may vary. Users should maintain alternative payment methods for essential financial needs.",
  },
  {
    number: "9",
    title: "Market & Economic Risks",
    content:
      "The economic environment in Haiti and globally may affect the value and utility of KobKlein services. Factors including inflation, political instability, natural disasters, banking system disruptions, and changes in the global remittance market may impact service availability, transaction costs, and currency values. KobKlein does not guarantee that its services will remain available or economically viable under all market conditions.",
  },
  {
    number: "10",
    title: "User Responsibility & Risk Mitigation",
    content:
      "Users are encouraged to: (a) Never share login credentials, PINs, or OTP codes with anyone; (b) Enable all available security features including biometric authentication; (c) Keep transaction amounts within their personal risk tolerance; (d) Verify recipient details before confirming transactions; (e) Maintain records of all transactions; (f) Report suspicious activity immediately to KobKlein support; (g) Not store more funds in the wallet than they can afford to lose; (h) Diversify across multiple financial services for essential needs.",
  },
  {
    number: "11",
    title: "Limitation of Liability",
    content:
      "KobKlein shall not be liable for losses arising from the risks described in this document, except where such losses result from KobKlein\u2019s gross negligence or willful misconduct. This Risk Disclosure does not limit any rights you may have under applicable consumer protection laws. For complete liability terms, please refer to our Terms of Service.",
  },
  {
    number: "12",
    title: "Contact for Risk Inquiries",
    content:
      "For questions about the risks described in this document, contact our risk and compliance team at: risk@kobklein.com. For general support inquiries, contact support@kobklein.com or visit our Help Center. KobKlein Inc., Brickell Avenue Suite 400, Miami, FL 33131, United States.",
  },
];

export default async function RiskDisclosurePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden gold-dust">
        <div className="absolute inset-0 gradient-sovereign" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,168,76,0.08),transparent_60%)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <ShieldAlert className="h-10 w-10 text-kob-gold mx-auto mb-4" />
          <h1 className="font-serif-luxury text-4xl md:text-5xl font-bold text-kob-text mb-4">
            Risk Disclosure Statement
          </h1>
          <p className="text-kob-muted">
            Effective Date: January 1, 2025 &middot; Last Updated: February 1, 2025
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 bg-kob-navy">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card-sovereign p-8 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-5 w-5 text-kob-gold" />
              <h2 className="text-lg font-semibold text-kob-text">Important Notice</h2>
            </div>
            <p className="text-sm text-kob-body leading-relaxed">
              Digital financial services involve risks that may result in partial or total loss of funds.
              Please read this Risk Disclosure Statement carefully before using KobKlein services.
              This document is for informational purposes and does not constitute financial advice.
            </p>
          </div>

          <div className="space-y-6">
            {sections.map((s) => (
              <div key={s.number} className="card-sovereign p-6">
                <h3 className="text-base font-semibold text-kob-text mb-3">
                  <span className="text-kob-gold mr-2">{s.number}.</span>
                  {s.title}
                </h3>
                <p className="text-sm text-kob-body leading-relaxed">{s.content}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-xs text-kob-muted">
              &copy; {new Date().getFullYear()} KobKlein Inc. All rights reserved.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
