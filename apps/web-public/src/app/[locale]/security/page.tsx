import {
  Shield,
  Lock,
  Fingerprint,
  Brain,
  Award,
  CreditCard,
  Key,
  Eye,
  Server,
  ShieldCheck,
  FileCheck,
  Bug,
  Mail,
  CheckCircle,
  Layers,
  Network,
  Database,
} from "lucide-react";

const securityFeatures = [
  {
    Icon: Lock,
    title: "End-to-End Encryption",
    description:
      "All transactions and communications are protected with AES-256 encryption and TLS 1.3, ensuring your data cannot be intercepted or read by unauthorized parties.",
  },
  {
    Icon: Key,
    title: "Two-Factor Authentication",
    description:
      "Secure your account with an additional layer of protection using SMS codes, authenticator apps, or hardware security keys for every sensitive operation.",
  },
  {
    Icon: Fingerprint,
    title: "Biometric Login",
    description:
      "Access your wallet instantly and securely using fingerprint scanning or facial recognition. Your biometric data never leaves your device.",
  },
  {
    Icon: Brain,
    title: "Fraud Detection AI",
    description:
      "Our machine learning models analyze transaction patterns in real time to detect and prevent fraudulent activity before it impacts your account.",
  },
  {
    Icon: ShieldCheck,
    title: "SOC 2 Compliance",
    description:
      "Our systems and processes meet the rigorous SOC 2 Type II standards for security, availability, processing integrity, confidentiality, and privacy.",
  },
  {
    Icon: CreditCard,
    title: "PCI DSS Certified",
    description:
      "We maintain PCI DSS Level 1 compliance, the highest level of certification for handling payment card data, ensuring your financial information is always secure.",
  },
];

const architectureLayers = [
  {
    Icon: Shield,
    title: "Application Layer",
    description:
      "Input validation, rate limiting, CSRF protection, Content Security Policy, and secure session management protect against common web vulnerabilities.",
  },
  {
    Icon: Network,
    title: "Network Layer",
    description:
      "DDoS mitigation, Web Application Firewall (WAF), intrusion detection systems, and network segmentation prevent unauthorized access and attacks.",
  },
  {
    Icon: Database,
    title: "Data Layer",
    description:
      "Encrypted storage at rest, secure key management with HSMs (Hardware Security Modules), automated backups, and strict access controls protect your data.",
  },
  {
    Icon: Server,
    title: "Infrastructure Layer",
    description:
      "SOC 2 Type II certified data centers, redundant systems across multiple availability zones, 24/7 monitoring, and automated incident response.",
  },
];

const certifications = [
  {
    Icon: Award,
    title: "SOC 2 Type II",
    status: "Certified",
    auditor: "Deloitte Risk Advisory",
    description:
      "Comprehensive audit of our security controls, covering security, availability, processing integrity, confidentiality, and privacy over a 12-month observation period.",
  },
  {
    Icon: CreditCard,
    title: "PCI DSS Level 1",
    status: "Certified",
    auditor: "Qualified Security Assessor (QSA)",
    description:
      "The highest level of PCI compliance, requiring an annual on-site audit and quarterly network scans. We process, store, and transmit cardholder data with the strictest controls.",
  },
  {
    Icon: FileCheck,
    title: "ISO 27001",
    status: "Certified",
    auditor: "Bureau Veritas",
    description:
      "International standard for information security management systems (ISMS), demonstrating our systematic approach to managing sensitive company and customer information.",
  },
];

