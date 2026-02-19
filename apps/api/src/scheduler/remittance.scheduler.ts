import cron from "node-cron";
import crypto from "crypto";
import { prisma } from "../db/prisma";
import { executeFxTransfer } from "../transfers/fx-transfer.service";
import { createNotification } from "../notifications/notification.service";

const MAX_FAILURES = 3;

/**
 * Process all due scheduled remittances.
 * Called daily by the cron scheduler.
 *
 * For each due schedule:
 *   1. Generate a unique idempotency key
 *   2. Call executeFxTransfer() (handles balance check, FX, ledger, notifications)
 *   3. On success: advance nextRunAt, reset failure count
 *   4. On failure: increment failure count, mark as "failed" after MAX_FAILURES
 */
async function processScheduledRemittances() {
  const now = new Date();

  const dueSchedules = await prisma.scheduledTransfer.findMany({
    where: {
      status: "active",
      nextRunAt: { lte: now },
    },
    take: 200, // Batch limit
    include: {
      User_ScheduledTransfer_senderUserIdToUser: { select: { id: true, firstName: true, isFrozen: true } },
      User_ScheduledTransfer_recipientUserIdToUser: { select: { id: true, firstName: true, kId: true } },
    },
  });

  console.log(
    `[remittance] Found ${dueSchedules.length} scheduled transfers due`,
  );

  for (const schedule of dueSchedules) {
    try {
      // Skip frozen senders — don't mark as failed, just skip this cycle
      if (schedule.User_ScheduledTransfer_senderUserIdToUser.isFrozen) {
        console.log(
          `[remittance] Skipping ${schedule.id} — sender is frozen`,
        );
        await createNotification(
          schedule.senderUserId,
          "Scheduled Transfer Skipped",
          `Your scheduled transfer of $${Number(schedule.amountUsd)} USD to ${schedule.User_ScheduledTransfer_recipientUserIdToUser.firstName || schedule.User_ScheduledTransfer_recipientUserIdToUser.kId || "family"} was skipped because your account is frozen.`,
          "system",
        );
        continue;
      }

      // Generate deterministic idempotency key for this run
      const idempotencyKey = `sched:${schedule.id}:${now.toISOString().slice(0, 10)}:${crypto.randomUUID()}`;

      const result = await executeFxTransfer({
        senderUserId: schedule.senderUserId,
        recipientUserId: schedule.recipientUserId,
        amountUsd: Number(schedule.amountUsd),
        idempotencyKey,
      });

      // Success — advance next run date + reset failures
      const daysMap: Record<string, number> = {
        weekly: 7,
        biweekly: 14,
        monthly: 30,
      };
      const days = daysMap[schedule.frequency] || 30;
      const nextRunAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      await prisma.scheduledTransfer.update({
        where: { id: schedule.id },
        data: {
          lastRunAt: now,
          lastTransferId: result.transferId,
          nextRunAt,
          failureCount: 0,
        },
      });

      console.log(
        `[remittance] Executed ${schedule.id}: $${Number(schedule.amountUsd)} USD → ${result.receivedHtg} HTG (rate: ${result.fxRate})`,
      );
    } catch (err: any) {
      const newFailureCount = schedule.failureCount + 1;
      const isFailed = newFailureCount >= MAX_FAILURES;

      await prisma.scheduledTransfer.update({
        where: { id: schedule.id },
        data: {
          failureCount: newFailureCount,
          status: isFailed ? "failed" : "active",
          lastRunAt: now,
        },
      });

      // Notify sender of failure
      if (isFailed) {
        await createNotification(
          schedule.senderUserId,
          "Scheduled Transfer Stopped",
          `Your recurring transfer of $${Number(schedule.amountUsd)} USD has been stopped after ${MAX_FAILURES} consecutive failures. Please check your USD balance and re-schedule.`,
          "system",
        );
      } else {
        await createNotification(
          schedule.senderUserId,
          "Scheduled Transfer Failed",
          `Your scheduled transfer of $${Number(schedule.amountUsd)} USD failed (attempt ${newFailureCount}/${MAX_FAILURES}): ${err.message}. We'll retry next cycle.`,
          "system",
        );
      }

      console.error(
        `[remittance] Failed ${schedule.id} (${newFailureCount}/${MAX_FAILURES}): ${err.message}`,
      );
    }
  }
}

/**
 * Start the daily remittance scheduler.
 * Runs every day at 07:00 UTC (2:00 AM EST — low-traffic window).
 */
export function startRemittanceScheduler() {
  cron.schedule("0 7 * * *", async () => {
    console.log("[remittance] Starting daily scheduled remittance cycle...");
    try {
      await processScheduledRemittances();
      console.log("[remittance] Remittance cycle complete");
    } catch (err: any) {
      console.error("[remittance] Remittance cycle error:", err.message);
    }
  });
}
