import { FileText, Scale } from "lucide-react";

const sections = [
  {
    number: "1",
    title: "Acceptance of Terms",
    content: "By accessing or using the KobKlein platform, mobile application, or any related services (collectively, the \"Services\"), you agree to be bound by these Terms of Service. If you do not agree to these Terms, you may not use the Services. KobKlein reserves the right to modify these Terms at any time, and your continued use of the Services constitutes acceptance of any modifications.",
  },
  {
    number: "2",
    title: "Eligibility",
    content: "You must be at least 18 years old to create a KobKlein account. By registering, you represent that you are of legal age in your jurisdiction and have the authority to enter into a binding agreement. KobKlein accounts are available to individuals and businesses in supported jurisdictions. We reserve the right to refuse service to anyone for any reason.",
  },
  {
    number: "3",
    title: "Account Registration",
    content: "To use the Services, you must create an account by providing accurate and complete information including your phone number and identity verification documents as required by our KYC (Know Your Customer) procedures. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify KobKlein immediately of any unauthorized use.",
  },
  {
    number: "4",
    title: "Services Description",
    content: "KobKlein provides digital wallet, payment, and money transfer services including: K-Pay instant transfers between KobKlein users, K-Card virtual and physical payment cards, K-Link diaspora family panel for cross-border transfers, K-Agent cash-in/cash-out distributor network, K-Code and K-Scan payment codes, and merchant payment acceptance tools. Service availability may vary by jurisdiction.",
  },
  {
    number: "5",
    title: "Fees and Charges",
    content: "KobKlein charges fees for certain transactions as disclosed in our fee schedule. K-Pay transfers between KobKlein users under $500 HTG are free. International remittances are subject to a $1.99 USD flat fee. K-Card transactions are subject to a 2.5% processing fee. Cash-out at K-Agent locations incurs a 1% fee. All fees are subject to change with 30 days notice to users.",
  },
  {
    number: "6",
    title: "User Responsibilities",
    content: "You agree to use the Services only for lawful purposes and in compliance with all applicable laws and regulations. You will not use the Services for money laundering, terrorist financing, fraud, or any illegal activity. You are responsible for ensuring all information provided is accurate, current, and complete. You must maintain sufficient balance for transactions and applicable fees.",
  },
  {
    number: "7",
    title: "Prohibited Activities",
    content: "You may not: use the Services for any illegal purpose; attempt to gain unauthorized access to the platform; interfere with or disrupt the Services; use automated systems to interact with the Services without authorization; create multiple accounts; impersonate another person; use the Services to transmit malware or harmful content; or circumvent any transaction limits or security measures.",
  },
  {
    number: "8",
    title: "Intellectual Property",
    content: "All content, trademarks, logos, and intellectual property associated with KobKlein, including but not limited to the KobKlein name, K-Pay, K-Card, K-Link, K-Agent, K-Code, K-Scan, and K-Trust brands, are owned by KobKlein Inc. You may not use, reproduce, or distribute any KobKlein intellectual property without express written permission.",
  },
  {
    number: "9",
    title: "Limitation of Liability",
    content: "KobKlein shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Services. Our total liability for any claim arising from the Services shall not exceed the fees paid by you in the 12 months preceding the claim. KobKlein is not responsible for delays caused by network issues, banking partners, or force majeure events.",
  },
  {
    number: "10",
    title: "Dispute Resolution",
    content: "Any disputes arising from these Terms or your use of the Services shall first be resolved through good faith negotiation. If negotiation fails, disputes shall be submitted to binding arbitration in accordance with the rules of the American Arbitration Association. The arbitration shall take place in Miami, Florida, USA. You agree to waive any right to participate in a class action lawsuit.",
  },
  {
    number: "11",
    title: "Termination",
    content: "KobKlein may suspend or terminate your account at any time for violation of these Terms, suspected fraud, or as required by law or regulatory authorities. You may close your account at any time by contacting support. Upon termination, you must withdraw any remaining balance within 30 days. Certain provisions of these Terms survive termination.",
  },
  {
    number: "12",
    title: "Governing Law",
    content: "These Terms shall be governed by and construed in accordance with the laws of the State of Florida, United States, without regard to its conflict of law provisions. For users in Haiti, additional protections under the Law on Electronic Money Institutions (BRH Circular 117) shall apply. Users in Canada and the EU are entitled to additional consumer protections as required by local law.",
  },
  {
    number: "13",
    title: "Contact Information",
    content: "For questions about these Terms of Service, contact us at: KobKlein Inc., legal@kobklein.com, Brickell Avenue Suite 400, Miami, FL 33131, United States. For urgent account matters, contact support@kobklein.com or call +509 2813 XXXX.",
  },
];

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden gold-dust">
        <div className="absolute inset-0 gradient-sovereign" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(198,167,86,0.08),transparent_60%)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <Scale className="h-10 w-10 text-kob-gold mx-auto mb-4" />
          <h1 className="font-serif-luxury text-4xl md:text-5xl font-bold text-kob-text mb-4">
            Terms of Service
          </h1>
          <p className="text-kob-muted">
            Effective Date: January 1, 2025 &middot; Last Updated: February 1, 2025
          </p>
        </div>
      </section>

      {/* Terms Content */}
      <section className="py-20 bg-kob-navy">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card-sovereign p-8 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-5 w-5 text-kob-gold" />
              <h2 className="text-lg font-semibold text-kob-text">Overview</h2>
            </div>
            <p className="text-sm text-kob-body leading-relaxed">
              These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the KobKlein platform, including our mobile application, website, APIs, and all related services provided by KobKlein Inc. (&ldquo;KobKlein,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). Please read these Terms carefully before using our Services.
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
