/**
 * One-time script to backfill K-IDs for existing users.
 *
 * Run: npx ts-node src/scripts/backfill-kid.ts
 *   or: npx tsx src/scripts/backfill-kid.ts
 */

import { prisma } from "../db/prisma";
import { generateKId } from "../utils/kid";

async function main() {
  const users = await prisma.user.findMany({
    where: { kId: null },
    select: { id: true },
  });

  console.log(`Found ${users.length} users without K-ID`);

  let assigned = 0;
  for (const u of users) {
    const kId = await generateKId();
    await prisma.user.update({
      where: { id: u.id },
      data: { kId },
    });
    assigned++;
    console.log(`  [${assigned}/${users.length}] ${u.id} → ${kId}`);
  }

  console.log(`\nBackfill complete: ${assigned} users updated.`);
}

main()
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  });
