"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { kkGet, kkPost } from "@/lib/kobklein-api";
import { attemptTransfer, confirmTransfer } from "@/lib/transfer";
import { Card, CardContent } from "@kobklein/ui/card";
import { Button } from "@kobklein/ui/button";
import { Input } from "@kobklein/ui/input";
import { Badge } from "@kobklein/ui/badge";
import { useWallet } from "@/context/wallet-context";
import { useToast } from "@kobklein/ui";
import StepUpModal from "@/components/security/step-up-modal";
import FxPreviewCard from "@/components/finance/fx-preview-card";

type SendState = "idle" | "confirming" | "processing" | "otp" | "success";

type Recipient = {
  contactUserId: string;
  nickname?: string;
  isFavorite: boolean;
  transferCount: number;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    handle?: string;
    phone?: string;
  };
  trust: {
    score: number;
    level: string;
    reasons: string[];
  };
};

function TrustBadge({ level }: { level: string }) {
  if (level === "trusted") return <Badge variant="success" className="text-[10px]">Trusted</Badge>;
  if (level === "moderate") return <Badge variant="warning" className="text-[10px]">Active</Badge>;
  return <Badge variant="secondary" className="text-[10px]">New</Badge>;
}

export default function SendPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center pt-32">
          <div className="w-10 h-10 rounded-xl bg-primary animate-pulse flex items-center justify-center">
            <span className="text-white font-bold">K</span>
          </div>
        </div>
      }
    >
      <SendPage />
    </Suspense>
  );
}

