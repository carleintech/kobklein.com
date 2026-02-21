/**
 * seed-treasury.ts
 *
 * One-time setup script to initialize the KobKlein platform finance layer:
 *   1. Creates a SYSTEM user (platform account) if not present
 *   2. Creates the TREASURY wallet where all platform fees are deposited
 *   3. Seeds FeeConfig records for each fee type
 *   4. Creates a KOBKLEIN_PLATFORM user for internal accounting
 *
 * Run once after deploying to a fresh database:
 *   npx ts-node -r tsconfig-paths/register src/scripts/seed-treasury.ts
 */

import { prisma } from "../db/prisma";

const PLATFORM_EMAIL = "treasury@kobklein.com";
const PLATFORM_HANDLE = "kobklein_treasury";

async function main() {
  console.log("🏦  Seeding KobKlein Treasury & Fee Configuration...\n");

  // ── 1. Create or find the platform system user ────────────────────────────
  let systemUser = await prisma.user.findFirst({
    where: { email: PLATFORM_EMAIL },
  });

  if (!systemUser) {
    systemUser = await prisma.user.create({
      data: {
        email: PLATFORM_EMAIL,
        handle: PLATFORM_HANDLE,
        role: "admin",
        firstName: "KobKlein",
        lastName: "Treasury",
        kId: "KK-PLATFORM",
        country: "HT",
        onboardingComplete: true,
        profileComplete: true,
        kycTier: 3,
        kycStatus: "verified",
      },
    });
    console.log(`✅  Created platform system user: ${systemUser.id}`);
  } else {
    console.log(`✓   Platform user already exists: ${systemUser.id}`);
  }

  // ── 2. Create TREASURY wallets (one per currency) ─────────────────────────
  const currencies = ["HTG", "USD"];
  for (const currency of currencies) {
    const existing = await prisma.wallet.findFirst({
      where: { userId: systemUser.id, currency, type: "TREASURY" },
    });

    if (!existing) {
      await prisma.wallet.create({
        data: {
          userId: systemUser.id,
          currency,
          type: "TREASURY",
        },
      });
      console.log(`✅  Created TREASURY wallet: ${currency}`);
    } else {
      console.log(`✓   TREASURY wallet already exists: ${currency}`);
    }
  }

  // ── 3. Seed FeeConfig records ─────────────────────────────────────────────
  /**
   * Fee types:
   *   diaspora_remittance   — flat $2 per international transfer
   *   merchant_transaction  — 0.75% of transaction amount (future)
   *   cash_out              — 1% of cash-out amount
   *   card_personalization  — flat $3 fee for named card upgrade
   *   distributor_kit       — flat $75 kit fee (handled separately)
   *   fx_spread             — 1.5% FX spread on currency conversion
   */
  const feeConfigs: {
    type: string;
    percent: number;
    flat: number;
    currency: string;
  }[] = [
    { type: "diaspora_remittance",  percent: 0,      flat: 2,    currency: "USD" },
    { type: "merchant_transaction", percent: 0.0075, flat: 0,    currency: "HTG" },
    { type: "cash_out",             percent: 0.01,   flat: 0,    currency: "HTG" },
    { type: "card_personalization", percent: 0,      flat: 3,    currency: "USD" },
    { type: "fx_spread",            percent: 0.015,  flat: 0,    currency: "USD" },
    { type: "internal_transfer",    percent: 0,      flat: 0,    currency: "HTG" },
  ];

  for (const cfg of feeConfigs) {
    const existing = await prisma.feeConfig.findUnique({
      where: { type_currency: { type: cfg.type, currency: cfg.currency } },
    });

    if (!existing) {
      await prisma.feeConfig.create({
        data: {
          type: cfg.type,
          percent: cfg.percent,
          flat: cfg.flat,
          currency: cfg.currency,
          active: true,
        },
      });
      console.log(
        `✅  Created FeeConfig: ${cfg.type} (${cfg.currency}) — ${cfg.flat ? `$${cfg.flat} flat` : `${(cfg.percent * 100).toFixed(2)}%`}`
      );
    } else {
      console.log(`✓   FeeConfig already exists: ${cfg.type} (${cfg.currency})`);
    }
  }

  // ── 4. Create a welcome promotional code for launch ───────────────────────
  const launchPromo = await prisma.fxPromotion.findUnique({
    where: { code: "KOBKLEIN2025" },
  });

  if (!launchPromo) {
    await prisma.fxPromotion.create({
      data: {
        name: "KobKlein Launch — Free Transfer",
        fromCurrency: "USD",
        toCurrency: "HTG",
        discountBps: 200,           // 2% discount on FX spread
        bonusPct: 0.05,             // +5% bonus HTG
        minAmount: 10,
        maxAmount: 500,
        code: "KOBKLEIN2025",
        maxUses: 1000,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        active: true,
        // affiliateLabel / affiliateUserId fields added via migration 20260220000001
        // Run `prisma generate` to pick them up in the Prisma client types
      } as Parameters<typeof prisma.fxPromotion.create>[0]["data"],
    });
    console.log("✅  Created launch promo code: KOBKLEIN2025");
  } else {
    console.log("✓   Launch promo code already exists: KOBKLEIN2025");
  }

  console.log("\n🎉  Treasury seed complete!");
  console.log(`\n📋  Summary:`);
  console.log(`     Platform user ID : ${systemUser.id}`);
  console.log(`     Currencies       : ${currencies.join(", ")}`);
  console.log(`     Fee configs      : ${feeConfigs.length} records`);
  console.log(`     Launch promo     : KOBKLEIN2025\n`);
}

main()
  .catch((e) => {
    console.error("❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
