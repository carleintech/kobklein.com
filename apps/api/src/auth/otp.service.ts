import { randomInt } from "crypto";
import { prisma } from "../db/prisma";
import { createNotification } from "../notifications/notification.service";
import { hashOtp, verifyOtpHash } from "./otp.util";

function generateCode() {
  return randomInt(100000, 999999).toString();
}

export async function createOtp(userId: string, purpose: string, phone: string) {
  const code = generateCode();

  const expires = new Date(Date.now() + 5 * 60 * 1000);

  // Store hashed OTP — never persist plaintext codes
  await prisma.otpCode.create({
    data: {
      userId,
      phone,
      code: hashOtp(code),
      purpose,
      expiresAt: expires,
    },
  });

  // Return plaintext code to caller for SMS/email delivery only
  return code;
}

export async function verifyOtp(params: {
  userId: string;
  code: string;
  purpose: string;
}) {
  const record = await prisma.otpCode.findFirst({
    where: {
      userId: params.userId,
      purpose: params.purpose,
      usedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) throw new Error("OTP not found");

  if (record.expiresAt < new Date())
    throw new Error("OTP expired");

  if (record.attempts >= record.maxAttempts) {
    // Freeze account due to too many OTP failures
    await prisma.user.update({
      where: { id: params.userId },
      data: {
        isFrozen: true,
        freezeReason: "Too many OTP failures",
        frozenAt: new Date(),
      },
    });

    await createNotification(
      params.userId,
      "Account Frozen",
      "We detected unusual activity and temporarily froze your account for safety."
    );

    throw new Error("Too many attempts");
  }

  // Verify against hash using constant-time comparison
  if (!verifyOtpHash(params.code, record.code)) {
    await prisma.otpCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    throw new Error("Invalid OTP");
  }

  await prisma.otpCode.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return true;
}
