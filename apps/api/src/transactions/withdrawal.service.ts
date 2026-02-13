import { nanoid } from "nanoid";
import { invalidateBalance, getBalance } from "../wallets/balance.service";
// Removed: auditLog import (moved to controller)
import { emitEvent } from "../services/event-bus.service";
import { enforceTransferVelocity } from "../fraud/risk.service";
import { notifyWithdrawalRequested, notifyWithdrawalReady, notifyFloatLow } from "../notifications/notification.service";
import { pool } from "../db/pool";

function nowPlusMinutes(min: number) {
  const d = new Date();
  d.setMinutes(d.getMinutes() + min);
  return d;
}

export async function requestWithdrawal(params: {
  userId: string;
  walletId: string;
  amount: number;
  currency: string;
  ip?: string;
  userAgent?: string;
  requestId?: string;
}) {
  const { userId, walletId, amount, currency, ip, userAgent, requestId } = params;

  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Amount must be positive");

  // Basic anti-abuse (reuse velocity guard)
  await enforceTransferVelocity(userId);

  // Wallet must belong to user
  const walletResult = await pool.query(`
    SELECT * FROM "Wallet" WHERE id = $1
  `, [walletId]);
  if (walletResult.rows.length === 0 || walletResult.rows[0].userId !== userId) {
    throw new Error("Invalid wallet");
  }
  const wallet = walletResult.rows[0];

  // Currency consistency
  if (wallet.currency !== currency) throw new Error("Currency mismatch");

  // (Optional) You can also require kycTier >= 1 here later
  const code = `W${nanoid(10)}`; // short code, user shows to agent
  const expiresAt = nowPlusMinutes(15);

  // Create pending withdrawal (no money moves yet)
  const withdrawalResult = await pool.query(`
    INSERT INTO "Withdrawal" ("id", "userId", "walletId", "amount", "currency", "status", "code", "expiresAt", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, now(), now())
    RETURNING *
  `, [userId, walletId, amount.toString(), currency, "pending", code, expiresAt]);

  const withdrawal = withdrawalResult.rows[0];

  // Removed: audit logging (moved to controller)

  await emitEvent("withdrawal.requested", {
    withdrawalId: withdrawal.id,
    userId,
    walletId,
    amount,
    currency,
    code,
    expiresAt,
    requestId,
  });

  // SMS: notify user their withdrawal is pending + code
  try {
    const userResult = await pool.query(`SELECT phone FROM "User" WHERE id = $1`, [userId]);
    const phone = userResult.rows[0]?.phone;
    if (phone) {
      await notifyWithdrawalRequested(phone, code, amount);
    }
  } catch (e) {
    console.error("SMS notification failed (withdrawal.requested):", e);
  }

  return { withdrawalId: withdrawal.id, code, expiresAt };
}

