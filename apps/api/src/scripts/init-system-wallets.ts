/**
 * One-time script to create TREASURY wallets (HTG + USD).
 *
 * These wallets collect platform revenue:
 *   - Merchant payment fees  (type: "merchant_fee")
 *   - Cash-out fees          (type: "cash_out_fee")
 *   - FX spread              (future)
 *   - Card fees              (future)
 *
 * Existing code already queries for them:
 *   - cash-operations.controller.ts  → findFirst({ type: "TREASURY" })
 *   - pay-pos.controller.ts          → findFirst({ type: "TREASURY" })
 *   - float.controller.ts            → findFirst({ type: "TREASURY" })
 *
 * Run once: npx ts-node src/scripts/init-system-wallets.ts
 */

import { prisma } from "../db/prisma";

async function main() {
  const currencies = ["HTG", "USD"];

  for (const currency of currencies) {
    const existing = await prisma.wallet.findFirst({
      where: { type: "TREASURY", currency },
    });

    if (existing) {
      console.log(`TREASURY ${currency} wallet already exists: ${existing.id}`);
      continue;
    }

    const wallet = await prisma.wallet.create({
      data: {
        userId: "TREASURY",
        type: "TREASURY",
        currency,
      },
    });

    console.log(`Created TREASURY ${currency} wallet: ${wallet.id}`);
  }

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
  });
