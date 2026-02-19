import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { sendSMS, isTwilioConfigured } from "./sms.service";
import { sendEmail, isEmailConfigured } from "./email.service";
import { notifyUser as pushNotifyUser } from "../push/push.service";
import {
  logNotificationQueued,
  markNotificationSent,
  markNotificationFailed,
} from "./notification-log.service";

// ─── Types ─────────────────────────────────────────────────────

export interface NotificationJob {
  channel: "sms" | "email" | "push";
  to: string;
  body: string;
  type: string;
  data: Record<string, any>;
  attempt: number;
  logId?: string; // NotificationLog row ID
  userId?: string;
}

// ─── Redis connection (BullMQ uses ioredis) ────────────────────

function createRedisConnection() {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL not set — BullMQ queue disabled");
  return new IORedis(url, { maxRetriesPerRequest: null });
}

// ─── Queue ─────────────────────────────────────────────────────

const QUEUE_NAME = "notifications";

let queue: Queue<NotificationJob> | null = null;

export function getNotificationQueue(): Queue<NotificationJob> | null {
  if (!queue) {
    try {
      queue = new Queue<NotificationJob>(QUEUE_NAME, {
        connection: createRedisConnection(),
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: "exponential", delay: 2000 },
          removeOnComplete: { count: 1000 },
          removeOnFail: { count: 5000 },
        },
      });
    } catch {
      console.warn("⚠ BullMQ queue not available (REDIS_URL not set)");
      return null;
    }
  }
  return queue;
}

/**
 * Add a notification job to the queue.
 * Creates a NotificationLog entry for tracking.
 */
export async function enqueueNotification(job: NotificationJob): Promise<void> {
  // Create log entry first
  try {
    const logId = await logNotificationQueued({
      channel: job.channel,
      type: job.type,
      to: job.to,
      body: job.body,
      userId: job.userId,
    });
    job.logId = logId;
  } catch (e) {
    console.error("Failed to create notification log:", e);
  }

  const q = getNotificationQueue();
  if (!q) {
    console.warn(`[Notification] Queue unavailable — skipping ${job.type} → ${job.channel}:${job.to}`);
    return;
  }
  const added = await q.add(job.type, job, {
    priority: job.channel === "sms" ? 1 : 5,
  });

  // Update log with job ID
  if (job.logId && added.id) {
    try {
      const { pool } = await import("../db/pool.js");
      await pool.query(`UPDATE "NotificationLog" SET "jobId" = $1 WHERE id = $2`, [added.id, job.logId]);
    } catch (_) { /* best-effort */ }
  }
}

// ─── Worker ────────────────────────────────────────────────────

let worker: Worker<NotificationJob> | null = null;

async function processNotification(job: Job<NotificationJob>): Promise<void> {
  const { channel, to, body, type, logId } = job.data;

  console.log(`[Notification Worker] Processing ${type} → ${channel}:${to}`);

  try {
    if (channel === "sms") {
      if (isTwilioConfigured()) {
        await sendSMS(to, body);
      } else {
        console.log(`[SMS-DRY] → ${to}: ${body}`);
      }
    } else if (channel === "email") {
      if (isEmailConfigured()) {
        await sendEmail(to, type, body);
      } else {
        console.log(`[EMAIL-DEV] → ${to}: ${body}`);
      }
    } else if (channel === "push") {
      // `to` holds the userId for push notifications
      const userId = job.data.userId ?? to;
      if (userId) {
        const result = await pushNotifyUser(userId, { title: type, body });
        console.log(`[PUSH] → userId=${userId}: sent=${result.sent}, failed=${result.failed}`);
      } else {
        console.warn(`[PUSH] No userId for push notification, skipping: ${body}`);
      }
    } else {
      console.warn(`[Notification Worker] Unknown channel: ${channel}`);
    }

    // Mark success in log
    if (logId) {
      await markNotificationSent(logId, job.attemptsMade + 1);
    }
  } catch (err: any) {
    // Mark failure in log
    if (logId) {
      await markNotificationFailed(logId, err?.message ?? "unknown", job.attemptsMade + 1);
    }
    throw err; // re-throw so BullMQ can retry
  }
}

/**
 * Start the BullMQ notification worker.
 * Call this once during app init, after Redis is ready.
 */
export function startNotificationWorker(): void {
  if (worker) return; // already running

  if (!process.env.REDIS_URL) {
    console.warn("⚠ REDIS_URL not set — notification worker disabled");
    return;
  }

  worker = new Worker<NotificationJob>(QUEUE_NAME, processNotification, {
    connection: createRedisConnection(),
    concurrency: 5,
    limiter: {
      max: 10, // max 10 SMS per second (Twilio rate limit safe)
      duration: 1000,
    },
  });

  worker.on("completed", (job) => {
    console.log(`[Notification] ✓ ${job.data.type} → ${job.data.to}`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Notification] ✗ ${job?.data?.type} → ${job?.data?.to}: ${err.message}`);
  });

  console.log("Notification worker started (BullMQ, concurrency=5)");
}

/**
 * Gracefully shut down the worker.
 */
export async function stopNotificationWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
  }
  if (queue) {
    await queue.close();
    queue = null;
  }
}
