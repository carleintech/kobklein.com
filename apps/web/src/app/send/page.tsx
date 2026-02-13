"use client";

import { useState, useEffect } from "react";
import { kkGet } from "@/lib/kobklein-api";
import { attemptTransfer, confirmTransfer } from "@/lib/transfer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  if (level === "trusted") return <span className="text-xs text-green-600 font-medium">Trusted</span>;
  if (level === "moderate") return <span className="text-xs text-yellow-600 font-medium">Active User</span>;
  return <span className="text-xs text-gray-400 font-medium">New Account</span>;
}

export default function SendPage() {
  const [state, setState] = useState<SendState>("idle");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [recipientUserId, setRecipientUserId] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientTrust, setRecipientTrust] = useState<string>("new");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [receipt, setReceipt] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [smartRecipients, setSmartRecipients] = useState<Recipient[]>([]);

  useEffect(() => {
    kkGet<Recipient[]>("v1/recipients/smart")
      .then(setSmartRecipients)
      .catch(() => {});
  }, []);

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
        currency: "HTG",
      });

      if (result.otpRequired && result.challengeId) {
        setChallengeId(result.challengeId);
        setState("otp");
        return;
      }

      if (result.ok) {
        setReceipt(result);
        setState("success");
        return;
      }

      setState("confirming");
    } catch (err: any) {
      setError(err.message || "Transfer failed");
      setState("confirming");
    }
  }

  async function handleConfirmOtp() {
    if (!challengeId || !otp) return;
    setState("processing");
    setError(null);

    try {
      const result = await confirmTransfer({
        challengeId,
        otpCode: otp,
      });

      if (result.ok) {
        setReceipt(result);
        setState("success");
      } else {
        setError("OTP verification failed");
        setState("otp");
      }
    } catch (err: any) {
      setError(err.message || "OTP verification failed");
      setState("otp");
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
    setOtp("");
    setReceipt(null);
    setError(null);
  }

  // ── Success Receipt ──
  if (state === "success") {
    return (
      <div className="space-y-6">
        <div className="text-2xl font-semibold text-center">Transfer Successful</div>
        <Card className="rounded-2xl">
          <CardContent className="p-6 text-center space-y-3">
            <div className="text-3xl font-bold">{Number(amount).toLocaleString()} HTG</div>
            <div className="text-sm text-muted-foreground">sent to</div>
            <div className="text-lg font-medium">{recipientName}</div>
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

  // ── OTP Step ──
  if (state === "otp") {
    return (
      <div className="space-y-6">
        <div className="text-2xl font-semibold">Verify Transfer</div>
        <Card className="rounded-2xl">
          <CardContent className="p-4 space-y-4">
            <div className="text-sm text-muted-foreground">
              Enter the OTP code sent to your phone to confirm this transfer.
            </div>
            <Input
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
            />
            {error && <div className="text-sm text-red-600">{error}</div>}
            <Button
              onClick={handleConfirmOtp}
              disabled={otp.length < 6}
              className="w-full"
            >
              Verify & Send
            </Button>
            <Button variant="outline" onClick={() => setState("confirming")} className="w-full">
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Confirmation Screen ──
  if (state === "confirming" || state === "processing") {
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
              <div className="text-3xl font-bold">{Number(amount).toLocaleString()} HTG</div>
            </div>

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
                className={`shrink-0 px-3 py-2 rounded-xl border text-sm ${
                  recipientUserId === r.contactUserId
                    ? "border-black bg-black text-white"
                    : "border-gray-200"
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
            placeholder="Recipient phone or code"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <Input
            placeholder="Amount (HTG)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          {error && <div className="text-sm text-red-600">{error}</div>}

          <Button onClick={handleContinue} className="w-full">
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