function SendPage() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<SendState>("idle");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState("HTG");
  const [toCurrency, setToCurrency] = useState("HTG");
  const [recipientUserId, setRecipientUserId] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientTrust, setRecipientTrust] = useState<string>("new");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [smartRecipients, setSmartRecipients] = useState<Recipient[]>([]);
  const [fxPreview, setFxPreview] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [stepUpOpen, setStepUpOpen] = useState(false);

  const { optimisticDebit, refresh } = useWallet();
  const toast = useToast();

  // Pre-fill from URL params (family quick-send)
  useEffect(() => {
    const rid = searchParams.get("recipientId");
    const rname = searchParams.get("name");
    if (rid) {
      setRecipientUserId(rid);
      if (rname) setRecipientName(decodeURIComponent(rname));
    }
  }, [searchParams]);

  useEffect(() => {
    kkGet<Recipient[]>("v1/recipients/smart")
      .then(setSmartRecipients)
      .catch(() => {});
  }, []);

  // Auto-preview with debounce when amount or currency changes
  useEffect(() => {
    if (!amount || Number(amount) <= 0 || !recipientUserId) {
      setFxPreview(null);
      return;
    }

    const timeout = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const preview = await kkPost("v1/transfers/preview", {
          recipientUserId,
          amount: Number(amount),
          fromCurrency,
          toCurrency,
        });
        setFxPreview(preview);
      } catch {
        setFxPreview(null);
      } finally {
        setPreviewLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [amount, recipientUserId, fromCurrency, toCurrency]);

  function selectRecipient(r: Recipient) {
    setRecipientUserId(r.contactUserId);
    setRecipientName(r.user.firstName || r.user.handle || "User");
    setRecipientTrust(r.trust.level);
    setPhone(r.user.phone || r.user.handle || "");
  }

  function handleContinue() {
    if (!recipientUserId || !amount) {
      setError("Please select a recipient and enter an amount.");
      return;
    }
    // Check rate lock expiration
    if (fxPreview?.rateLockExpiresAt) {
      const expired = new Date(fxPreview.rateLockExpiresAt).getTime() < Date.now();
      if (expired) {
        setError("Rate expired. Refreshing preview...");
        setFxPreview(null);
        return;
      }
    }
    setError(null);
    setState("confirming");
  }

  async function handleConfirmSend() {
    setState("processing");
    setError(null);

    try {
      const result = await attemptTransfer({
        recipientUserId,
        amount: Number(amount),
        currency: fromCurrency,
      });

      if (result.otpRequired && result.challengeId) {
        setChallengeId(result.challengeId);
        setStepUpOpen(true);
        setState("otp");
        return;
      }

      if (result.ok) {
        setReceipt(result);
        optimisticDebit(fromCurrency, Number(amount));
        toast.show("Transfer sent successfully!");
        setState("success");
        return;
      }

      setState("confirming");
    } catch (err: any) {
      if (err.message?.includes("rate_expired")) {
        setError("Rate expired. Refreshing preview...");
        setFxPreview(null);
        setState("idle");
        toast.show("Rate expired — please review updated preview", "warning");
        return;
      }
      setError(err.message || "Transfer failed");
      toast.show(err.message || "Transfer failed", "error");
      setState("confirming");
    }
  }

  async function handleStepUpVerify(otpCode: string) {
    if (!challengeId) return;

    const result = await confirmTransfer({
      challengeId,
      otpCode,
    });

    if (result.ok) {
      setStepUpOpen(false);
      setReceipt(result);
      optimisticDebit(fromCurrency, Number(amount));
      toast.show("Transfer sent successfully!");
      setState("success");
    } else {
      throw new Error("OTP verification failed");
    }
  }

  function reset() {
    setState("idle");
    setPhone("");
    setAmount("");
    setRecipientUserId("");
    setRecipientName("");
    setRecipientTrust("new");
    setChallengeId(null);
    setReceipt(null);
    setError(null);
    setFxPreview(null);
    refresh();
  }

  const isCrossCurrency = fromCurrency !== toCurrency;

  // ── Success Receipt ──
  if (state === "success") {
    return (
      <div className="space-y-6">
        <div className="text-2xl font-semibold text-center">Transfer Successful</div>
        <Card className="rounded-2xl">
          <CardContent className="p-6 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 mx-auto flex items-center justify-center">
              <span className="text-3xl">✓</span>
            </div>
            <div className="text-3xl font-bold">
              {Number(amount).toLocaleString()} {fromCurrency}
            </div>
            <div className="text-sm text-muted-foreground">sent to</div>
            <div className="text-lg font-medium">{recipientName}</div>
            {fxPreview?.recipientAmount && isCrossCurrency && (
              <div className="text-sm text-primary">
                Recipient gets: {Number(fxPreview.recipientAmount).toLocaleString()} {toCurrency}
              </div>
            )}
            {receipt?.transferId && (
              <div className="text-xs text-muted-foreground">
                ID: {receipt.transferId.slice(0, 12)}...
              </div>
            )}
            <Button onClick={reset} className="w-full mt-4">
              Done
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Confirmation Screen ──
  if (state === "confirming" || state === "processing" || state === "otp") {
    return (
      <div className="space-y-6">
        <div className="text-2xl font-semibold">Confirm Transfer</div>
        <Card className="rounded-2xl">
          <CardContent className="p-6 space-y-4">
            <div className="text-center space-y-1">
              <div className="text-sm text-muted-foreground">Send Money To</div>
              <div className="text-lg font-semibold">{recipientName}</div>
              <TrustBadge level={recipientTrust} />
              {phone && (
                <div className="text-xs text-muted-foreground">
                  {phone.replace(/(.{3}).*(.{2})$/, "$1***$2")}
                </div>
              )}
            </div>

            <div className="text-center py-4">
              <div className="text-sm text-muted-foreground">You are sending</div>
              <div className="text-3xl font-bold">
                {Number(amount).toLocaleString()} {fromCurrency}
              </div>
            </div>

            <FxPreviewCard data={fxPreview} loading={previewLoading} />

            <div className="text-xs text-muted-foreground text-center">
              Make sure this is the correct person. Transfers may not be reversible.
            </div>

            {error && <div className="text-sm text-red-600 text-center">{error}</div>}

            <Button
              onClick={handleConfirmSend}
              disabled={state === "processing"}
              className="w-full"
            >
              {state === "processing" ? "Processing..." : "Confirm & Send"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setState("idle")}
              disabled={state === "processing"}
              className="w-full"
            >
              Back
            </Button>
          </CardContent>
        </Card>

        <StepUpModal
          open={stepUpOpen}
          onClose={() => {
            setStepUpOpen(false);
            setState("confirming");
          }}
          onVerify={handleStepUpVerify}
          challengeId={challengeId || undefined}
        />
      </div>
    );
  }

  // ── Idle: Select Recipient + Amount ──
  return (
    <div className="space-y-6">
      <div className="text-2xl font-semibold">Send Money</div>

      {/* Smart Recipients */}
      {smartRecipients.length > 0 && (
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            Recent & Favorites
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {smartRecipients.slice(0, 8).map((r) => (
              <button
                type="button"
                key={r.contactUserId}
                onClick={() => selectRecipient(r)}
                className={`shrink-0 px-3 py-2 rounded-xl border text-sm transition ${
                  recipientUserId === r.contactUserId
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <div className="font-medium">
                  {r.isFavorite ? "★ " : ""}
                  {r.user.firstName || r.user.handle || "User"}
                </div>
                <TrustBadge level={r.trust.level} />
              </button>
            ))}
          </div>
        </div>
      )}

      <Card className="rounded-2xl">
        <CardContent className="p-4 space-y-4">
          <Input
            placeholder="Recipient phone or K-ID"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          {/* Currency Selectors */}
          <div className="flex gap-2">
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"
            >
              <option value="HTG">Send HTG</option>
              <option value="USD">Send USD</option>
            </select>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"
            >
              <option value="HTG">Receive HTG</option>
              <option value="USD">Receive USD</option>
            </select>
          </div>

          <Input
            placeholder={`Amount (${fromCurrency})`}
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          {/* Live FX Preview */}
          {(fxPreview || previewLoading) && (
            <FxPreviewCard data={fxPreview} loading={previewLoading} />
          )}

          {error && <div className="text-sm text-red-600">{error}</div>}

          <Button onClick={handleContinue} className="w-full">
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
