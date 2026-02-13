"use client";

import { useEffect, useState, useCallback } from "react";
import { kkGet, kkPost } from "@/lib/kobklein-api";
import {
  CreditCard,
  Shield,
  Globe,
  Wifi,
  Lock,
  Unlock,
  Eye,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface KCard {
  id: string;
  last4: string;
  holderName: string;
  expiryMonth: string;
  expiryYear: string;
  status: "active" | "frozen" | "ordered";
  type: "virtual" | "physical";
  dailyLimit: number;
  monthlyLimit: number;
  balance: number;
  settings: CardSettings;
}

interface CardSettings {
  online: boolean;
  international: boolean;
  contactless: boolean;
}

interface CardTransaction {
  id: string;
  merchant: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "declined";
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const htg = (v: number) =>
  new Intl.NumberFormat("en-HT", {
    style: "currency",
    currency: "HTG",
    minimumFractionDigits: 2,
  }).format(v);

const statusColor: Record<string, string> = {
  active: "bg-[#1F6F4A] text-white",
  frozen: "bg-red-600/80 text-white",
  ordered: "bg-[#C6A756]/20 text-[#C6A756]",
  completed: "bg-[#1F6F4A]/20 text-[#1F6F4A]",
  pending: "bg-[#C6A756]/20 text-[#C6A756]",
  declined: "bg-red-500/20 text-red-400",
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CardPage() {
  const [card, setCard] = useState<KCard | null>(null);
  const [txns, setTxns] = useState<CardTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [freezing, setFreezing] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  /* ---------- fetch card + transactions ---------- */
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [c, t] = await Promise.all([
        kkGet<KCard>("v1/cards/my-card").catch(() => null),
        kkGet<CardTransaction[]>("v1/cards/transactions?limit=10").catch(
          () => [],
        ),
      ]);
      setCard(c);
      setTxns(t);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load card data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ---------- freeze / unfreeze ---------- */
  const toggleFreeze = async () => {
    if (!card) return;
    setFreezing(true);
    try {
      const frozen = card.status !== "frozen";
      await kkPost("v1/cards/freeze", { frozen });
      setCard((p) =>
        p ? { ...p, status: frozen ? "frozen" : "active" } : p,
      );
    } catch {
      setError("Could not update freeze status");
    } finally {
      setFreezing(false);
    }
  };

  /* ---------- card settings ---------- */
  const updateSetting = async (key: keyof CardSettings) => {
    if (!card) return;
    const updated = { ...card.settings, [key]: !card.settings[key] };
    setSavingSettings(true);
    try {
      await kkPost("v1/cards/settings", updated);
      setCard((p) => (p ? { ...p, settings: updated } : p));
    } catch {
      setError("Could not save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  /* --- loading --- */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080B14]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#C6A756] border-t-transparent" />
      </div>
    );
  }

  /* --- error --- */
  if (error && !card) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#080B14] px-4 text-center">
        <Shield className="h-12 w-12 text-red-400" />
        <p className="text-[#C4C7CF]">{error}</p>
        <button
          onClick={load}
          className="rounded-lg bg-[#C6A756] px-6 py-2 font-semibold text-[#080B14] transition hover:bg-[#E1C97A]"
        >
          Retry
        </button>
      </div>
    );
  }

  /* --- no card --- */
  if (!card) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#080B14] px-4 text-center">
        <CreditCard className="h-16 w-16 text-[#7A8394]" />
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#F2F2F2]">
          No K-Card Yet
        </h1>
        <p className="max-w-md text-[#7A8394]">
          Request your K-Card to make payments, manage spending, and transact
          securely worldwide.
        </p>
        <button className="rounded-xl bg-[#C6A756] px-8 py-3 font-semibold text-[#080B14] transition hover:bg-[#E1C97A]">
          Request K-Card
        </button>
      </div>
    );
  }

  const isFrozen = card.status === "frozen";
  const isActive = card.status === "active";

  return (
    <main className="min-h-screen bg-[#080B14] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* ---- heading ---- */}
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#F2F2F2]">
          My K-Card
        </h1>

        {error && (
          <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* ============================================================ */}
        {/*  1. CARD VISUAL                                              */}
        {/* ============================================================ */}
        <div
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1f35] to-[#151B2E] p-6 ${
            isActive ? "ring-1 ring-[#C6A756]/50" : ""
          }`}
        >
          {/* top row */}
          <div className="flex items-start justify-between">
            <span className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-[#C6A756]">
              K
            </span>
            <CreditCard className="h-8 w-8 text-[#7A8394]" />
          </div>

          {/* card number */}
          <p className="mt-8 font-mono text-xl tracking-widest text-[#F2F2F2]">
            &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull;
            &bull;&bull;&bull;&bull; {card.last4}
          </p>

          {/* bottom row */}
          <div className="mt-6 flex items-end justify-between">
            <div>
              <p className="text-xs uppercase text-[#7A8394]">Cardholder</p>
              <p className="text-sm font-medium text-[#C4C7CF]">
                {card.holderName}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase text-[#7A8394]">Expires</p>
              <p className="text-sm font-medium text-[#C4C7CF]">
                {card.expiryMonth}/{card.expiryYear}
              </p>
            </div>
          </div>

          {/* status badge */}
          <span
            className={`absolute right-4 top-14 rounded-full px-3 py-0.5 text-xs font-semibold capitalize ${statusColor[card.status]}`}
          >
            {card.status}
          </span>
        </div>

        {/* ============================================================ */}
        {/*  2. QUICK ACTIONS                                            */}
        {/* ============================================================ */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={toggleFreeze}
            disabled={freezing || card.status === "ordered"}
            className={`flex flex-col items-center gap-2 rounded-xl p-4 text-xs font-medium transition ${
              isFrozen
                ? "bg-red-600/20 text-red-400"
                : "bg-[#C6A756]/10 text-[#C6A756]"
            } hover:opacity-80 disabled:opacity-40`}
          >
            {isFrozen ? (
              <Unlock className="h-5 w-5" />
            ) : (
              <Lock className="h-5 w-5" />
            )}
            {freezing
              ? "Processing..."
              : isFrozen
                ? "Unfreeze Card"
                : "Freeze Card"}
          </button>

          <button
            onClick={() =>
              alert("For security, view full card details in the mobile app.")
            }
            className="flex flex-col items-center gap-2 rounded-xl bg-[#151B2E] p-4 text-xs font-medium text-[#C4C7CF] transition hover:opacity-80"
          >
            <Eye className="h-5 w-5" />
            Show Details
          </button>

          {card.type === "virtual" && (
            <button className="flex flex-col items-center gap-2 rounded-xl bg-[#151B2E] p-4 text-xs font-medium text-[#C4C7CF] transition hover:opacity-80">
              <CreditCard className="h-5 w-5" />
              Order Physical
            </button>
          )}
        </div>

        {/* ============================================================ */}
        {/*  3. CARD DETAILS                                             */}
        {/* ============================================================ */}
        <section className="rounded-2xl bg-[#151B2E] p-6">
          <h2 className="mb-4 font-semibold text-[#F2F2F2]">Card Details</h2>
          <dl className="space-y-3 text-sm">
            {[
              ["Type", card.type === "virtual" ? "Virtual" : "Physical"],
              [
                "Status",
                <span
                  key="s"
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusColor[card.status]}`}
                >
                  {card.status}
                </span>,
              ],
              ["Daily Limit", htg(card.dailyLimit)],
              ["Monthly Limit", htg(card.monthlyLimit)],
              ["Available Balance", htg(card.balance)],
            ].map(([label, value], i) => (
              <div key={i} className="flex items-center justify-between">
                <dt className="text-[#7A8394]">{label}</dt>
                <dd className="font-medium text-[#C4C7CF]">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ============================================================ */}
        {/*  4. RECENT TRANSACTIONS                                      */}
        {/* ============================================================ */}
        <section className="rounded-2xl bg-[#151B2E] p-6">
          <h2 className="mb-4 font-semibold text-[#F2F2F2]">
            Recent Transactions
          </h2>

          {txns.length === 0 ? (
            <p className="text-sm text-[#7A8394]">No transactions yet.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {txns.map((tx) => (
                <li
                  key={tx.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-[#C4C7CF]">
                      {tx.merchant}
                    </p>
                    <p className="text-xs text-[#7A8394]">
                      {new Date(tx.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[#F2F2F2]">
                      {htg(tx.amount)}
                    </p>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusColor[tx.status]}`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ============================================================ */}
        {/*  5. CARD SETTINGS                                            */}
        {/* ============================================================ */}
        <section className="rounded-2xl bg-[#151B2E] p-6">
          <h2 className="mb-4 font-semibold text-[#F2F2F2]">Card Settings</h2>
          <div className="space-y-4">
            {(
              [
                {
                  key: "online" as const,
                  label: "Online Transactions",
                  icon: Globe,
                },
                {
                  key: "international" as const,
                  label: "International Transactions",
                  icon: Shield,
                },
                {
                  key: "contactless" as const,
                  label: "Contactless Payments",
                  icon: Wifi,
                },
              ] as const
            ).map(({ key, label, icon: Icon }) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-[#7A8394]" />
                  <span className="text-sm text-[#C4C7CF]">{label}</span>
                </div>
                <button
                  disabled={savingSettings || isFrozen}
                  onClick={() => updateSetting(key)}
                  className={`relative h-6 w-11 rounded-full transition disabled:opacity-40 ${
                    card.settings[key] ? "bg-[#C6A756]" : "bg-[#7A8394]/30"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      card.settings[key] ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
