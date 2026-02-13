import crypto from "crypto";

// ─── Encryption Key ────────────────────────────────────────────────

const KEY_B64 = process.env.CARD_ENCRYPTION_KEY_BASE64 || "";
const KEY = KEY_B64 ? Buffer.from(KEY_B64, "base64") : null;

function getKey(): Buffer {
  if (!KEY || KEY.length !== 32) {
    throw new Error(
      "CARD_ENCRYPTION_KEY_BASE64 must be set to a 32-byte base64 value",
    );
  }
  return KEY;
}

// ─── SHA-256 Fingerprint ───────────────────────────────────────────

export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

// ─── AES-256-GCM Card Number Encryption ────────────────────────────

export function encryptCardNumber(plain: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Pack: iv (12) + tag (16) + ciphertext
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptCardNumber(packed: string): string {
  const key = getKey();
  const buf = Buffer.from(packed, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(enc), decipher.final()]);
  return plain.toString("utf8");
}

// ─── CVV Hashing (native scrypt — no bcryptjs needed) ──────────────

const CVV_SALT_LEN = 16;
const CVV_KEY_LEN = 32;

/**
 * Hash a CVV using scrypt (synchronous, fast for 3-digit input).
 * Returns: base64(salt + derivedKey)
 */
export function hashCvv(cvv: string): string {
  const salt = crypto.randomBytes(CVV_SALT_LEN);
  const derived = crypto.scryptSync(cvv, salt, CVV_KEY_LEN);
  return Buffer.concat([salt, derived]).toString("base64");
}

/**
 * Verify a CVV against a stored hash.
 */
export function verifyCvv(cvv: string, storedHash: string): boolean {
  const buf = Buffer.from(storedHash, "base64");
  const salt = buf.subarray(0, CVV_SALT_LEN);
  const storedKey = buf.subarray(CVV_SALT_LEN);
  const derived = crypto.scryptSync(cvv, salt, CVV_KEY_LEN);
  return crypto.timingSafeEqual(storedKey, derived);
}
