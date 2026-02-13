import {
  Shield,
  Database,
  Eye,
  Lock,
  UserCheck,
  Cookie,
  Baby,
  Globe,
  RefreshCw,
  Mail,
} from "lucide-react";

const sections = [
  {
    number: 1,
    Icon: Database,
    title: "Information We Collect",
    content: [
      {
        subtitle: "Personal Information",
        text: "When you create a KobKlein account, we collect personal information including your full legal name, date of birth, email address, phone number, physical address, government-issued identification (such as a passport or national ID card), and a photograph for identity verification. For business accounts, we may also collect business registration documents, tax identification numbers, and beneficial ownership information.",
      },
      {
        subtitle: "Transaction Data",
        text: "We record details of transactions you carry out through our platform, including the amount, currency, date, time, sender and recipient details, transaction reference numbers, and purpose of payment. This data is essential for providing our services, regulatory compliance, and fraud prevention.",
      },
      {
        subtitle: "Device and Technical Information",
        text: "We automatically collect information about the device you use to access our services, including your device type, operating system, unique device identifiers, IP address, browser type, mobile network information, time zone settings, and language preferences. We may also collect geolocation data with your consent.",
      },
    ],
  },
  {
    number: 2,
    Icon: Eye,
    title: "How We Use Your Information",
    content: [
      {
        subtitle: null,
        text: "We use the information we collect for the following purposes: to provide, maintain, and improve our digital wallet and payment services; to process transactions and send related notifications; to verify your identity and comply with Know Your Customer (KYC) regulations; to detect, prevent, and investigate fraud, unauthorized transactions, and other illegal activities; to comply with applicable laws, regulations, and legal processes including Anti-Money Laundering (AML) requirements; to communicate with you about your account, updates, security alerts, and promotional offers (with your consent); to personalize your experience and provide tailored content and recommendations; to conduct research and analytics to improve our products and services; and to enforce our Terms of Service and other agreements.",
      },
    ],
  },
  {
    number: 3,
    Icon: UserCheck,
    title: "Information Sharing",
    content: [
      {
        subtitle: "Third-Party Service Providers",
        text: "We share your information with trusted third-party service providers who assist us in operating our platform, including payment processors, identity verification services, cloud hosting providers, customer support tools, and analytics providers. These providers are contractually obligated to protect your information and may only use it for the purposes we specify.",
      },
      {
        subtitle: "Legal Requirements",
        text: "We may disclose your information when required by law, regulation, legal process, or governmental request. This includes sharing information with regulatory authorities such as the Bank of the Republic of Haiti (BRH), FinCEN, FINTRAC, and other financial regulatory bodies. We may also disclose information to comply with court orders, subpoenas, or other legal obligations.",
      },
      {
        subtitle: "Business Transfers",
        text: "In the event of a merger, acquisition, reorganization, or sale of assets, your information may be transferred as part of that transaction. We will provide notice before your personal information is transferred and becomes subject to a different privacy policy.",
      },
    ],
  },
  {
    number: 4,
    Icon: Lock,
    title: "Data Security",
    content: [
      {
        subtitle: "Encryption",
        text: "All data transmitted between your device and our servers is encrypted using TLS 1.3 (Transport Layer Security). Sensitive data at rest is encrypted using AES-256 encryption. We employ end-to-end encryption for all financial transactions to ensure your information cannot be intercepted or read by unauthorized parties.",
      },
      {
        subtitle: "Access Controls",
        text: "We implement strict access controls to limit who within our organization can access your personal information. Access is granted on a need-to-know basis and is subject to regular audits. All access to sensitive systems is logged and monitored. Our employees undergo regular security training and background checks.",
      },
      {
        subtitle: "Infrastructure Security",
        text: "Our infrastructure is hosted in SOC 2 Type II certified data centers with 24/7 physical security, redundant power supplies, and environmental controls. We conduct regular penetration testing, vulnerability assessments, and security audits to identify and address potential threats.",
      },
    ],
  },
  {
    number: 5,
    Icon: Shield,
    title: "Your Rights",
    content: [
      {
        subtitle: "Access and Portability",
        text: "You have the right to request a copy of the personal information we hold about you. We will provide this information in a structured, commonly used, and machine-readable format within 30 days of your request.",
      },
      {
        subtitle: "Correction",
        text: "You have the right to request that we correct any inaccurate or incomplete personal information we hold about you. You can update most of your account information directly through the KobKlein app.",
      },
      {
        subtitle: "Deletion",
        text: "You may request the deletion of your personal information, subject to certain exceptions required by law. Please note that we are required to retain certain information for regulatory compliance purposes, including transaction records, for a minimum period as mandated by applicable financial regulations.",
      },
      {
        subtitle: "Objection and Restriction",
        text: "You have the right to object to or request restriction of the processing of your personal information in certain circumstances. Where we process your information based on consent, you may withdraw your consent at any time.",
      },
    ],
  },
  {
    number: 6,
    Icon: Cookie,
    title: "Cookies and Tracking",
    content: [
      {
        subtitle: null,
        text: "Our website and application use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and deliver personalized content. We use essential cookies necessary for the functioning of our services, performance cookies to understand how visitors interact with our platform, and functional cookies to remember your preferences and settings. You can manage your cookie preferences through your browser settings or our cookie consent manager. Please note that disabling certain cookies may limit the functionality of our services.",
      },
    ],
  },
  {
    number: 7,
    Icon: Baby,
    title: "Children's Privacy",
    content: [
      {
        subtitle: null,
        text: "KobKlein services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected personal information from a child under 18 without parental consent, we will take steps to delete that information promptly. If you believe we may have collected information from a child, please contact us immediately at privacy@kobklein.com.",
      },
    ],
  },
  {
    number: 8,
    Icon: Globe,
    title: "International Data Transfers",
    content: [
      {
        subtitle: null,
        text: "As KobKlein operates across multiple jurisdictions, your personal information may be transferred to and processed in countries other than your country of residence, including the United States, Canada, and countries within the European Union. When we transfer your information internationally, we implement appropriate safeguards to ensure your data is protected in accordance with this Privacy Policy and applicable data protection laws. These safeguards may include Standard Contractual Clauses approved by relevant authorities, data processing agreements with our service providers, and compliance with applicable cross-border data transfer frameworks.",
      },
    ],
  },
  {
    number: 9,
    Icon: RefreshCw,
    title: "Changes to This Policy",
    content: [
      {
        subtitle: null,
        text: "We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. When we make material changes, we will notify you by posting the updated policy on our website and app, sending an email notification to your registered email address, and displaying a prominent notice within the KobKlein application. We encourage you to review this Privacy Policy periodically. Your continued use of our services after any changes constitutes your acceptance of the updated Privacy Policy.",
      },
    ],
  },
  {
    number: 10,
    Icon: Mail,
    title: "Contact Us",
    content: [
      {
        subtitle: null,
        text: "If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact our Data Protection Team.",
      },
    ],
  },
];

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden gold-dust">
        <div className="absolute inset-0 gradient-sovereign" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-28 text-center">
          <Shield className="h-12 w-12 text-kob-gold mx-auto mb-6" />
          <h1 className="font-serif-luxury text-3xl md:text-5xl font-bold text-kob-text mb-4">
            Privacy Policy
          </h1>
          <p className="text-kob-muted text-lg">
            Last updated: January 15, 2025
          </p>
          <p className="text-kob-body mt-6 max-w-2xl mx-auto leading-relaxed">
            At KobKlein, we are committed to protecting your privacy and
            ensuring the security of your personal information. This Privacy
            Policy explains how we collect, use, disclose, and safeguard your
            data when you use our digital wallet and financial services.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 divider-gold" />
      </section>

      {/* Content */}
      <section className="py-20 bg-kob-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {sections.map(({ number, Icon, title, content }) => (
            <div key={number} className="card-sovereign p-8 md:p-10">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-kob-gold" />
                </div>
                <h2 className="font-serif-luxury text-xl md:text-2xl font-bold text-kob-text">
                  <span className="text-kob-gold mr-2">{number}.</span>
                  {title}
                </h2>
              </div>

              <div className="space-y-5 pl-0 md:pl-14">
                {content.map((item, i) => (
                  <div key={i}>
                    {item.subtitle && (
                      <h3 className="text-sm font-semibold text-kob-gold uppercase tracking-wider mb-2">
                        {item.subtitle}
                      </h3>
                    )}
                    <p className="text-kob-muted leading-relaxed text-sm">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Contact Details Card */}
          <div className="card-sovereign p-8 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-kob-text mb-2">
                  Data Protection Officer
                </h3>
                <p className="text-sm text-kob-muted leading-relaxed">
                  KobKlein, Inc.
                  <br />
                  Attn: Data Protection Team
                  <br />
                  Port-au-Prince, Haiti
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-kob-text mb-2">
                  Contact Information
                </h3>
                <p className="text-sm text-kob-muted leading-relaxed">
                  Email:{" "}
                  <a
                    href="mailto:privacy@kobklein.com"
                    className="text-kob-gold hover:underline"
                  >
                    privacy@kobklein.com
                  </a>
                  <br />
                  Response Time: Within 30 business days
                </p>
              </div>
            </div>
          </div>

          {/* Effective Notice */}
          <div className="rounded-2xl bg-kob-panel border border-kob-gold/15 p-8 text-center">
            <p className="text-sm text-kob-muted">
              This Privacy Policy is effective as of January 15, 2025. By using
              KobKlein&apos;s services, you acknowledge that you have read and
              understood this Privacy Policy and agree to its terms.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
