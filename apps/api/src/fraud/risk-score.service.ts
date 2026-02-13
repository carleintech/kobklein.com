/**
 * Risk Score Engine — Balanced Model
 *
 * Philosophy:
 *   Low  (0–29):  Allow normally
 *   Medium (30–59): Allow + increase monitoring, log signal, maybe step-up OTP
 *   High (60–100): Temporarily block + auto-create case
 *
 * Inputs can come from:
 *   - Transfer velocity counters (Redis)
 *   - Reversal history
 *   - KYC tier
 *   - Device fingerprint (future)
 *   - Geo anomaly (future)
 */

export type RiskLevel = "low" | "medium" | "high";

export interface RiskInput {
  /** Number of transfers in the last minute */
  velocityPerMinute: number;
  /** Number of transfers in the last hour */
  velocityPerHour: number;
  /** Total reversals for the user in last 24h */
  reversals24h: number;
  /** User KYC tier: 0=none, 1=basic, 2=full */
  kycTier: number;
  /** Whether the account was previously flagged (unresolved) */
  hasUnresolvedFlag: boolean;
  /** Amount of current transaction (HTG) */
  amount?: number;
  /** User's daily limit (HTG) */
  dailyLimit?: number;
}

export interface RiskResult {
  score: number;
  level: RiskLevel;
  signals: string[];
  action: "allow" | "step_up" | "block";
}

export function computeRiskScore(input: RiskInput): RiskResult {
  let score = 0;
  const signals: string[] = [];

  // ── Velocity ──
  // 3+ transfers/min is suspicious
  if (input.velocityPerMinute >= 5) {
    score += 35;
    signals.push("VELOCITY_BURST");
  } else if (input.velocityPerMinute >= 3) {
    score += 15;
    signals.push("VELOCITY_ELEVATED");
  }

  // Hourly velocity
  if (input.velocityPerHour >= 30) {
    score += 20;
    signals.push("VELOCITY_HOURLY_HIGH");
  } else if (input.velocityPerHour >= 15) {
    score += 10;
    signals.push("VELOCITY_HOURLY_MODERATE");
  }

  // ── Reversals ──
  if (input.reversals24h >= 3) {
    score += 25;
    signals.push("REVERSAL_PATTERN");
  } else if (input.reversals24h >= 1) {
    score += 10;
    signals.push("REVERSAL_RECENT");
  }

  // ── KYC ──
  if (input.kycTier === 0) {
    score += 20;
    signals.push("NO_KYC");
  } else if (input.kycTier === 1) {
    score += 5;
    signals.push("BASIC_KYC");
  }
  // kycTier >= 2 adds nothing

  // ── Previous flags ──
  if (input.hasUnresolvedFlag) {
    score += 15;
    signals.push("PRIOR_FLAG");
  }

  // ── Large amount relative to limit ──
  if (input.amount && input.dailyLimit && input.amount > input.dailyLimit * 0.8) {
    score += 10;
    signals.push("NEAR_DAILY_LIMIT");
  }

  // Clamp score
  score = Math.min(score, 100);

  // Determine level and action
  let level: RiskLevel;
  let action: RiskResult["action"];

  if (score < 30) {
    level = "low";
    action = "allow";
  } else if (score < 60) {
    level = "medium";
    action = "step_up";
  } else {
    level = "high";
    action = "block";
  }

  return { score, level, signals, action };
}
