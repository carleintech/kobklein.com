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
  Package,
  MapPin,
  Truck,
  Clock,
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
          : "linear-gradient(145deg, #1C0A35 0%, #2E1060 50%, #160830 100%)",
        border: isFrozen
          ? "1px solid rgba(165,150,201,0.4)"
          : "1px solid var(--dash-shell-border, rgba(165,150,201,0.25))",
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
            ? "radial-gradient(circle at 30% 70%, rgba(165,150,201,0.15) 0%, transparent 60%)"
            : "radial-gradient(circle at 80% 20%, rgba(212,175,55,0.12) 0%, transparent 60%)",
        }}
      />
      {/* Grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, rgba(165,150,201,0.06) 0, rgba(165,150,201,0.06) 1px, transparent 1px, transparent 20px),
            repeating-linear-gradient(90deg, rgba(165,150,201,0.06) 0, rgba(165,150,201,0.06) 1px, transparent 1px, transparent 20px)`,
        }}
      />

      <div className="relative z-10 p-6 h-full flex flex-col justify-between">
        {/* Top */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--dash-accent, #D4AF37)" }}>
              KobKlein
            </div>
            <div className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              Virtual Card
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isFrozen && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(165,150,201,0.2)", color: "#A596C9" }}>
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
              style={{ background: "linear-gradient(135deg, #E2CA6EAA, #C9A84CAA)" }} />
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
            <div className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: "var(--dash-text-muted, #A596C9)" }}>Expires</div>
            <div className="text-sm font-bold text-white" style={{ fontFamily: "monospace" }}>{displayExpiry}</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: "var(--dash-text-muted, #A596C9)" }}>CVV</div>
            <div className="text-sm font-bold text-white" style={{ fontFamily: "monospace" }}>{displayCvv}</div>
          </div>
          <div className="text-base font-black italic" style={{ color: "#E2CA6E" }}>VISA</div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Physical card types ──────────────────────────────────────────────────────

type PhysicalCardStatus = {
  id: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "rejected";
  cardholderName: string;
  city: string;
  trackingNum?: string;
  rejectionNote?: string;
  createdAt: string;
} | null;

