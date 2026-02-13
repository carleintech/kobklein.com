import { prisma } from "../db/prisma";
import { createOtp, verifyOtp } from "../auth/otp.service";

/**
 * Create an OTP challenge for step-up verification.
 * Sends OTP via existing system, stores pending transaction payload.
 */
export async function createOtpChallenge(params: {
  userId: string;
  purpose: "transfer" | "merchant_payment" | "cashout";
  payload: Record<string, any>; // IDs + amounts only
}) {
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Get user phone for OTP delivery
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { phone: true },
  });

  if (!user?.phone) {
    throw new Error("User phone not found");
  }

  // Generate OTP via existing system
  const otpCode = await createOtp(params.userId, params.purpose, user.phone);

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
