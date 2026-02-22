import { prisma } from "../db/prisma";
import { createOtp, verifyOtp } from "../auth/otp.service";
import { createNotification, enqueueSMS } from "../notifications/notification.service";
import { sendEmail } from "../notifications/email.service";

/**
 * Create an OTP challenge for step-up verification.
 * Delivers OTP via email (primary) + in-app notification + SMS (best-effort).
 */
export async function createOtpChallenge(params: {
  userId: string;
  purpose: "transfer" | "merchant_payment" | "cashout";
  payload: Record<string, any>; // IDs + amounts only
}) {
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { phone: true, email: true },
  });

  if (!user?.phone) {
    throw new Error("User phone not found");
  }

  const otpCode = await createOtp(params.userId, params.purpose, user.phone);

  // Primary: email delivery
  if (user.email) {
    sendEmail(
      user.email,
      "KobKlein — Security Verification Code",
      `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;background:#080B14;color:#F2F2F2;border-radius:12px;padding:32px;">
        <h2 style="color:#C6A756;margin:0 0 8px;">Security Verification</h2>
        <p style="color:#C4C7CF;margin:0 0 24px;">Use the code below to confirm your transaction. It expires in 5 minutes.</p>
        <div style="background:#151B2E;border-radius:8px;padding:24px;text-align:center;font-size:36px;font-weight:700;letter-spacing:0.4em;color:#E1C97A;">
          ${otpCode}
        </div>
        <p style="color:#7A8394;font-size:12px;margin:24px 0 0;">Never share this code. KobKlein will never ask for it.</p>
      </div>
      `,
    ).catch((err) => {
      console.warn("[OTP] Email delivery failed (non-fatal):", err);
    });
  }

  // Secondary: in-app notification
  createNotification(
    params.userId,
    "Security Verification Code",
    `Your KobKlein verification code is: ${otpCode}. Valid for 5 minutes. Never share this code.`,
    "security",
  ).catch((err) => {
    console.warn("[OTP] In-app notification failed (non-fatal):", err);
  });

  // Tertiary: SMS
  enqueueSMS(
    user.phone,
    `KobKlein: Kòd verifikasyon ou se ${otpCode}. Válido 5 minit. Pa pataje kòd sa a.`,
  ).catch((err) => {
    console.warn("[OTP] SMS delivery failed (non-fatal):", err);
  });

  // Store challenge with payload
  const challenge = await prisma.otpChallenge.create({
    data: {
      userId: params.userId,
      reason: "risk_score",
      otpCode,
      purpose: params.purpose,
      payload: params.payload,
      expiresAt,
    },
  });

  return challenge.id;
}

/**
 * Verify OTP and consume the challenge, returning the stored payload.
 */
export async function consumeOtpChallenge(params: {
  userId: string;
  challengeId: string;
  otpCode: string;
}) {
  const challenge = await prisma.otpChallenge.findUnique({
    where: { id: params.challengeId },
  });

  if (!challenge || challenge.userId !== params.userId) {
    throw new Error("Invalid challenge");
  }

  if (challenge.status !== "pending") {
    throw new Error("Challenge already used");
  }

  if (new Date(challenge.expiresAt).getTime() < Date.now()) {
    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { status: "expired" },
    });
    throw new Error("Challenge expired");
  }

  // Verify OTP via existing system
  await verifyOtp({
    userId: params.userId,
    code: params.otpCode,
    purpose: challenge.purpose,
  });

  // Mark challenge as used
  await prisma.otpChallenge.update({
    where: { id: challenge.id },
    data: { status: "used" },
  });

  return challenge.payload as Record<string, any>;
}
