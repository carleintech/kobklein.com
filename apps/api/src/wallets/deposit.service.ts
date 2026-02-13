import { pool } from "../db/pool";
import { invalidateBalance } from "./balance.service";
import { emitEvent } from "../services/event-bus.service";
import { notifyDepositSuccess } from "../notifications/notification.service";

export async function postDeposit(params: {
  walletId: string;
  amount: number;
  currency: string;
  source: string;
  idempotencyKey: string;
  reference?: string;
}) {
  const { walletId, amount, currency, source, idempotencyKey, reference } = params;

  if (amount <= 0) throw new Error("Amount must be positive");

  const existingResult = await pool.query(`
    SELECT * FROM "Deposit" WHERE "idempotencyKey" = $1
  `, [idempotencyKey]);
  if (existingResult.rows.length > 0) return existingResult.rows[0];

  // Atomic transaction
  const client = await pool.connect();
  let deposit;
  try {
    await client.query('BEGIN');

    const createdResult = await client.query(`
      INSERT INTO "Deposit" ("id", "walletId", "amount", "currency", "source", "reference", "idempotencyKey", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, now(), now())
      RETURNING *
    `, [walletId, amount, currency, source, reference, idempotencyKey]);
    deposit = createdResult.rows[0];

    await client.query(`
      INSERT INTO "LedgerEntry" ("id", "walletId", "amount", "type", "createdAt")
      VALUES (gen_random_uuid(), $1, $2, $3, now())
    `, [walletId, amount, "deposit"]);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  await invalidateBalance(walletId);

  await emitEvent("deposit.posted", {
    depositId: deposit.id,
    walletId,
    amount,
    currency,
    source,
  });

  // SMS: notify user deposit received
  try {
    const walletResult = await pool.query(`SELECT "userId" FROM "Wallet" WHERE id = $1`, [walletId]);
    const userId = walletResult.rows[0]?.userId;
    if (userId) {
      const userResult = await pool.query(`SELECT phone FROM "User" WHERE id = $1`, [userId]);
      const phone = userResult.rows[0]?.phone;
      if (phone) {
        await notifyDepositSuccess(phone, amount);
      }
    }
  } catch (e) {
    console.error("SMS notification failed (deposit.posted):", e);
  }

  return deposit;
}
