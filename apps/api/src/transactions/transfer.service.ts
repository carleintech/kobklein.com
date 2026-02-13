import { pool } from "../db/pool";
import { invalidateBalance } from "../wallets/balance.service";
import { checkTransferLimits } from "../limits/limit.service";
import { emitEvent } from "../services/event-bus.service";
import { notifyTransferSent, notifyTransferReceived } from "../notifications/notification.service";

export async function postTransfer(params: {
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  currency: string;
  idempotencyKey: string;
}) {
  const { fromWalletId, toWalletId, amount, currency, idempotencyKey } = params;

  if (amount <= 0) throw new Error("Amount must be positive");
  if (fromWalletId === toWalletId) throw new Error("Cannot transfer to same wallet");

  // Idempotency check
  const existingResult = await pool.query(`
    SELECT * FROM "Transfer" WHERE "idempotencyKey" = $1
  `, [idempotencyKey]);
  if (existingResult.rows.length > 0) return existingResult.rows[0];

  // Find wallet owner
  const walletResult = await pool.query(`
    SELECT * FROM "Wallet" WHERE id = $1
  `, [fromWalletId]);
  const wallet = walletResult.rows[0];
  if (!wallet) throw new Error("Wallet not found");

  // Check transfer limits based on user's KYC tier
  await checkTransferLimits({
    userId: wallet.userId,
    amount,
  });

  // Atomic transaction
  const client = await pool.connect();
  let transfer;
  try {
    await client.query('BEGIN');

    // Ensure enough funds by computing ledger sum (truth)
    const sumResult = await client.query(`
      SELECT COALESCE(SUM(amount), 0) as total FROM "LedgerEntry" WHERE "walletId" = $1
    `, [fromWalletId]);
    const balance = parseFloat(sumResult.rows[0].total);
    if (balance < amount) throw new Error("Insufficient funds");

    const createdResult = await client.query(`
      INSERT INTO "Transfer" ("id", "fromWalletId", "toWalletId", "amount", "currency", "idempotencyKey", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, now(), now())
      RETURNING *
    `, [fromWalletId, toWalletId, amount, currency, idempotencyKey]);
    transfer = createdResult.rows[0];

    // Double-entry ledger: debit + credit
    await client.query(`
      INSERT INTO "LedgerEntry" ("id", "walletId", "amount", "type", "transferId", "createdAt")
      VALUES
        (gen_random_uuid(), $1, $2, $3, $4, now()),
        (gen_random_uuid(), $5, $6, $7, $8, now())
    `, [fromWalletId, -amount, "transfer_debit", transfer.id, toWalletId, amount, "transfer_credit", transfer.id]);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  // Invalidate cache
  await invalidateBalance(fromWalletId);
  await invalidateBalance(toWalletId);

  await emitEvent("transfer.posted", {
    transferId: transfer.id,
    fromWalletId,
    toWalletId,
    amount,
    currency,
  });

  // SMS: notify sender and recipient
  try {
    const [fromW, toW] = await Promise.all([
      pool.query(`SELECT w."userId", u.phone, u."firstName" FROM "Wallet" w JOIN "User" u ON u.id = w."userId" WHERE w.id = $1`, [fromWalletId]),
      pool.query(`SELECT w."userId", u.phone, u."firstName" FROM "Wallet" w JOIN "User" u ON u.id = w."userId" WHERE w.id = $1`, [toWalletId]),
    ]);

    const senderPhone = fromW.rows[0]?.phone;
    const recipientPhone = toW.rows[0]?.phone;
    const senderName = fromW.rows[0]?.firstName;
    const recipientName = toW.rows[0]?.firstName;

    if (senderPhone) await notifyTransferSent(senderPhone, amount, recipientName);
    if (recipientPhone) await notifyTransferReceived(recipientPhone, amount, senderName);
  } catch (e) {
    console.error("SMS notification failed (transfer.posted):", e);
  }

  return transfer;
}
