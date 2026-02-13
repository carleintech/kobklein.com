import { prisma } from "../db/prisma";

/**
 * Seed default role-based limit profiles.
 * Run once: npx ts-node src/scripts/seed-role-limits.ts
 *
 * These can be adjusted via admin endpoints later.
 */
async function seedRoleLimits() {
  const profiles = [
    // Regular users (HTG)
    { role: "user", currency: "HTG", dailyLimit: 50_000, monthlyLimit: 300_000 },
    // Diaspora users (USD)
    { role: "diaspora", currency: "USD", dailyLimit: 2_000, monthlyLimit: 10_000 },
    // Diaspora users (HTG — for local spend if any)
    { role: "diaspora", currency: "HTG", dailyLimit: 100_000, monthlyLimit: 500_000 },
    // Merchants (HTG)
    { role: "merchant", currency: "HTG", dailyLimit: 500_000, monthlyLimit: 2_000_000 },
    // Distributors (HTG)
    { role: "distributor", currency: "HTG", dailyLimit: 1_000_000, monthlyLimit: 5_000_000 },
    // Distributors (USD)
    { role: "distributor", currency: "USD", dailyLimit: 10_000, monthlyLimit: 50_000 },
  ];

  for (const p of profiles) {
    await prisma.roleLimitProfile.upsert({
      where: { role_currency: { role: p.role, currency: p.currency } },
      create: p,
      update: { dailyLimit: p.dailyLimit, monthlyLimit: p.monthlyLimit },
    });
    console.log(`[seed] ${p.role}/${p.currency}: daily=${p.dailyLimit}, monthly=${p.monthlyLimit}`);
  }

  console.log("[seed] Role limit profiles seeded.");
  process.exit(0);
}

seedRoleLimits().catch((err) => {
  console.error(err);
  process.exit(1);
});
