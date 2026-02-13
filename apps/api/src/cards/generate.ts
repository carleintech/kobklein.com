import { randomInt } from "crypto";

/**
 * KobKlein Virtual Card BIN.
 * 4 = Visa-style prefix; "936" is a placeholder issuer code.
 * In production this will be assigned by your card processor.
 */
const BIN_PREFIX = "4936";

/**
 * Generate a Luhn-valid 16-digit card number.
 *
 * Layout:  [4-digit BIN] + [11-digit random] + [1-digit Luhn check]
 */
export function generateCardNumber(): string {
  // 15 digits before the check digit
  const partialDigits = BIN_PREFIX + randomDigits(11);

  const checkDigit = luhnCheckDigit(partialDigits);
  return partialDigits + checkDigit;
}

/**
 * Generate a random 3-digit CVV.
 */
export function generateCvv(): string {
  return randomInt(100, 999).toString();
}

/**
 * Return the last 4 digits of a card number.
 */
export function last4(cardNumber: string): string {
  return cardNumber.slice(-4);
}

// ─── Helpers ────────────────────────────────────────────────────────

function randomDigits(count: number): string {
  let out = "";
  for (let i = 0; i < count; i++) {
    out += randomInt(0, 9).toString();
  }
  return out;
}

/**
 * Compute the Luhn check digit for a partial card number.
 */
function luhnCheckDigit(partial: string): string {
  let sum = 0;
  // Walk right-to-left; the check digit position is even-parity
  for (let i = partial.length - 1; i >= 0; i--) {
    let digit = Number(partial[i]);

    // Double every other digit (starting from rightmost of partial)
    if ((partial.length - i) % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
  }

  return ((10 - (sum % 10)) % 10).toString();
}