export default async function SecurityPage({
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,168,76,0.1),transparent_60%)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-28 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-kob-gold/25 bg-kob-gold/5 text-sm text-kob-gold mb-8">
            <Shield className="h-4 w-4" />
            Enterprise-Grade Protection
          </div>
          <h1 className="font-serif-luxury text-3xl md:text-5xl lg:text-6xl font-bold text-kob-text mb-6 leading-tight">
            <span className="gradient-gold-text">Bank-Grade Security</span>
            <br />
            <span className="text-kob-text">for Your Digital Wallet</span>
          </h1>
          <p className="text-lg md:text-xl text-kob-muted max-w-3xl mx-auto leading-relaxed">
            Your money and personal data are protected by the same security
            standards used by the world&apos;s leading financial institutions.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 divider-gold" />
      </section>

      {/* Security Features Grid */}
      <section className="py-24 bg-kob-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif-luxury text-2xl md:text-4xl font-bold text-kob-text mb-4">
              Multi-Layered Protection
            </h2>
            <p className="text-kob-muted text-lg max-w-2xl mx-auto">
              Six pillars of security working together to keep your assets and
              information safe.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityFeatures.map(({ Icon, title, description }) => (
              <div
                key={title}
                className="card-sovereign shimmer-gold p-8 group"
              >
                <div className="w-12 h-12 rounded-xl bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center mb-5 group-hover:bg-kob-gold/15 transition-colors duration-200">
                  <Icon className="h-6 w-6 text-kob-gold" />
                </div>
                <h3 className="text-lg font-semibold text-kob-text mb-3">
                  {title}
                </h3>
                <p className="text-sm text-kob-muted leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Architecture */}
      <section className="py-24 bg-kob-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif-luxury text-2xl md:text-4xl font-bold text-kob-text mb-4">
              Security Architecture
            </h2>
            <p className="text-kob-muted text-lg max-w-2xl mx-auto">
              Defense in depth &mdash; multiple layers of security protecting
              every aspect of our platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {architectureLayers.map(({ Icon, title, description }, i) => (
              <div key={title} className="card-sovereign p-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-kob-gold" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-kob-gold bg-kob-gold/10 px-2 py-0.5 rounded-full">
                        Layer {i + 1}
                      </span>
                      <h3 className="font-semibold text-kob-text">{title}</h3>
                    </div>
                    <p className="text-sm text-kob-muted leading-relaxed">
                      {description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Security Metrics */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "256-bit", label: "AES Encryption" },
              { value: "< 50ms", label: "Fraud Detection" },
              { value: "24/7/365", label: "Security Monitoring" },
              { value: "0", label: "Data Breaches" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center card-sovereign p-6">
                <div className="text-2xl md:text-3xl font-bold gradient-gold-text font-serif-luxury">
                  {value}
                </div>
                <div className="text-xs text-kob-muted mt-2">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications & Audits */}
      <section className="py-24 bg-kob-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif-luxury text-2xl md:text-4xl font-bold text-kob-text mb-4">
              Certifications &amp; Audits
            </h2>
            <p className="text-kob-muted text-lg max-w-2xl mx-auto">
              Independently verified by industry-leading auditors and
              certification bodies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {certifications.map(
              ({ Icon, title, status, auditor, description }) => (
                <div key={title} className="card-sovereign p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-kob-gold" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-kob-emerald/10 text-kob-emerald">
                      <CheckCircle className="h-3 w-3" />
                      {status}
                    </span>
                  </div>
                  <h3 className="font-serif-luxury text-xl font-bold text-kob-text mb-1">
                    {title}
                  </h3>
                  <p className="text-xs text-kob-gold mb-3">
                    Audited by {auditor}
                  </p>
                  <p className="text-sm text-kob-muted leading-relaxed">
                    {description}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Additional Security Practices */}
      <section className="py-24 bg-kob-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Security Practices */}
            <div>
              <h2 className="font-serif-luxury text-2xl md:text-3xl font-bold text-kob-text mb-8">
                Security Best Practices
              </h2>
              <div className="space-y-4">
                {[
                  "Regular penetration testing by independent security firms",
                  "Automated vulnerability scanning across all environments",
                  "Employee security awareness training and phishing simulations",
                  "Incident response plan tested quarterly with tabletop exercises",
                  "Secure software development lifecycle (SSDLC) practices",
                  "Third-party vendor security assessments and ongoing monitoring",
                  "Data loss prevention (DLP) controls across all endpoints",
                  "Principle of least privilege enforced for all system access",
                ].map((practice) => (
                  <div key={practice} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-kob-emerald flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-kob-body leading-relaxed">
                      {practice}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bug Bounty */}
            <div className="space-y-8">
              <div className="card-sovereign p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center flex-shrink-0">
                    <Bug className="h-5 w-5 text-kob-gold" />
                  </div>
                  <div>
                    <h3 className="font-serif-luxury text-xl font-bold text-kob-text mb-2">
                      Bug Bounty Program
                    </h3>
                    <p className="text-sm text-kob-muted leading-relaxed mb-4">
                      We believe in the power of the security research
                      community. Our bug bounty program rewards responsible
                      disclosure of security vulnerabilities with bounties
                      ranging from $100 to $10,000 depending on severity.
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="text-center p-3 rounded-lg bg-kob-gold/5 border border-kob-gold/10">
                        <div className="text-lg font-bold text-kob-gold">
                          $10K
                        </div>
                        <div className="text-xs text-kob-muted">Max Bounty</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-kob-gold/5 border border-kob-gold/10">
                        <div className="text-lg font-bold text-kob-gold">
                          48h
                        </div>
                        <div className="text-xs text-kob-muted">
                          Response Time
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Contact */}
              <div className="card-sovereign p-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-kob-gold" />
                  </div>
                  <div>
                    <h3 className="font-serif-luxury text-xl font-bold text-kob-text mb-2">
                      Security Contact
                    </h3>
                    <p className="text-sm text-kob-muted leading-relaxed mb-4">
                      Found a vulnerability or have a security concern? Our
                      security team is available around the clock.
                    </p>
                    <div className="space-y-2">
                      <p className="text-sm text-kob-body">
                        <span className="text-kob-muted">Email: </span>
                        <a
                          href="mailto:security@kobklein.com"
                          className="text-kob-gold hover:underline"
                        >
                          security@kobklein.com
                        </a>
                      </p>
                      <p className="text-sm text-kob-body">
                        <span className="text-kob-muted">PGP Key: </span>
                        <span className="font-mono text-xs text-kob-gold">
                          0xA1B2C3D4E5F6
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Trust Banner */}
      <section className="py-16 bg-kob-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-kob-panel border border-kob-gold/15 p-10 text-center">
            <Layers className="h-10 w-10 text-kob-gold mx-auto mb-4" />
            <h2 className="font-serif-luxury text-2xl font-bold text-kob-text mb-3">
              Your Security Is Our Priority
            </h2>
            <p className="text-kob-muted leading-relaxed max-w-2xl mx-auto mb-6">
              We invest millions of dollars annually in security infrastructure,
              personnel, and processes to ensure that your money and personal
              information are always protected.
            </p>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-2xl font-bold text-kob-gold">3</div>
                <div className="text-xs text-kob-muted">Certifications</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-kob-gold">4</div>
                <div className="text-xs text-kob-muted">Security Layers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-kob-gold">24/7</div>
                <div className="text-xs text-kob-muted">Monitoring</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
