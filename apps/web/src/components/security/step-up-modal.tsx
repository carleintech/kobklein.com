"use client";

import { useState } from "react";
import { Button } from "@kobklein/ui/button";
import { Input } from "@kobklein/ui/input";
import { Card, CardContent } from "@kobklein/ui/card";
import { Shield } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onVerify: (otpCode: string) => Promise<void>;
  challengeId?: string;
};

export default function StepUpModal({ open, onClose, onVerify }: Props) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleVerify() {
    if (otp.length < 6) return;
    setLoading(true);
    setError(null);

    try {
      await onVerify(otp);
    } catch (err: any) {
      setError(err.message || "Verification failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <Card className="w-full max-w-sm rounded-2xl border-white/10">
        <CardContent className="p-6 space-y-4">
          {/* Icon + Title */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Security Verification</h2>
            <p className="text-sm text-muted-foreground">
              Check your KobKlein notifications for your 6-digit verification code.
            </p>
          </div>

          {/* OTP Input */}
          <Input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            className="text-center text-2xl tracking-[0.5em] font-mono"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
          />

          {error && (
            <div className="text-sm text-red-500 text-center">{error}</div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <Button
              onClick={handleVerify}
              disabled={loading || otp.length < 6}
              className="w-full"
            >
              {loading ? "Verifying..." : "Verify & Confirm"}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setOtp("");
                setError(null);
                onClose();
              }}
              disabled={loading}
              className="w-full"
            >
              Cancel
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            This additional verification protects your account security.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
