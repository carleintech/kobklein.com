import { pool } from "../db/pool";
import { invalidateBalance } from "../wallets/balance.service";
// Removed: auditLog import (moved to controller)
import { emitEvent } from "../services/event-bus.service";

// ─── REVERSE TRANSFER ────────────────────────────────────────────────
export async function reverseTransfer(params: {
  transferId: string;
  reason: string;
  idempotencyKey: string;
  adminUserId: string;
  requestId?: string;
}) {
  const { transferId, reason, idempotencyKey, adminUserId, requestId } = params;

  // Idempotency guard
  const existingResult = await pool.query(
    `SELECT * FROM "Reversal" WHERE "idempotencyKey" = $1`,
    [idempotencyKey],
  );
  if (existingResult.rows.length > 0) return existingResult.rows[0];

  // Load the transfer
  const transferResult = await pool.query(
    `SELECT * FROM "Transfer" WHERE id = $1`,
    [transferId],
  );
  const transfer = transferResult.rows[0];
  if (!transfer) throw new Error("Transfer not found");
  if (transfer.status === "reversed") throw new Error("Transfer already reversed");

  const amount = parseFloat(transfer.amount);
  const client = await pool.connect();
  let reversal;

  try {
    await client.query("BEGIN");

    // Mark transfer reversed
    await client.query(
      `UPDATE "Transfer" SET status = 'reversed' WHERE id = $1`,
      [transferId],
    );

    // Create Reversal record
    const revResult = await client.query(
      `INSERT INTO "Reversal" ("id", "targetType", "targetId", "reason", "idempotencyKey", "createdAt")
       VALUES (gen_random_uuid(), 'transfer', $1, $2, $3, now())
       RETURNING *`,
      [transferId, reason, idempotencyKey],
    );
    reversal = revResult.rows[0];

    // Compensating ledger entries:
    //   original: fromWallet -amount, toWallet +amount
    //   reversal: fromWallet +amount, toWallet -amount
    await client.query(
      `INSERT INTO "LedgerEntry" ("id", "walletId", "amount", "type", "transferId", "createdAt")
       VALUES
         (gen_random_uuid(), $1, $2, 'transfer_reversal_credit', $3, now()),
         (gen_random_uuid(), $4, $5, 'transfer_reversal_debit', $6, now())`,
      [
        transfer.fromWalletId, amount, transferId,
        transfer.toWalletId, -amount, transferId,
      ],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  // Invalidate cached balances
  await invalidateBalance(transfer.fromWalletId);
  await invalidateBalance(transfer.toWalletId);

  // Removed: audit logging (moved to controller for financial actions)

  // Domain event
  await emitEvent("transfer.reversed", {
    transferId,
    reversalId: reversal.id,
    reason,
    adminUserId,
    requestId,
  });

  return reversal;
}

// ─── REVERSE DEPOSIT (chargeback / mistaken credit) ──────────────────
export async function reverseDeposit(params: {
  depositId: string;
  reason: string;
  idempotencyKey: string;
  adminUserId: string;
  requestId?: string;
}) {
  const { depositId, reason, idempotencyKey, adminUserId, requestId } = params;

  // Idempotency guard
  const existingResult = await pool.query(
    `SELECT * FROM "Reversal" WHERE "idempotencyKey" = $1`,
    [idempotencyKey],
  );
  if (existingResult.rows.length > 0) return existingResult.rows[0];

  // Load the deposit
  const depositResult = await pool.query(
    `SELECT * FROM "Deposit" WHERE id = $1`,
    [depositId],
  );
  const deposit = depositResult.rows[0];
  if (!deposit) throw new Error("Deposit not found");

  // Check if already reversed
  const alreadyReversedResult = await pool.query(
    `SELECT 1 FROM "Reversal" WHERE "targetType" = 'deposit' AND "targetId" = $1`,
    [depositId],
  );
  if (alreadyReversedResult.rows.length > 0) throw new Error("Deposit already reversed");

  const amount = parseFloat(deposit.amount);
  const client = await pool.connect();
  let reversal;

  try {
    await client.query("BEGIN");

    // Create reversal record
    const revResult = await client.query(
      `INSERT INTO "Reversal" ("id", "targetType", "targetId", "reason", "idempotencyKey", "createdAt")
       VALUES (gen_random_uuid(), 'deposit', $1, $2, $3, now())
       RETURNING *`,
      [depositId, reason, idempotencyKey],
    );
    reversal = revResult.rows[0];

    // Compensating ledger: withdraw the deposited amount
    await client.query(
      `INSERT INTO "LedgerEntry" ("id", "walletId", "amount", "type", "createdAt")
       VALUES (gen_random_uuid(), $1, $2, 'deposit_reversal', now())`,
      [deposit.walletId, -amount],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  await invalidateBalance(deposit.walletId);

  // Removed: audit logging (moved to controller for financial actions)

  await emitEvent("deposit.reversed", {
    depositId,
    reversalId: reversal.id,
    reason,
    adminUserId,
    requestId,
  });

  return reversal;
}

// ─── REVERSE WITHDRAWAL (dispute / fraud recovery) ──────────────────
export async function reverseWithdrawal(params: {
  withdrawalId: string;
  reason: string;
  idempotencyKey: string;
  adminUserId: string;
  requestId?: string;
}) {
  const { withdrawalId, reason, idempotencyKey, adminUserId, requestId } = params;

  // Idempotency guard
  const existingResult = await pool.query(
    `SELECT * FROM "Reversal" WHERE "idempotencyKey" = $1`,
    [idempotencyKey],
  );
  if (existingResult.rows.length > 0) return existingResult.rows[0];

  // Load the withdrawal
  const withdrawalResult = await pool.query(
    `SELECT * FROM "Withdrawal" WHERE id = $1`,
    [withdrawalId],
  );
  const withdrawal = withdrawalResult.rows[0];
  if (!withdrawal) throw new Error("Withdrawal not found");
  if (withdrawal.status === "reversed") throw new Error("Withdrawal already reversed");

  const amount = parseFloat(withdrawal.amount);
  const client = await pool.connect();
  let reversal;

  try {
    await client.query("BEGIN");

    // Mark withdrawal as reversed
    await client.query(
      `UPDATE "Withdrawal" SET status = 'reversed' WHERE id = $1`,
      [withdrawalId],
    );

    // Create reversal record
    const revResult = await client.query(
      `INSERT INTO "Reversal" ("id", "targetType", "targetId", "reason", "idempotencyKey", "createdAt")
       VALUES (gen_random_uuid(), 'withdrawal', $1, $2, $3, now())
       RETURNING *`,
      [withdrawalId, reason, idempotencyKey],
    );
    reversal = revResult.rows[0];

    // Compensating ledger: re-credit the user's wallet
    await client.query(
      `INSERT INTO "LedgerEntry" ("id", "walletId", "amount", "type", "createdAt")
       VALUES (gen_random_uuid(), $1, $2, 'withdrawal_reversal', now())`,
      [withdrawal.walletId, amount],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  await invalidateBalance(withdrawal.walletId);

  // Removed: audit logging (moved to controller for financial actions)

  await emitEvent("withdrawal.reversed", {
    withdrawalId,
    reversalId: reversal.id,
    reason,
    adminUserId,
    requestId,
  });

  return reversal;
}
