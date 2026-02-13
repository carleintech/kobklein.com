import { prisma } from "../db/prisma";

/**
 * K-ID — KobKlein Platform Identity
 *
 * Format: KP-XXXXXX (9 chars total)
 * Charset: A-Z, 2-9 (excludes 0/O, 1/I to avoid confusion)
 * Collision-safe: checks DB uniqueness before returning
 *
 * Examples: KP-7X4D9Q, KP-A3BF8K, KP-YNEW5J
 */

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 32 chars — no 0, O, I, 1

function randomString(length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
}

/**
 * Generate a unique K-ID.
 * Retries on collision (32^6 ≈ 1 billion combinations — collisions near-impossible).
 */
export async function generateKId(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = `KP-${randomString(6)}`;

    const exists = await prisma.user.findUnique({
      where: { kId: candidate },
    });

    if (!exists) return candidate;
  }

  // Should never happen — 32^6 = 1,073,741,824 combinations
  throw new Error("Failed to generate unique K-ID after 10 attempts");
}
