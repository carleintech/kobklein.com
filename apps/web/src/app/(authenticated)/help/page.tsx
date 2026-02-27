"use client";

import { ChevronDown, ChevronUp, HelpCircle, LifeBuoy, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const FAQS: { category: string; items: { q: string; a: string }[] }[] = [
  {
    category: "Account & KYC",
    items: [
      {
        q: "How do I verify my account (KYC)?",
        a: "Go to Settings → Verify Identity. You'll need a valid government-issued ID and a selfie. Tier 1 unlocks in minutes; Tier 2 may take 1–2 business days for manual review.",
      },
      {
        q: "Why was my KYC rejected?",
        a: "Common reasons: blurry photo, expired document, or name mismatch. Check the rejection note in Settings and resubmit with a clearer photo.",
      },
      {
        q: "How do I change my phone number?",
        a: "Phone number changes require KYC re-verification for security. Contact support to initiate the process.",
      },
    ],
  },
  {
    category: "Sending Money",
    items: [
      {
        q: "How do I send money to another KobKlein user?",
        a: "Tap Send on your dashboard, enter the recipient's K-ID (e.g. KP-12345), amount, and your transaction PIN. Transfers are instant.",
      },
      {
        q: "What are the transfer limits?",
        a: "Limits depend on your KYC tier. Tier 0: 5,000 HTG/day. Tier 1: 50,000 HTG/day. Tier 2: 200,000 HTG/day. Tier 3: custom limits.",
      },
      {
        q: "Can I cancel a transfer?",
        a: "Transfers are processed instantly and cannot be reversed by the sender. If you sent to the wrong person, contact support immediately — we may be able to assist if the recipient agrees.",
      },
    ],
  },
  {
    category: "Wallet & Funds",
    items: [
      {
        q: "How do I add money to my wallet?",
        a: "You can fund your wallet via a distributor (cash deposit), bank transfer, or mobile money. Tap Wallet → Fund from your dashboard.",
      },
      {
        q: "How do I cash out?",
        a: "Visit any KobKlein distributor near you (find them via the Nearby map), or request a bank withdrawal from Wallet → Cash Out.",
      },
      {
        q: "Why is my balance showing 'held'?",
        a: "Held funds are temporarily reserved for pending transactions or compliance review. They will be released automatically once the transaction clears.",
      },
    ],
  },
  {
    category: "Security & PIN",
    items: [
      {
        q: "I forgot my transaction PIN. How do I reset it?",
        a: "Go to Settings → Security → Reset Transaction PIN. You'll receive a verification code to your registered phone number.",
      },
      {
        q: "What should I do if my account is frozen?",
        a: "Account freezes are triggered automatically by our security system or by compliance review. Contact support with your K-ID for assistance.",
      },
    ],
  },
  {
    category: "Merchants & Distributors",
    items: [
      {
        q: "How do I become a merchant?",
        a: "During signup, select the Merchant role. You'll need to complete KYC Tier 2 and provide your business details. Approval typically takes 1–3 business days.",
      },
      {
        q: "How do I find a distributor near me?",
        a: "Tap the map icon on your dashboard or go to Nearby to see distributor and merchant locations on an interactive map.",
      },
    ],
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/6 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 py-4 text-left group"
      >
        <span className="text-sm font-medium text-kob-text group-hover:text-white transition-colors">
          {q}
        </span>
        {open
          ? <ChevronUp className="h-4 w-4 text-kob-gold shrink-0" />
          : <ChevronDown className="h-4 w-4 text-kob-muted shrink-0 group-hover:text-kob-gold transition-colors" />
        }
      </button>
      {open && (
        <p className="pb-4 text-sm text-kob-muted leading-relaxed">{a}</p>
      )}
    </div>
  );
}

export default function HelpCenterPage() {
  const [search, setSearch] = useState("");

  const filtered = FAQS.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        !search ||
        item.q.toLowerCase().includes(search.toLowerCase()) ||
        item.a.toLowerCase().includes(search.toLowerCase()),
    ),
  })).filter((cat) => cat.items.length > 0);

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-10">
      {/* Header */}
      <div className="text-center space-y-2 pt-2">
        <div className="flex items-center justify-center gap-2">
          <HelpCircle className="h-6 w-6 text-kob-gold" />
          <h1 className="text-2xl font-bold text-kob-text">Help Center</h1>
        </div>
        <p className="text-sm text-kob-muted">Find answers or contact our support team</p>
      </div>

      {/* Search */}
      <div className="relative">
        <HelpCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-kob-muted pointer-events-none" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search FAQs…"
          className="w-full h-11 rounded-2xl focus:outline-none pl-10 pr-4 text-sm text-kob-text placeholder:text-kob-muted/60 transition-colors"
        style={{ background: "var(--dash-shell-bg, #1C0A35)", border: "1px solid var(--dash-shell-border, rgba(165,150,201,0.22))" }}
        />
      </div>

      {/* FAQ sections */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: "var(--dash-shell-bg, #1C0A35)", border: "1px solid var(--dash-shell-border, rgba(165,150,201,0.22))" }}>
          <p className="text-sm text-kob-muted">No results for &quot;{search}&quot;</p>
        </div>
      ) : (
        filtered.map((cat) => (
          <div key={cat.category} className="rounded-2xl overflow-hidden" style={{ background: "var(--dash-shell-bg, #1C0A35)", border: "1px solid var(--dash-shell-border, rgba(165,150,201,0.22))" }}>
            <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--dash-shell-border, rgba(165,150,201,0.22))", background: "rgba(165,150,201,0.04)" }}>
              <p className="text-[11px] font-semibold text-kob-gold uppercase tracking-widest">{cat.category}</p>
            </div>
            <div className="px-5">
              {cat.items.map((item) => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        ))
      )}

      {/* Contact support CTA */}
      <div className="rounded-2xl border border-kob-gold/15 bg-kob-gold/5 p-5 flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center shrink-0">
          <LifeBuoy className="h-5 w-5 text-kob-gold" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-kob-text">Still need help?</p>
          <p className="text-xs text-kob-muted mt-0.5">Our support team typically responds within 24 hours</p>
        </div>
        <Link
          href="/support"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-kob-gold text-kob-black text-xs font-bold hover:bg-kob-gold-light transition-colors shrink-0"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Open Ticket
        </Link>
      </div>
    </div>
  );
}
