import { pullQueuedEvents, markEventHandled, markEventFailed } from "./event-bus.service";
import { notifyFloatLow, notifyFraudAlert, notifyDepositSuccess } from "../notifications/notification.service";
import { pool } from "../db/pool";

/**
 * Handle events here (one place).
 * Direct SMS is handled in services; this worker handles
 * async event-driven notifications that weren't sent inline.
 */
async function handleEvent(name: string, payload: any) {
  if (name === "transfer.posted") {
    // SMS already sent inline in transfer.service.ts
    return;
  }

  if (name === "deposit.posted") {
    // SMS already sent inline in deposit.service.ts
    return;
  }

  if (name === "withdrawal.requested" || name === "withdrawal.completed") {
    // SMS already sent inline in withdrawal.service.ts
    return;
  }

  if (name === "distributor.float.low") {
    // Float alert may have already been sent inline,
    // but we keep this as a safety net for async processing
    try {
      const userId = payload.distributorUserId;
      const result = await pool.query(`SELECT phone FROM "User" WHERE id = $1`, [userId]);
      const phone = result.rows[0]?.phone;
      if (phone) {
        await notifyFloatLow(phone, payload.floatBalance, payload.threshold);
      }
    } catch (e) {
      console.error("Event worker float.low notification failed:", e);
    }
    return;
  }

  if (name === "fraud.flagged") {
    try {
      const userId = payload.userId;
      const result = await pool.query(`SELECT phone FROM "User" WHERE id = $1`, [userId]);
      const phone = result.rows[0]?.phone;
      if (phone) {
        await notifyFraudAlert(phone, payload.reason ?? "Suspicious activity detected");
      }
    } catch (e) {
      console.error("Event worker fraud.flagged notification failed:", e);
    }
    return;
  }

  if (name === "webhook.stripe.payment_intent.succeeded") {
    // Deposit is already created by the Stripe webhook controller.
    // Here we send a deposit-success notification to the wallet owner.
    try {
      const walletId = payload.walletId;
      const amount = payload.amount ?? 0;
      if (walletId) {
        const walletResult = await pool.query(
          `SELECT w."userId" FROM "Wallet" w WHERE w.id = $1`,
          [walletId],
        );
        const userId = walletResult.rows[0]?.userId;
        if (userId) {
          const userResult = await pool.query(
            `SELECT phone FROM "User" WHERE id = $1`,
            [userId],
          );
          const phone = userResult.rows[0]?.phone;
          if (phone) {
            await notifyDepositSuccess(phone, amount);
          }
        }
      }
    } catch (e) {
      console.error("Event worker payment_intent.succeeded notification failed:", e);
    }
    return;
  }

  // Unknown events are not fatal; treat as handled for now
  return;
}

export function startEventWorker() {
  let lastErrorMsg = "";
  let lastErrorTime = 0;

  setInterval(async () => {
    try {
      const events = await pullQueuedEvents(25);
      for (const evt of events) {
        try {
          await handleEvent(evt.name, evt.payload);
          await markEventHandled(evt.id);
        } catch (e: any) {
          await markEventFailed(evt.id, e?.message ?? "unknown error");
        }
      }
    } catch (e: any) {
      // Debounce: only log once per unique message (or every 30s)
      const msg = e?.message || e?.code || (e != null ? String(e) : "unknown error");
      const now = Date.now();
      if (msg !== lastErrorMsg || now - lastErrorTime > 30_000) {
        console.warn("Event worker loop error:", msg);
        lastErrorMsg = msg;
        lastErrorTime = now;
      }
    }
  }, 5_000); // 5s poll — 1s was too aggressive on the connection pool
}
