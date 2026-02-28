import { prisma } from "../db/prisma";

// ─── Corridor definitions ────────────────────────────────────────────────────
// A corridor maps (fromRole, toRole) → corridor code + fee currency
// Fee currency is always the SENDER's currency (they pay the fee)

export interface CorridorInfo {
  code: string;      // FeeConfig.type key
  label: string;
  fromCurrency: string;
  toCurrency: string;
  feeCurrency: string;
}

/**
 * Returns the expected currency for a given user role.
 * Diaspora users operate in USD; all Haiti-side roles use HTG.
 */
export function getRoleCurrency(role: string): string {
  const usdRoles = ["DIASPORA"];
  return usdRoles.includes(role?.toUpperCase()) ? "USD" : "HTG";
}

export function getCorridor(
  fromRole: string,
  toRole: string,
  fromCurrency: string,
  toCurrency: string,
): CorridorInfo {
  const fr = fromRole.toUpperCase();
  const tr = toRole.toUpperCase();
  const fc = fromCurrency.toUpperCase();
  const tc = toCurrency.toUpperCase();

  // Build corridor code: FROMROLE_TOROLE
  const code = `${fr}_${tr}`;

  const LABELS: Record<string, string> = {
    CLIENT_CLIENT:          "Client → Client",
    CLIENT_MERCHANT:        "Client → Merchant",
    CLIENT_DIASPORA:        "Client → Diaspora",
    DIASPORA_CLIENT:        "Diaspora → Client",
    DIASPORA_MERCHANT:      "Diaspora → Merchant",
    DIASPORA_DISTRIBUTOR:   "Diaspora → Distributor",
    DISTRIBUTOR_DIASPORA:   "Distributor → Diaspora",
    MERCHANT_CLIENT:        "Merchant → Client",
    MERCHANT_MERCHANT:      "Merchant → Merchant",
    MERCHANT_DISTRIBUTOR:   "Merchant → Distributor",
    MERCHANT_DIASPORA:      "Merchant → Diaspora",
    CLIENT_DISTRIBUTOR:     "Client → Distributor",
    DISTRIBUTOR_CLIENT:     "Distributor → Client",
    DISTRIBUTOR_MERCHANT:   "Distributor → Merchant",
    DISTRIBUTOR_DISTRIBUTOR:"Distributor → Distributor",
  };

  const currencyPair = fc === tc ? `${fc}→${tc}` : `${fc}→${tc}`;
  const label = `${LABELS[code] ?? code} (${currencyPair})`;

  return {
    code,
    label,
    fromCurrency: fc,
    toCurrency: tc,
    feeCurrency: fc, // always charged in sender's currency
  };
}

// ─── Seed default corridors ──────────────────────────────────────────────────

export const DEFAULT_CORRIDORS: Array<{
  type: string;
  label: string;
  currency: string; // fee currency (sender's)
}> = [
  { type: "CLIENT_CLIENT",          label: "Client → Client (HTG→HTG)",              currency: "HTG" },
  { type: "CLIENT_MERCHANT",        label: "Client → Merchant (HTG→HTG)",             currency: "HTG" },
  { type: "CLIENT_DIASPORA",        label: "Client → Diaspora (HTG→USD)",             currency: "HTG" },
  { type: "CLIENT_DISTRIBUTOR",     label: "Client → Distributor (HTG→HTG)",          currency: "HTG" },
  { type: "DIASPORA_CLIENT",        label: "Diaspora → Client (USD→HTG)",             currency: "USD" },
  { type: "DIASPORA_MERCHANT",      label: "Diaspora → Merchant (USD→HTG)",           currency: "USD" },
  { type: "DIASPORA_DISTRIBUTOR",   label: "Diaspora → Distributor (USD→HTG)",        currency: "USD" },
  { type: "DISTRIBUTOR_DIASPORA",   label: "Distributor → Diaspora (HTG→USD)",        currency: "HTG" },
  { type: "DISTRIBUTOR_CLIENT",     label: "Distributor → Client (HTG→HTG)",          currency: "HTG" },
  { type: "DISTRIBUTOR_MERCHANT",   label: "Distributor → Merchant (HTG→HTG)",        currency: "HTG" },
  { type: "DISTRIBUTOR_DISTRIBUTOR",label: "Distributor → Distributor (HTG→HTG)",     currency: "HTG" },
  { type: "MERCHANT_CLIENT",        label: "Merchant → Client (HTG→HTG)",             currency: "HTG" },
  { type: "MERCHANT_MERCHANT",      label: "Merchant → Merchant (HTG→HTG)",           currency: "HTG" },
  { type: "MERCHANT_DISTRIBUTOR",   label: "Merchant → Distributor (HTG→HTG)",        currency: "HTG" },
  { type: "MERCHANT_DIASPORA",      label: "Merchant → Diaspora (HTG→USD)",           currency: "HTG" },
];

/**
 * Ensure all default corridor fee configs exist in the database (flat=0 by default).
 * Safe to call multiple times (upsert).
 */
export async function seedFeeConfigs(): Promise<void> {
  for (const corridor of DEFAULT_CORRIDORS) {
    await prisma.feeConfig.upsert({
      where: { type_currency: { type: corridor.type, currency: corridor.currency } },
      update: { label: corridor.label }, // update label if changed
      create: {
        type: corridor.type,
        label: corridor.label,
        currency: corridor.currency,
        flat: 0,
        percent: 0,
        active: true,
      },
    });
  }
}

// ─── Fee lookup ──────────────────────────────────────────────────────────────

export interface FeeResult {
  feeAmount: number;        // flat fee in feeCurrency
  feeCurrency: string;
  corridorCode: string;
  corridorLabel: string;
  isActive: boolean;
}

/**
 * Look up the fee for a transfer corridor.
 * Returns feeAmount=0 if no config found or config is inactive.
 */
export async function getTransferFee(params: {
  fromRole: string;
  toRole: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number; // for percent calculation
}): Promise<FeeResult> {
  const corridor = getCorridor(
    params.fromRole,
    params.toRole,
    params.fromCurrency,
    params.toCurrency,
  );

  const config = await prisma.feeConfig.findUnique({
    where: {
      type_currency: {
        type: corridor.code,
        currency: corridor.feeCurrency,
      },
    },
  });

  if (!config || !config.active) {
    return {
      feeAmount: 0,
      feeCurrency: corridor.feeCurrency,
      corridorCode: corridor.code,
      corridorLabel: corridor.label,
      isActive: false,
    };
  }

  const flat = Number(config.flat);
  const pct  = Number(config.percent);
  const feeAmount = flat + (pct > 0 ? (params.amount * pct) / 100 : 0);

  return {
    feeAmount: Math.round(feeAmount * 100) / 100,
    feeCurrency: corridor.feeCurrency,
    corridorCode: corridor.code,
    corridorLabel: corridor.label,
    isActive: config.active,
  };
}
