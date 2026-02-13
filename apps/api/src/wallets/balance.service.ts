import { prisma } from "../db/prisma";
import { redis } from "../services/redis.client";
import { pool } from "../db/pool";

// ─── Prisma-based balance (with hold tracking) ─────────────────────

export async function computeWalletBalance(walletId: string) {
  const entries = await prisma.ledgerEntry.findMany({
    where: { walletId },
    select: { amount: true, type: true },
  });

  let total = 0;
  let held = 0;

  for (const e of entries) {
    total += Number(e.amount);

    if (e.type === "hold_debit") held += Math.abs(Number(e.amount));
    if (e.type === "hold_release") held -= Math.abs(Number(e.amount));
    if (e.type === "hold_seize") held -= Math.abs(Number(e.amount));
  }

  // Clamp held to 0 in case of over-release
  if (held < 0) held = 0;

  const available = total - held;

  return {
    totalBalance: total,
    heldBalance: held,
    availableBalance: available,
    // Keep legacy field for backward compatibility
    ledgerBalance: total,
    pendingAmount: held,
  };
}

// ─── Redis-cached balance (fast path, used by legacy SQL services) ──

function balanceKey(walletId: string) {
  return `wallet:${walletId}:balance`;
}

export async function getBalance(walletId: string): Promise<number> {
  // 1) Try Redis
  const cached = await redis.get(balanceKey(walletId));
  if (cached !== null) return Number(cached);

  // 2) Compute from ledger (truth)
  const result = await pool.query(`
    SELECT COALESCE(SUM(amount), 0) as balance
    FROM "LedgerEntry"
    WHERE "walletId" = $1
  `, [walletId]);

  const balance = parseFloat(result.rows[0].balance);

  // 3) Cache it
  await redis.set(balanceKey(walletId), String(balance), { EX: 30 }); // 30s TTL
  return balance;
}

export async function invalidateBalance(walletId: string) {
  await redis.del(balanceKey(walletId));
}
