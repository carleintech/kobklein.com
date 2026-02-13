/**
 * Seed initial FX rate: USD -> HTG = 135
 *
 * Run: npx tsx scripts/seed-fx-rate.ts
 */
import { prisma } from "../src/db/prisma";

async function main() {
  // Check if rate already exists
  const existing = await prisma.fxRate.findFirst({
    where: {
      fromCurrency: "USD",
      toCurrency: "HTG",
      active: true,
    },
  });

  if (existing) {
    console.log(
      `FX rate already exists: USD -> HTG = ${existing.rate} (id: ${existing.id})`,
    );
    return;
  }

  const rate = await prisma.fxRate.create({
    data: {
      fromCurrency: "USD",
      toCurrency: "HTG",
      rate: 135,
      active: true,
    },
  });

  console.log(`Seeded FX rate: USD -> HTG = 135 (id: ${rate.id})`);
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
