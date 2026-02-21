"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { kkGet, kkPost } from "@/lib/kobklein-api";
import {
  CreditCard,
  Plus,
  Snowflake,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Zap,
  RefreshCw,
  Share2,
  Globe,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type VirtualCard = {
  id: string;
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  currency: string;
  status: "active" | "frozen" | "canceled";
  createdAt: string;
};

type NewCardDetails = VirtualCard & {
  cardNumber: string;
  cvv: string;
};

// ─── Design tokens ────────────────────────────────────────────────────────────

const BG = "#050F0C";
const CARD_BG = "#0B1A16";
const PANEL = "#0E2018";
const BORDER = "rgba(13,158,138,0.14)";
const TEAL = "#0D9E8A";
const TEAL_BRIGHT = "#14C9B0";
const GOLD = "#E2CA6E";
const GOLD_MID = "#C9A84C";

// ─── Card Visual ─────────────────────────────────────────────────────────────

function CardVisual({
  card,
  reveal,
  newDetails,
}: {
  card: VirtualCard;
  reveal: boolean;
  newDetails?: NewCardDetails | null;
}) {
  const isFrozen = card.status === "frozen";
  const isCanceled = card.status === "canceled";

  const displayNumber =
    reveal && newDetails
      ? newDetails.cardNumber.replace(/(.{4})/g, "$1 ").trim()
      : `•••• •••• •••• ${card.last4}`;

  const displayExpiry = `${String(card.expiryMonth).padStart(2, "0")}/${String(card.expiryYear).slice(-2)}`;
  const displayCvv = reveal && newDetails ? newDetails.cvv : "•••";

  return (
    <motion.div
      className="relative w-full rounded-3xl overflow-hidden select-none cursor-default"
      style={{
        background: isCanceled
          ? "linear-gradient(145deg, #1a1a1a, #111)"
          : isFrozen
          ? "linear-gradient(145deg, #0a1525, #0d1e33)"
          : "linear-gradient(145deg, #091c15 0%, #0c2218 50%, #061410 100%)",
        border: isFrozen
          ? "1px solid rgba(59,130,246,0.3)"
          : `1px solid ${BORDER}`,
        aspectRatio: "1.586 / 1",
        maxWidth: 380,
      }}
      whileHover={{ scale: isCanceled ? 1 : 1.01 }}
      transition={{ duration: 0.2 }}
    >
      {/* Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: isFrozen
            ? "radial-gradient(circle at 30% 70%, rgba(59,130,246,0.15) 0%, transparent 60%)"
            : `radial-gradient(circle at 80% 20%, ${TEAL}20 0%, transparent 60%)`,
        }}
      />
      {/* Grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, ${TEAL} 0, ${TEAL} 1px, transparent 1px, transparent 20px),
            repeating-linear-gradient(90deg, ${TEAL} 0, ${TEAL} 1px, transparent 1px, transparent 20px)`,
        }}
      />

      <div className="relative z-10 p-6 h-full flex flex-col justify-between">
        {/* Top */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: TEAL }}>
              KobKlein
            </div>
            <div className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              Virtual Card
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isFrozen && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(59,130,246,0.2)", color: "#60a5fa" }}>
                <Snowflake className="h-2.5 w-2.5" /> Frozen
              </span>
            )}
            {isCanceled && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(239,68,68,0.2)", color: "#f87171" }}>
                Canceled
              </span>
            )}
            {/* Chip */}
            <div className="w-9 h-7 rounded-md"
              style={{ background: `linear-gradient(135deg, ${GOLD}AA, ${GOLD_MID}AA)` }} />
          </div>
        </div>

        {/* Number */}
        <div className="text-xl font-black tracking-[0.12em] text-white mt-3"
          style={{ fontFamily: "monospace" }}>
          {displayNumber}
        </div>

        {/* Bottom */}
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Expires</div>
            <div className="text-sm font-bold text-white" style={{ fontFamily: "monospace" }}>{displayExpiry}</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>CVV</div>
            <div className="text-sm font-bold text-white" style={{ fontFamily: "monospace" }}>{displayCvv}</div>
          </div>
          <div className="text-base font-black italic" style={{ color: GOLD }}>VISA</div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VirtualCardPage() {
  const [cards, setCards] = useState<VirtualCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newCard, setNewCard] = useState<NewCardDetails | null>(null);
  const [revealId, setRevealId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await kkGet<VirtualCard[]>("v1/cards");
      setCards(data);
    } catch (e: any) {
      setError(e?.message || "Could not load cards");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      const card = await kkPost<NewCardDetails>("v1/cards", {});
      setNewCard(card);
      setRevealId(card.id);
      setCards((prev) => [card, ...prev]);
    } catch (e: any) {
      setError(e?.message || "Could not create card. KYC level 2 required.");
    } finally {
      setCreating(false);
    }
  };

  const handleFreeze = async (id: string) => {
    setActionLoading(id + "-freeze");
    try {
      const res = await kkPost<{ ok: boolean; status: string }>(`v1/cards/${id}/freeze`, {});
      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: res.status as VirtualCard["status"] } : c)),
      );
    } catch (e: any) {
      setError(e?.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm("Cancel this card permanently? This cannot be undone.")) return;
    setActionLoading(id + "-cancel");
    try {
      await kkPost(`v1/cards/${id}/cancel`, {});
      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "canceled" } : c)),
      );
    } catch (e: any) {
      setError(e?.message);
    } finally {
      setActionLoading(null);
    }
  };

  const copyNumber = (num: string) => {
    navigator.clipboard.writeText(num.replace(/\s/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeCards = cards.filter((c) => c.status !== "canceled");
  const canCreate = activeCards.length < 3;

  return (
    <div className="min-h-screen pb-28" style={{ background: BG, color: "white" }}>
      <div className="max-w-xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 mb-1" style={{ color: TEAL }}>
              <CreditCard className="h-3 w-3" /> Virtual Cards
            </div>
            <h1 className="text-2xl font-black text-white">My KobKlein Cards</h1>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              Shop internationally — Netflix, Amazon & more
            </p>
          </div>
          <button type="button" onClick={load} aria-label="Refresh" title="Refresh cards"
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: PANEL, border: `1px solid ${BORDER}` }}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} style={{ color: TEAL }} />
          </button>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-300 flex-1">{error}</p>
              <button type="button" onClick={() => setError(null)} className="text-red-400 text-xs font-bold">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* New card one-time reveal banner */}
        <AnimatePresence>
          {newCard && (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="p-4 rounded-2xl space-y-3"
              style={{ background: "rgba(13,158,138,0.1)", border: `1px solid ${TEAL}40` }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" style={{ color: TEAL }} />
                <div className="text-sm font-bold text-white">Card created! Save these details now.</div>
              </div>
              <div className="text-xs leading-relaxed p-3 rounded-xl"
                style={{ background: "rgba(255,220,0,0.06)", border: "1px solid rgba(255,220,0,0.15)", color: "#FCD34D" }}>
                ⚠️ Full number & CVV shown <strong>only once</strong>. Save them or add to Apple/Google Pay immediately.
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => copyNumber(newCard.cardNumber)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: `${TEAL}20`, color: TEAL_BRIGHT, border: `1px solid ${BORDER}` }}>
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied!" : "Copy number"}
                </button>
                <button type="button" onClick={() => setNewCard(null)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cards list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-3xl animate-pulse"
                style={{ background: CARD_BG, aspectRatio: "1.586 / 1", maxWidth: 380 }} />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="py-16 text-center space-y-4">
            <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center"
              style={{ background: `${TEAL}15`, border: `2px solid ${BORDER}` }}>
              <CreditCard className="h-10 w-10" style={{ color: TEAL }} />
            </div>
            <div>
              <div className="text-lg font-bold text-white">No virtual cards yet</div>
              <div className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                Get your KobKlein Visa card to shop internationally
              </div>
              <div className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.25)" }}>
                Netflix · Amazon · Apple · Google Play · Airbnb & more
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {cards.map((card, i) => (
              <motion.div key={card.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }} className="space-y-3">
                <CardVisual
                  card={card}
                  reveal={revealId === card.id}
                  newDetails={newCard?.id === card.id ? newCard : null}
                />

                {card.status !== "canceled" && (
                  <div className="flex gap-2 flex-wrap">
                    <button type="button"
                      onClick={() => setRevealId(revealId === card.id ? null : card.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                      style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: `1px solid ${BORDER}` }}
                      title={revealId === card.id ? "Hide details" : "Show details (for newly created cards only)"}>
                      {revealId === card.id ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {revealId === card.id ? "Hide" : "Details"}
                    </button>

                    <button type="button"
                      onClick={() => handleFreeze(card.id)}
                      disabled={actionLoading === card.id + "-freeze"}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                      style={{
                        background: card.status === "frozen" ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.06)",
                        color: card.status === "frozen" ? "#60a5fa" : "rgba(255,255,255,0.6)",
                        border: `1px solid ${card.status === "frozen" ? "rgba(59,130,246,0.3)" : BORDER}`,
                      }}>
                      <Snowflake className="h-3.5 w-3.5" />
                      {card.status === "frozen" ? "Unfreeze" : "Freeze"}
                    </button>

                    <button type="button"
                      onClick={() => handleCancel(card.id)}
                      disabled={actionLoading === card.id + "-cancel"}
                      aria-label="Cancel card permanently"
                      title="Cancel card permanently"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold ml-auto"
                      style={{ background: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                      <Trash2 className="h-3.5 w-3.5" />
                      Cancel
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Create new card CTA */}
        {canCreate && !loading && (
          <motion.button type="button" onClick={handleCreate} disabled={creating} whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold text-white"
            style={{
              background: creating ? PANEL : `linear-gradient(135deg, ${TEAL}, #0A8A78)`,
              border: `1px solid ${creating ? BORDER : "transparent"}`,
            }}>
            {creating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {creating ? "Creating card…" : "Create New Virtual Card"}
          </motion.button>
        )}

        {!canCreate && !loading && (
          <div className="text-center text-xs py-2" style={{ color: "rgba(255,255,255,0.3)" }}>
            Maximum 3 active cards reached
          </div>
        )}

        {/* International use banner */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
          className="rounded-2xl p-4 space-y-3"
          style={{
            background: "linear-gradient(135deg, rgba(13,158,138,0.10), rgba(13,158,138,0.04))",
            border: `1px solid rgba(13,158,138,0.20)`,
          }}>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 shrink-0" style={{ color: TEAL }} />
            <div className="text-sm font-bold text-white">Shop Internationally</div>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
            Your KobKlein virtual Visa card works on <strong style={{ color: "rgba(255,255,255,0.8)" }}>any website or app that accepts Visa</strong> — even if they don't ship to Haiti.
          </p>
          <div className="flex flex-wrap gap-2">
            {["Netflix", "Amazon", "Apple", "Google Play", "Spotify", "Airbnb", "eBay", "Canva"].map((name) => (
              <span key={name}
                className="text-[10px] font-bold px-2 py-1 rounded-lg"
                style={{ background: `rgba(13,158,138,0.12)`, color: TEAL_BRIGHT, border: `1px solid rgba(13,158,138,0.18)` }}>
                {name}
              </span>
            ))}
          </div>
          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
            Use your card number, expiry, and CVV at checkout — just like any other Visa card.
          </p>
        </motion.div>

        {/* Feature info */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.33 }}
          className="rounded-2xl p-4 space-y-3"
          style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
          <div className="text-xs font-bold text-white">Card Features</div>
          {[
            { icon: Shield, text: "256-bit encrypted — card number never stored in plain text" },
            { icon: Zap, text: "Add to Apple Pay or Google Pay for tap-to-pay" },
            { icon: CreditCard, text: "Up to 3 active cards • Freeze/unfreeze anytime" },
            { icon: Share2, text: "One-time reveal — save your number before dismissing" },
            { icon: CheckCircle2, text: "KYC level 2 required for issuance" },
          ].map((f, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <f.icon className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: TEAL }} />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{f.text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
