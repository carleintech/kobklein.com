"use client";

/**
 * Soft POS — Turn your phone into a card reader
 *
 * Merchants and distributors can receive payments by:
 *   1. Showing their receive QR code for customers to scan
 *   2. Tapping the customer's phone via Web NFC (Android Chrome only)
 *
 * On payment receipt, the balance is updated automatically via the
 * existing merchant-payment API endpoint.
 */

import {
  CheckCircle,
  Loader2,
  NfcIcon,
  QrCode,
  RefreshCw,
  Smartphone,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import QRCodeLib from "qrcode";
import { useNFC } from "@/hooks/useNFC";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";

type Profile = { kId: string; firstName: string; lastName: string; role: string };

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`/api/kobklein/${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? "Request failed");
  return json as T;
}

type PosJob = { amount: number; currency: string; senderKId?: string; note?: string };

export default function PosPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [mode, setMode] = useState<"qr" | "nfc">("qr");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("HTG");
  const [note, setNote] = useState("");
  const [lastPayment, setLastPayment] = useState<{ amount: number; currency: string; from?: string } | null>(null);

  const { supported: nfcSupported, scanning, error: nfcError, startScan, stopScan } = useNFC();

  const { online, queue, enqueue } = useOfflineQueue<PosJob>(
    "pos_payments",
    async (job) => {
      await apiFetch("v1/transfers/receive-pos", {
        method: "POST",
        body: JSON.stringify(job.payload),
      });
    },
  );

  // Load merchant/distributor profile
  useEffect(() => {
    apiFetch<{ user: Profile }>("v1/users/me")
      .then((d) => setProfile(d.user))
      .catch(() => {});
  }, []);

  // Generate QR code whenever profile, amount, or note changes
  const generateQr = useCallback(async () => {
    if (!profile?.kId) return;
    const payload = JSON.stringify({
      kId: profile.kId,
      name: `${profile.firstName} ${profile.lastName}`,
      ...(amount ? { amount: Number(amount), currency } : {}),
      ...(note ? { note } : {}),
      ts: Date.now(),
    });
    try {
      const url = await QRCodeLib.toDataURL(payload, {
        width: 300,
        margin: 2,
        color: { dark: "#080B14", light: "#F2F2F2" },
        errorCorrectionLevel: "H", // High — readable even in partial damage / low light
      });
      setQrDataUrl(url);
    } catch { /* silent */ }
  }, [profile, amount, currency, note]);

  useEffect(() => { generateQr(); }, [generateQr]);

  // Handle NFC tap — extract K-ID from NFC tag and record payment
  function handleNfcTap() {
    if (scanning) { stopScan(); return; }
    startScan(async (result) => {
      const kIdRecord = result.records.find((r) => r.data?.startsWith("KP-") || r.data?.startsWith("KK-"));
      const senderKId = kIdRecord?.data ?? result.serialNumber;

      if (!amount || Number(amount) <= 0) return;

      const payload: PosJob = { amount: Number(amount), currency, senderKId, note };

      if (!online) {
        await enqueue("pos_payment", payload);
        setLastPayment({ amount: Number(amount), currency, from: senderKId });
        return;
      }

      try {
        await apiFetch("v1/merchant/receive", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setLastPayment({ amount: Number(amount), currency, from: senderKId });
        stopScan();
      } catch {
        await enqueue("pos_payment", payload);
        setLastPayment({ amount: Number(amount), currency, from: senderKId });
        stopScan();
      }
    });
  }

  const isReady = profile?.role === "merchant" || profile?.role === "distributor";

  return (
    <div className="space-y-5 pb-10 max-w-sm mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-kob-text flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-kob-gold" />
            Soft POS
          </h1>
          <p className="text-xs text-kob-muted">Accept payments on your phone</p>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
          online ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" : "bg-orange-500/10 border-orange-500/25 text-orange-400"
        }`}>
          {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {online ? "Online" : "Offline"}
        </div>
      </div>

      {!isReady && profile && (
        <div className="rounded-2xl border border-orange-500/25 bg-orange-500/8 px-4 py-3 text-xs text-orange-400">
          Soft POS is available for merchants and distributors only.
        </div>
      )}

      {/* Amount + currency */}
      <div className="rounded-2xl border border-white/8 bg-[#091C14] p-4 space-y-3">
        <p className="text-[10px] font-semibold text-kob-muted uppercase tracking-widest">Amount to receive</p>
        <div className="flex gap-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
            aria-label="Amount"
            className="flex-1 h-12 rounded-xl bg-white/5 border border-white/10 focus:border-kob-gold/40 focus:outline-none px-4 text-xl font-bold text-kob-text transition-colors"
          />
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            aria-label="Currency"
            className="w-20 h-12 rounded-xl bg-white/5 border border-white/10 focus:border-kob-gold/40 focus:outline-none px-2 text-sm font-semibold text-kob-text appearance-none text-center transition-colors"
          >
            {["HTG", "USD"].map((c) => (
              <option key={c} value={c} className="bg-[#091C14]">{c}</option>
            ))}
          </select>
        </div>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional)"
          maxLength={100}
          aria-label="Payment note"
          className="w-full h-9 rounded-xl bg-white/5 border border-white/10 focus:border-kob-gold/40 focus:outline-none px-3 text-xs text-kob-text placeholder:text-kob-muted/50 transition-colors"
        />
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        {(["qr", "nfc"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); if (m !== "nfc" && scanning) stopScan(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
              mode === m ? "bg-kob-gold/10 border-kob-gold/30 text-kob-gold" : "bg-white/4 border-white/8 text-kob-muted"
            }`}
          >
            {m === "qr" ? <QrCode className="h-4 w-4" /> : <NfcIcon className="h-4 w-4" />}
            {m === "qr" ? "QR Code" : "NFC Tap"}
            {m === "nfc" && !nfcSupported && <span className="text-[9px] text-kob-muted/60">(unsupported)</span>}
          </button>
        ))}
      </div>

      {/* QR Mode */}
      {mode === "qr" && (
        <div className="rounded-2xl border border-white/8 bg-white p-5 flex flex-col items-center gap-3">
          {qrDataUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="Payment QR code" className="w-64 h-64" />
              <p className="text-xs text-[#080B14] font-medium">
                {amount ? `${Number(amount).toLocaleString()} ${currency}` : "Scan to pay any amount"}
              </p>
              {profile?.kId && (
                <p className="text-[10px] text-[#080B14]/60 font-mono">{profile.kId}</p>
              )}
            </>
          ) : (
            <div className="w-64 h-64 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#080B14]/30" />
            </div>
          )}
          <button type="button" onClick={generateQr} className="flex items-center gap-1.5 text-[10px] text-[#080B14]/50 hover:text-[#080B14] transition-colors">
            <RefreshCw className="h-3 w-3" /> Refresh QR
          </button>
        </div>
      )}

      {/* NFC Mode */}
      {mode === "nfc" && (
        <div className="rounded-2xl border border-white/8 bg-[#091C14] p-6 flex flex-col items-center gap-4">
          {!nfcSupported ? (
            <div className="text-center space-y-2 py-4">
              <NfcIcon className="h-12 w-12 text-kob-muted/30 mx-auto" />
              <p className="text-sm text-kob-text font-medium">NFC not supported</p>
              <p className="text-xs text-kob-muted">Web NFC requires Android + Chrome. Use QR code instead.</p>
            </div>
          ) : (
            <>
              <div className={`h-24 w-24 rounded-full border-4 flex items-center justify-center transition-all ${
                scanning ? "border-kob-gold animate-pulse bg-kob-gold/10" : "border-white/20 bg-white/5"
              }`}>
                <NfcIcon className={`h-10 w-10 ${scanning ? "text-kob-gold" : "text-kob-muted"}`} />
              </div>
              <p className="text-sm font-medium text-kob-text">
                {scanning ? "Waiting for tap…" : "Ready to scan"}
              </p>
              <p className="text-xs text-kob-muted text-center">
                {scanning ? "Ask the customer to tap their phone or card" : "Tap Start, then have the customer tap their device"}
              </p>
              {nfcError && (
                <p className="text-xs text-red-400 bg-red-500/8 border border-red-500/20 rounded-xl px-3 py-2 text-center">{nfcError}</p>
              )}
              <button
                type="button"
                disabled={!amount || Number(amount) <= 0}
                onClick={handleNfcTap}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40 ${
                  scanning ? "bg-red-500/10 border border-red-500/30 text-red-400" : "bg-kob-gold text-kob-black hover:bg-kob-gold-light"
                }`}
              >
                <NfcIcon className="h-4 w-4" />
                {scanning ? "Stop Scan" : "Start NFC Scan"}
              </button>
              {!amount || Number(amount) <= 0 ? (
                <p className="text-[10px] text-orange-400">Enter an amount before scanning</p>
              ) : null}
            </>
          )}
        </div>
      )}

      {/* Last payment success */}
      {lastPayment && (
        <div className="flex items-start gap-3 px-4 py-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/8">
          <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-400">Payment received!</p>
            <p className="text-xs text-emerald-400/70 mt-0.5">
              {lastPayment.amount.toLocaleString()} {lastPayment.currency}
              {lastPayment.from && ` from ${lastPayment.from}`}
              {!online && " · saved offline, will sync when online"}
            </p>
          </div>
        </div>
      )}

      {/* Offline queue badge */}
      {queue.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-orange-500/25 bg-orange-500/8">
          <WifiOff className="h-4 w-4 text-orange-400 shrink-0" />
          <p className="text-xs text-orange-400">
            {queue.length} payment{queue.length !== 1 ? "s" : ""} queued offline — will sync automatically when reconnected
          </p>
        </div>
      )}
    </div>
  );
}
