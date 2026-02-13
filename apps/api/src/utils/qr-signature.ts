import { createHmac } from "crypto";

/**
 * HMAC-SHA256 signing / verification for POS QR codes.
 *
 * The signature covers requestId + merchantId + amount + currency
 * so that a scanned QR can be verified server-side before payment.
 */

const QR_SECRET = process.env.QR_HMAC_SECRET || "kob-pos-default-secret";

/**
 * Build the canonical payload string for signing.
 */
function canonical(parts: {
  requestId: string;
  merchantId: string;
  amount: string | number;
  currency: string;
}): string {
  return `${parts.requestId}|${parts.merchantId}|${parts.amount}|${parts.currency}`;
}

/**
 * Sign a POS request and return the hex HMAC.
 */
export function signPosRequest(parts: {
  requestId: string;
  merchantId: string;
  amount: string | number;
  currency: string;
}): string {
  return createHmac("sha256", QR_SECRET)
    .update(canonical(parts))
    .digest("hex");
}

/**
 * Verify that a POS request signature is valid.
 */
export function verifyPosSignature(
  parts: {
    requestId: string;
    merchantId: string;
    amount: string | number;
    currency: string;
  },
  signature: string,
): boolean {
  const expected = signPosRequest(parts);
  // Constant-time comparison to prevent timing attacks
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}
