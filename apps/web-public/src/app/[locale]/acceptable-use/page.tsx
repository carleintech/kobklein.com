import { FileWarning, BookOpen } from "lucide-react";

const sections = [
  {
    number: "1",
    title: "Purpose",
    content:
      "This Acceptable Use Policy (\"AUP\") defines the standards and rules for using the KobKlein platform, mobile application, and all related services. This policy is designed to protect the KobKlein community, maintain the integrity of our financial system, and ensure compliance with applicable laws and regulations. All users, including individuals, merchants, distributors (K-Agents), and diaspora members, must comply with this AUP at all times.",
  },
  {
    number: "2",
    title: "Permitted Uses",
    content:
      "KobKlein services are intended for lawful financial activities including: sending and receiving personal transfers between KobKlein users (K-Pay); receiving remittances from family and friends abroad via K-Link; making payments to merchants and businesses; cash-in and cash-out operations through authorized K-Agent distributors; using K-Card for authorized online and point-of-sale purchases; currency conversion using our FX services; managing business payments through merchant accounts; and any other activities explicitly permitted by KobKlein\u2019s Terms of Service.",
  },
  {
    number: "3",
    title: "Prohibited Activities",
    content:
      "Users are strictly prohibited from using KobKlein services for: money laundering or attempting to disguise the origins of illegally obtained funds; financing of terrorism, weapons proliferation, or sanctioned entities; fraud, scams, Ponzi schemes, or any form of financial deception; purchasing or selling illegal goods, drugs, or controlled substances; human trafficking or exploitation of any kind; unauthorized gambling or lottery operations; circumventing transaction limits through structured transactions (\"smurfing\"); creating multiple accounts to evade restrictions or limits; identity theft or impersonation of other individuals; distributing malware, phishing, or conducting cyberattacks; any activity that violates applicable local, national, or international laws.",
  },
  {
    number: "4",
    title: "Transaction Limits & Monitoring",
    content:
      "KobKlein implements transaction limits and monitoring systems to ensure platform safety and regulatory compliance. Transaction limits vary by verification tier: unverified accounts have daily limits of 5,000 HTG; KYC Level 1 accounts have daily limits of 50,000 HTG; KYC Level 2 accounts have daily limits of 500,000 HTG; and KYC Level 3 (full verification) accounts have daily limits of 2,000,000 HTG. All transactions are subject to real-time risk scoring, velocity checks, and pattern analysis. Transactions flagged by our risk engine may be delayed, held for review, or declined.",
  },
  {
    number: "5",
    title: "Merchant & Distributor Obligations",
    content:
      "Merchants accepting KobKlein payments must: display accurate pricing and product information; fulfill orders and services as advertised; process refunds in accordance with their stated policies; not impose surcharges for KobKlein payments exceeding card network surcharge limits; and maintain accurate business records. K-Agent distributors must: maintain adequate float balances; provide accurate cash-in and cash-out services; follow all KYC procedures for walk-in customers; not charge fees beyond the authorized commission structure; and report suspicious transactions to KobKlein compliance.",
  },
  {
    number: "6",
    title: "Account Security Obligations",
    content:
      "Users are responsible for maintaining the security of their accounts. This includes: using strong, unique passwords and enabling biometric authentication where available; never sharing OTP codes, PINs, or login credentials with any person, including anyone claiming to represent KobKlein; keeping registered phone numbers and email addresses up to date; immediately reporting lost or stolen devices; logging out of shared or public devices; and being vigilant against phishing attempts and social engineering. KobKlein will never ask for your password or OTP codes via phone, email, or message.",
  },
  {
    number: "7",
    title: "Content & Communication Standards",
    content:
      "When using KobKlein\u2019s communication features (transaction notes, merchant descriptions, support messages), users must not: include offensive, threatening, or discriminatory language; share personal information of third parties without consent; send spam, unsolicited advertisements, or promotional content; impersonate KobKlein staff or other users; or include content that violates intellectual property rights.",
  },
  {
    number: "8",
    title: "Enforcement & Consequences",
    content:
      "Violations of this Acceptable Use Policy may result in one or more of the following actions: temporary account suspension pending investigation; permanent account termination; forfeiture of distributor or merchant privileges; reporting to law enforcement or regulatory authorities; legal action to recover damages; freezing of account balances pending investigation; and reporting to international financial crime databases. The severity of enforcement action will be proportional to the nature and frequency of violations. KobKlein reserves the right to take immediate action without prior notice when required to prevent harm or comply with legal obligations.",
  },
  {
    number: "9",
    title: "Reporting Violations",
    content:
      "Users who become aware of violations of this AUP are encouraged to report them to KobKlein. Reports can be made through: the in-app reporting feature; email to compliance@kobklein.com; or contacting our support team. All reports are treated confidentially, and KobKlein prohibits retaliation against users who report violations in good faith. Anonymous reports are accepted and will be investigated to the extent possible.",
  },
  {
    number: "10",
    title: "Policy Updates",
    content:
      "KobKlein reserves the right to update this Acceptable Use Policy at any time. Material changes will be communicated to users through in-app notifications, email, or posted on our website at least 30 days before taking effect. Continued use of KobKlein services after the effective date of changes constitutes acceptance of the updated policy. Users who do not agree with policy changes may close their account and withdraw their funds.",
  },
  {
    number: "11",
    title: "Contact Information",
    content:
      "For questions about this Acceptable Use Policy, contact us at: KobKlein Inc., compliance@kobklein.com, Brickell Avenue Suite 400, Miami, FL 33131, United States. For urgent security concerns, contact security@kobklein.com.",
  },
];

export default async function AcceptableUsePage({
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
          <FileWarning className="h-10 w-10 text-kob-gold mx-auto mb-4" />
          <h1 className="font-serif-luxury text-4xl md:text-5xl font-bold text-kob-text mb-4">
            Acceptable Use Policy
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
              <BookOpen className="h-5 w-5 text-kob-gold" />
              <h2 className="text-lg font-semibold text-kob-text">Overview</h2>
            </div>
            <p className="text-sm text-kob-body leading-relaxed">
              This Acceptable Use Policy outlines the rules and standards that govern how KobKlein
              services may be used. All users are expected to use the platform responsibly, legally,
              and in a manner that respects the rights and safety of the entire KobKlein community.
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