const PHYS_STATUS_LABEL: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:    { label: "Request Submitted",   color: "#C9A84C", icon: Clock     },
  processing: { label: "Being Processed",     color: "#D4AF37", icon: Package  },
  shipped:    { label: "Shipped",             color: "#8B5CF6", icon: Truck    },
  delivered:  { label: "Delivered",           color: "#10B981", icon: CheckCircle2 },
  rejected:   { label: "Request Rejected",    color: "#EF4444", icon: AlertTriangle },
};

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

  // Physical card state
  const [physCard, setPhysCard]         = useState<PhysicalCardStatus>(undefined as any);
  const [physLoading, setPhysLoading]   = useState(true);
  const [showPhysForm, setShowPhysForm] = useState(false);
  const [physSubmitting, setPhysSubmitting] = useState(false);
  const [physError, setPhysError]       = useState<string | null>(null);
  const [physForm, setPhysForm]         = useState({
    cardholderName: "", addressLine1: "", addressLine2: "",
    city: "", postalCode: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await kkGet<VirtualCard[]>("v1/cards");
      setCards(data);
    } catch (e: unknown) {
      setError((e as Error)?.message || "Could not load cards");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPhysCard = useCallback(async () => {
    setPhysLoading(true);
    try {
      const data = await kkGet<PhysicalCardStatus>("v1/cards/physical/status");
      setPhysCard(data);
    } catch {
      setPhysCard(null);
    } finally {
      setPhysLoading(false);
    }
  }, []);

  useEffect(() => { load(); loadPhysCard(); }, [load, loadPhysCard]);

  const handlePhysRequest = async () => {
    if (!physForm.cardholderName.trim() || !physForm.addressLine1.trim() || !physForm.city.trim()) {
      setPhysError("Cardholder name, address, and city are required.");
      return;
    }
    setPhysSubmitting(true);
    setPhysError(null);
    try {
      const result = await kkPost<PhysicalCardStatus>("v1/cards/physical/request", physForm);
      setPhysCard(result);
      setShowPhysForm(false);
    } catch (e: unknown) {
      setPhysError((e as Error)?.message || "Could not submit request. KYC required.");
    } finally {
      setPhysSubmitting(false);
    }
  };

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
    <div className="min-h-screen pb-28" style={{ background: "var(--dash-page-bg, #240E3C)", color: "white" }}>
      <div className="max-w-xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 mb-1" style={{ color: "var(--dash-accent, #D4AF37)" }}>
              <CreditCard className="h-3 w-3" /> Virtual Cards
            </div>
            <h1 className="text-2xl font-black text-white">My KobKlein Cards</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--dash-text-muted, #A596C9)" }}>
              Shop internationally — Netflix, Amazon & more
            </p>
          </div>
          <button type="button" onClick={load} aria-label="Refresh" title="Refresh cards"
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "var(--dash-shell-bg, #1C0A35)",
              border: "1px solid var(--dash-shell-border, rgba(165,150,201,0.25))",
            }}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} style={{ color: "var(--dash-accent, #D4AF37)" }} />
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
              style={{
                background: "rgba(165,150,201,0.15)",
                border: "1px solid rgba(165,150,201,0.3)",
              }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" style={{ color: "#A596C9" }} />
                <div className="text-sm font-bold text-white">Card created! Save these details now.</div>
              </div>
              <div className="text-xs leading-relaxed p-3 rounded-xl"
                style={{ background: "rgba(255,220,0,0.06)", border: "1px solid rgba(255,220,0,0.15)", color: "#FCD34D" }}>
                ⚠️ Full number & CVV shown <strong>only once</strong>. Save them or add to Apple/Google Pay immediately.
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => copyNumber(newCard.cardNumber)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                  style={{
                    background: "rgba(212,175,55,0.15)",
                    color: "var(--dash-accent, #D4AF37)",
                    border: "1px solid var(--dash-shell-border, rgba(165,150,201,0.25))",
                  }}>
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied!" : "Copy number"}
                </button>
                <button type="button" onClick={() => setNewCard(null)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: "rgba(255,255,255,0.06)", color: "var(--dash-text-faint, #6E558B)" }}>
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
                style={{ background: "var(--dash-shell-bg, #1C0A35)", aspectRatio: "1.586 / 1", maxWidth: 380 }} />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="py-16 text-center space-y-4">
            <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center"
              style={{
                background: "rgba(212,175,55,0.15)",
                border: "2px solid rgba(212,175,55,0.25)",
              }}>
              <CreditCard className="h-10 w-10" style={{ color: "var(--dash-accent, #D4AF37)" }} />
            </div>
            <div>
              <div className="text-lg font-bold text-white">No virtual cards yet</div>
              <div className="text-sm mt-1" style={{ color: "var(--dash-text-muted, #A596C9)" }}>
                Get your KobKlein Visa card to shop internationally
              </div>
              <div className="text-xs mt-2" style={{ color: "var(--dash-text-faint, #6E558B)" }}>
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
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        color: "rgba(255,255,255,0.6)",
                        border: "1px solid var(--dash-shell-border, rgba(165,150,201,0.25))",
                      }}
                      title={revealId === card.id ? "Hide details" : "Show details (for newly created cards only)"}>
                      {revealId === card.id ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {revealId === card.id ? "Hide" : "Details"}
                    </button>

                    <button type="button"
                      onClick={() => handleFreeze(card.id)}
                      disabled={actionLoading === card.id + "-freeze"}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                      style={{
                        background: card.status === "frozen" ? "rgba(165,150,201,0.15)" : "rgba(255,255,255,0.06)",
                        color: card.status === "frozen" ? "#A596C9" : "rgba(255,255,255,0.6)",
                        border: `1px solid ${card.status === "frozen" ? "rgba(165,150,201,0.3)" : "var(--dash-shell-border, rgba(165,150,201,0.25))"}`,
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
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold"
            style={{
              background: creating
                ? "var(--dash-shell-bg, #1C0A35)"
                : "linear-gradient(135deg, #D4AF37, #9F7F2C)",
              border: creating
                ? "1px solid var(--dash-shell-border, rgba(165,150,201,0.25))"
                : "1px solid transparent",
              color: creating ? "rgba(255,255,255,0.6)" : "#080B14",
            }}>
            {creating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {creating ? "Creating card…" : "Create New Virtual Card"}
          </motion.button>
        )}

        {!canCreate && !loading && (
          <div className="text-center text-xs py-2" style={{ color: "var(--dash-text-faint, #6E558B)" }}>
            Maximum 3 active cards reached
          </div>
        )}

        {/* International use banner */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
          className="rounded-2xl p-4 space-y-3"
          style={{
            background: "linear-gradient(135deg, rgba(212,175,55,0.10), rgba(212,175,55,0.04))",
            border: "1px solid rgba(212,175,55,0.20)",
          }}>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 shrink-0" style={{ color: "var(--dash-accent, #D4AF37)" }} />
            <div className="text-sm font-bold text-white">Shop Internationally</div>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
            Your KobKlein virtual Visa card works on <strong style={{ color: "rgba(255,255,255,0.8)" }}>any website or app that accepts Visa</strong> — even if they don't ship to Haiti.
          </p>
          <div className="flex flex-wrap gap-2">
            {["Netflix", "Amazon", "Apple", "Google Play", "Spotify", "Airbnb", "eBay", "Canva"].map((name) => (
              <span key={name}
                className="text-[10px] font-bold px-2 py-1 rounded-lg"
                style={{
                  background: "rgba(212,175,55,0.12)",
                  color: "#D4AF37",
                  border: "1px solid rgba(212,175,55,0.18)",
                }}>
                {name}
              </span>
            ))}
          </div>
          <p className="text-[10px]" style={{ color: "var(--dash-text-faint, #6E558B)" }}>
            Use your card number, expiry, and CVV at checkout — just like any other Visa card.
          </p>
        </motion.div>

        {/* Feature info */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.33 }}
          className="rounded-2xl p-4 space-y-3"
          style={{
            background: "var(--dash-shell-bg, #1C0A35)",
            border: "1px solid var(--dash-shell-border, rgba(165,150,201,0.25))",
          }}>
          <div className="text-xs font-bold text-white">Card Features</div>
          {[
            { icon: Shield, text: "256-bit encrypted — card number never stored in plain text" },
            { icon: Zap, text: "Add to Apple Pay or Google Pay for tap-to-pay" },
            { icon: CreditCard, text: "Up to 3 active cards • Freeze/unfreeze anytime" },
            { icon: Share2, text: "One-time reveal — save your number before dismissing" },
            { icon: CheckCircle2, text: "KYC level 2 required for issuance" },
          ].map((f) => (
            <div key={f.text} className="flex items-start gap-2.5">
              <f.icon className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "var(--dash-accent, #D4AF37)" }} />
              <span className="text-xs" style={{ color: "var(--dash-text-faint, #6E558B)" }}>{f.text}</span>
            </div>
          ))}
        </motion.div>

        {/* ── Physical Card Request ─────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(198,167,86,0.2)" }}>

          {/* Header */}
          <div className="px-4 py-3 flex items-center gap-3"
            style={{ background: "linear-gradient(135deg, rgba(198,167,86,0.12), rgba(198,167,86,0.05))" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(198,167,86,0.15)" }}>
              <Package className="h-4.5 w-4.5" style={{ color: "#C6A756" }} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-white">Physical KobKlein Card</div>
              <div className="text-[10px] mt-0.5" style={{ color: "var(--dash-text-muted, #A596C9)" }}>
                Request a physical debit card delivered to your address
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4" style={{ background: "var(--dash-shell-bg, #1C0A35)" }}>

            {/* Physical card error */}
            <AnimatePresence>
              {physError && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                  <p className="text-xs text-red-300 flex-1">{physError}</p>
                  <button type="button" onClick={() => setPhysError(null)} className="text-red-400 text-xs">✕</button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Status when request exists */}
            {!physLoading && physCard && (() => {
              const st = PHYS_STATUS_LABEL[physCard.status] ?? { label: physCard.status, color: "#7A8394", icon: Clock };
              const StatusIcon = st.icon;
              return (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: `${st.color}12`, border: `1px solid ${st.color}30` }}>
                    <StatusIcon className="h-4 w-4 shrink-0" style={{ color: st.color }} />
                    <div className="flex-1">
                      <p className="text-sm font-bold" style={{ color: st.color }}>{st.label}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: "var(--dash-text-muted, #A596C9)" }}>
                        Submitted {new Date(physCard.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        {" · "}{physCard.cardholderName}, {physCard.city}
                      </p>
                    </div>
                  </div>
                  {physCard.trackingNum && (
                    <div className="flex items-center gap-2 text-xs"
                      style={{ color: "var(--dash-text-faint, #6E558B)" }}>
                      <Truck className="h-3.5 w-3.5" style={{ color: "#8B5CF6" }} />
                      <span>Tracking: <span className="font-mono text-white">{physCard.trackingNum}</span></span>
                    </div>
                  )}
                  {physCard.rejectionNote && (
                    <p className="text-xs" style={{ color: "#F87171" }}>{physCard.rejectionNote}</p>
                  )}
                  {physCard.status === "rejected" && (
                    <button type="button" onClick={() => { setPhysCard(null); setShowPhysForm(true); }}
                      className="w-full py-2.5 rounded-xl text-xs font-bold"
                      style={{ background: "rgba(198,167,86,0.12)", border: "1px solid rgba(198,167,86,0.25)", color: "#C6A756" }}>
                      Submit New Request
                    </button>
                  )}
                </div>
              );
            })()}

            {/* No request yet — CTA or form */}
            {!physLoading && !physCard && !showPhysForm && (
              <button type="button" onClick={() => setShowPhysForm(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
                style={{ background: "linear-gradient(135deg, #C6A756, #9F7F2C)", color: "#080B14" }}>
                <MapPin className="h-4 w-4" />
                Request Physical Card
              </button>
            )}

            {/* Request form */}
            <AnimatePresence>
              {showPhysForm && !physCard && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
                  <p className="text-[11px]" style={{ color: "var(--dash-text-muted, #A596C9)" }}>
                    Enter your delivery address. KYC verification is required.
                  </p>
                  {(["cardholderName", "addressLine1", "addressLine2", "city", "postalCode"] as const).map((field) => {
                    const labels: Record<string, string> = {
                      cardholderName: "Cardholder Name *",
                      addressLine1:   "Address Line 1 *",
                      addressLine2:   "Address Line 2",
                      city:           "City *",
                      postalCode:     "Postal Code",
                    };
                    return (
                      <div key={field}>
                        <label
                          htmlFor={`phys-${field}`}
                          className="block text-[10px] font-bold mb-1 uppercase tracking-wide"
                          style={{ color: "var(--dash-text-muted, #A596C9)" }}
                        >
                          {labels[field]}
                        </label>
                        <input
                          id={`phys-${field}`}
                          type="text"
                          value={physForm[field]}
                          placeholder={labels[field].replace(" *", "")}
                          onChange={(e) => setPhysForm((prev) => ({ ...prev, [field]: e.target.value }))}
                          className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                          style={{
                            background: "var(--dash-page-bg, #240E3C)",
                            border: "1px solid var(--dash-shell-border, rgba(165,150,201,0.25))",
                            color: "white",
                          }}
                        />
                      </div>
                    );
                  })}
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={handlePhysRequest} disabled={physSubmitting}
                      className="flex-1 py-3 rounded-xl text-sm font-bold"
                      style={{
                        background: physSubmitting ? "var(--dash-shell-bg, #1C0A35)" : "linear-gradient(135deg, #C6A756, #9F7F2C)",
                        color: "#080B14",
                      }}>
                      {physSubmitting ? "Submitting…" : "Submit Request"}
                    </button>
                    <button type="button" onClick={() => setShowPhysForm(false)}
                      className="px-4 py-3 rounded-xl text-sm font-semibold"
                      style={{ background: "rgba(255,255,255,0.06)", color: "var(--dash-text-faint, #6E558B)" }}>
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {physLoading && (
              <div className="h-10 rounded-xl animate-pulse" style={{ background: "var(--dash-shell-bg, #1C0A35)" }} />
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
