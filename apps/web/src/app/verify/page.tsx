"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { kkGet, kkPost } from "@/lib/kobklein-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  FileText,
  Loader2,
  Shield,
  Upload,
} from "lucide-react";

type KycStatus = {
  kycTier: number;
  kycStatus: string;
  documentUrl?: string;
  selfieUrl?: string;
  addressProof?: string;
};

type UploadStep = "document" | "selfie" | "address";

const TIER_INFO = [
  {
    tier: 0,
    label: "Unverified",
    limit: "$50/month",
    next: "Submit government ID + selfie",
  },
  {
    tier: 1,
    label: "Basic",
    limit: "$500/month",
    next: "Submit proof of address",
  },
  {
    tier: 2,
    label: "Full",
    limit: "$5,000/month",
    next: "You're fully verified!",
  },
  {
    tier: 3,
    label: "Enhanced",
    limit: "Unlimited",
    next: "Enhanced due diligence complete",
  },
];

export default function VerifyPage() {
  const router = useRouter();
  const toast = useToast();
  const [status, setStatus] = useState<KycStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<UploadStep | null>(null);
  const [docType, setDocType] = useState("national_id");
  const [idNumber, setIdNumber] = useState("");

  const docInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    try {
      const res = await kkGet<KycStatus>("v1/kyc/status");
      setStatus(res);
    } catch {
      toast.show("Failed to load KYC status", "error");
    } finally {
      setLoading(false);
    }
  }

  async function uploadFile(step: UploadStep, file: File) {
    setUploading(step);
    try {
      const reader = new FileReader();
      const dataUri = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const endpoint =
        step === "document"
          ? "v1/kyc/upload/document"
          : step === "selfie"
            ? "v1/kyc/upload/selfie"
            : "v1/kyc/upload/address";

      const body: Record<string, string> = { file: dataUri };
      if (step === "document") {
        body.documentType = docType;
        if (idNumber) body.idNumber = idNumber;
      }

      await kkPost(endpoint, body);

      toast.show(
        step === "document"
          ? "ID document uploaded!"
          : step === "selfie"
            ? "Selfie uploaded!"
            : "Address proof uploaded!",
        "success",
      );
      await loadStatus();
    } catch (e: any) {
      toast.show(e.message || `Failed to upload ${step}`, "error");
    } finally {
      setUploading(null);
    }
  }

  function handleFileSelect(step: UploadStep, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.show("File too large. Maximum 10MB.", "error");
      return;
    }

    uploadFile(step, file);
    e.target.value = "";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentTier = status?.kycTier ?? 0;
  const tierInfo = TIER_INFO[Math.min(currentTier, TIER_INFO.length - 1)];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <div>
          <div className="text-2xl font-semibold">Verify Identity</div>
          <div className="text-sm text-muted-foreground">
            Unlock higher limits and features
          </div>
        </div>
      </div>

      {/* Current Status */}
      <Card className="rounded-2xl">
        <CardContent className="p-6 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div className="text-lg font-semibold">KYC Tier {currentTier}</div>
          <Badge
            variant={
              currentTier >= 2 ? "success" : currentTier === 1 ? "warning" : "destructive"
            }
          >
            {tierInfo.label}
          </Badge>
          <div className="text-sm text-muted-foreground">
            Current limit: {tierInfo.limit}
          </div>
          {currentTier < 2 && (
            <div className="text-xs text-primary">{tierInfo.next}</div>
          )}
        </CardContent>
      </Card>

      {/* Tier Progress */}
      <div className="flex items-center gap-1">
        {TIER_INFO.slice(0, 3).map((t, i) => (
          <div key={t.tier} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`w-full h-1.5 rounded-full ${
                currentTier >= t.tier ? "bg-primary" : "bg-border"
              }`}
            />
            <span className="text-[10px] text-muted-foreground">{t.label}</span>
          </div>
        ))}
      </div>

      {/* Upload Sections */}
      {currentTier < 2 && (
        <div className="space-y-4">
          {/* Step 1: Government ID */}
          <Card className="rounded-2xl">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <div className="text-sm font-semibold">Government ID</div>
                  <div className="text-xs text-muted-foreground">
                    National ID, passport, or driver license
                  </div>
                </div>
                {status?.documentUrl && (
                  <Badge variant="success" className="text-[10px]">
                    <CheckCircle2 className="h-3 w-3 mr-0.5" />
                    Done
                  </Badge>
                )}
              </div>

              {!status?.documentUrl && (
                <>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  >
                    <option value="national_id">National ID (CIN)</option>
                    <option value="passport">Passport</option>
                    <option value="drivers_license">Driver License</option>
                  </select>

                  <Input
                    placeholder="ID number (optional)"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                  />

                  <input
                    ref={docInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => handleFileSelect("document", e)}
                  />

                  <Button
                    onClick={() => docInputRef.current?.click()}
                    disabled={uploading === "document"}
                    className="w-full"
                  >
                    {uploading === "document" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload ID Document
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Selfie */}
          <Card className="rounded-2xl">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <div className="text-sm font-semibold">Selfie Verification</div>
                  <div className="text-xs text-muted-foreground">
                    Take a clear photo of your face
                  </div>
                </div>
                {status?.selfieUrl && (
                  <Badge variant="success" className="text-[10px]">
                    <CheckCircle2 className="h-3 w-3 mr-0.5" />
                    Done
                  </Badge>
                )}
              </div>

              {!status?.selfieUrl && (
                <>
                  <input
                    ref={selfieInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    onChange={(e) => handleFileSelect("selfie", e)}
                  />

                  <Button
                    onClick={() => selfieInputRef.current?.click()}
                    disabled={uploading === "selfie"}
                    variant="outline"
                    className="w-full"
                  >
                    {uploading === "selfie" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4 mr-2" />
                        Take Selfie
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Step 3: Address Proof (Tier 2) */}
          {currentTier === 1 && (
            <Card className="rounded-2xl">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold">Proof of Address</div>
                    <div className="text-xs text-muted-foreground">
                      Utility bill, bank statement, or official letter
                    </div>
                  </div>
                  {status?.addressProof && (
                    <Badge variant="success" className="text-[10px]">
                      <CheckCircle2 className="h-3 w-3 mr-0.5" />
                      Done
                    </Badge>
                  )}
                </div>

                {!status?.addressProof && (
                  <>
                    <input
                      ref={addressInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => handleFileSelect("address", e)}
                    />

                    <Button
                      onClick={() => addressInputRef.current?.click()}
                      disabled={uploading === "address"}
                      variant="outline"
                      className="w-full"
                    >
                      {uploading === "address" ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Address Proof
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Submit for review */}
          {status?.documentUrl && status?.selfieUrl && status.kycTier === 0 && (
            <Card className="rounded-2xl border-primary/30 bg-primary/5">
              <CardContent className="p-4 text-center space-y-2">
                <CheckCircle2 className="h-8 w-8 text-primary mx-auto" />
                <div className="text-sm font-semibold">Documents Submitted!</div>
                <div className="text-xs text-muted-foreground">
                  Our team will review your documents within 24 hours.
                  You&apos;ll receive a notification when verified.
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Already fully verified */}
      {currentTier >= 2 && (
        <Card className="rounded-2xl border-success/30 bg-success/5">
          <CardContent className="p-6 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
            <div className="text-lg font-semibold">Fully Verified</div>
            <div className="text-sm text-muted-foreground">
              You have full access to all KobKlein features with limits up to{" "}
              {tierInfo.limit}.
            </div>
            <Button variant="outline" onClick={() => router.push("/")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