export async function approveWithdrawal(params: {
  distributorUserId: string; // local user id of the distributor
  code: string;
  ip?: string;
  userAgent?: string;
  requestId?: string;
}) {
  const { distributorUserId, code, ip, userAgent, requestId } = params;

  // Find distributor profile and ensure active
  const distributorResult = await pool.query(`
    SELECT * FROM "Distributor" WHERE "userId" = $1
  `, [distributorUserId]);
  if (distributorResult.rows.length === 0) throw new Error("Not a distributor");
  const distributor = distributorResult.rows[0];
  if (distributor.status !== "active") throw new Error("Distributor not active");

  // Lookup withdrawal by code
  const withdrawalResult = await pool.query(`
    SELECT * FROM "Withdrawal" WHERE code = $1
  `, [code]);
  if (withdrawalResult.rows.length === 0) throw new Error("Invalid withdrawal code");
  const w = withdrawalResult.rows[0];

  // Must be pending + not expired
  if (w.status !== "pending") throw new Error("Withdrawal already processed");
  if (new Date(w.expiresAt).getTime() < Date.now()) throw new Error("Withdrawal code expired");

  // Get user's wallet (source of funds)
  const userWalletResult = await pool.query(`
    SELECT * FROM "Wallet" WHERE id = $1
  `, [w.walletId]);
  if (userWalletResult.rows.length === 0) throw new Error("User wallet not found");
  const userWallet = userWalletResult.rows[0];

  // Get distributor float wallet (same currency, type DISTRIBUTOR)
  const floatWalletResult = await pool.query(`
    SELECT * FROM "Wallet"
    WHERE "userId" = $1 AND currency = $2 AND type = $3
  `, [distributorUserId, w.currency, "DISTRIBUTOR"]);
  if (floatWalletResult.rows.length === 0) throw new Error("Distributor float wallet not found");
  const floatWallet = floatWalletResult.rows[0];

  const amount = Number(w.amount);

  // Calculate commission (commissionOut is stored as a decimal rate, e.g. 0.02 = 2%)
  const commissionRate = Number(distributor.commissionOut ?? 0.02);
  const fee = Math.round(amount * commissionRate * 100) / 100;
  const net = Math.round((amount - fee) * 100) / 100;

  // Atomic settlement using direct SQL
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check user balance
    const userBalResult = await client.query(`
      SELECT COALESCE(SUM(amount), 0) as balance
      FROM "LedgerEntry"
      WHERE "walletId" = $1
    `, [userWallet.id]);
    const userBal = parseFloat(userBalResult.rows[0].balance);
    if (userBal < amount) throw new Error("User has insufficient funds");

    // Check distributor float balance
    const floatBalResult = await client.query(`
      SELECT COALESCE(SUM(amount), 0) as balance
      FROM "LedgerEntry"
      WHERE "walletId" = $1
    `, [floatWallet.id]);
    const floatBal = parseFloat(floatBalResult.rows[0].balance);
    if (floatBal < amount) throw new Error("Distributor has insufficient float");

    // Mark withdrawal completed and assign distributor
    await client.query(`
      UPDATE "Withdrawal"
      SET "distributorId" = $1, status = $2, "feeAmount" = $3, "netAmount" = $4
      WHERE code = $5
    `, [distributor.id, "completed", fee.toString(), net.toString(), code]);

    // Debit user wallet
    await client.query(`
      INSERT INTO "LedgerEntry" ("id", "walletId", "amount", "type")
      VALUES (gen_random_uuid(), $1, $2, $3)
    `, [userWallet.id, -amount, "withdrawal"]);

    // Debit distributor float wallet
    await client.query(`
      INSERT INTO "LedgerEntry" ("id", "walletId", "amount", "type")
      VALUES (gen_random_uuid(), $1, $2, $3)
    `, [floatWallet.id, -amount, "cashout_float_debit"]);

    // Credit distributor commission
    await client.query(`
      INSERT INTO "LedgerEntry" ("id", "walletId", "amount", "type")
      VALUES (gen_random_uuid(), $1, $2, $3)
    `, [floatWallet.id, fee, "commission_credit"]);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  // Post-commit: cache invalidation
  await invalidateBalance(userWallet.id);
  await invalidateBalance(floatWallet.id);

  // Float low alert (default threshold; Distributor model doesn't have a per-agent field yet)
  const DEFAULT_LOW_FLOAT_THRESHOLD = 5000;
  const floatBalance = await getBalance(floatWallet.id);
  if (floatBalance < DEFAULT_LOW_FLOAT_THRESHOLD) {
    await emitEvent("distributor.float.low", {
      distributorId: distributor.id,
      distributorUserId,
      floatWalletId: floatWallet.id,
      floatBalance,
      threshold: DEFAULT_LOW_FLOAT_THRESHOLD,
      requestId,
    });

    // SMS: alert distributor about low float
    try {
      const distUserResult = await pool.query(`SELECT phone FROM "User" WHERE id = $1`, [distributorUserId]);
      const distPhone = distUserResult.rows[0]?.phone;
      if (distPhone) {
        await notifyFloatLow(distPhone, floatBalance, DEFAULT_LOW_FLOAT_THRESHOLD);
      }
    } catch (e) {
      console.error("SMS notification failed (float.low):", e);
    }
  }

  // Removed: audit logging (moved to controller)

  await emitEvent("withdrawal.completed", {
    withdrawalId: w.id,
    code,
    amount,
    currency: w.currency,
    distributorUserId,
    requestId,
  });

  // SMS: notify user their withdrawal is ready for pickup
  try {
    const userResult = await pool.query(`SELECT phone FROM "User" WHERE id = $1`, [w.userId]);
    const phone = userResult.rows[0]?.phone;
    if (phone) {
      await notifyWithdrawalReady(phone, code, amount);
    }
  } catch (e) {
    console.error("SMS notification failed (withdrawal.completed):", e);
  }

  return { ok: true, withdrawalId: w.id, status: "completed" };
}