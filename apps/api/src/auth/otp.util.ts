import { createHash, timingSafeEqual } from "crypto";

/**
 * Hash an OTP code using SHA-256.
 *
 * SHA-256 is appropriate for short-lived OTP codes (5 min expiry).
 * bcrypt would be too slow here — we need sub-ms hashing for 6-digit codes.
 */
export function hashOtp(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

/**
 * Verify an OTP code against its hash using constant-time comparison.
 * Prevents timing attacks on OTP verification.
 */
export function verifyOtpHash(code: string, storedHash: string): boolean {
  const inputHash = hashOtp(code);

  // Constant-time comparison to prevent timing attacks
  const a = Buffer.from(inputHash, "hex");
  const b = Buffer.from(storedHash, "hex");

  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}
