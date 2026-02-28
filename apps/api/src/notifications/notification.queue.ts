import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";
import * as net from "net";
import { sendSMS, isTwilioConfigured } from "./sms.service";
import { sendEmail, isEmailConfigured } from "./email.service";
import { notifyUser as pushNotifyUser, notifyUserWebPush } from "../push/push.service";
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
  subject?: string; // email subject (falls back to type if omitted)
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
  const tls = url.startsWith("rediss://") ? { rejectUnauthorized: false } : undefined;
  const conn = new IORedis(url, {
    maxRetriesPerRequest: null, // required by BullMQ
    tls,
    connectTimeout: 5000,
    retryStrategy: () => null,  // fail fast — do not reconnect
    enableOfflineQueue: false,
  });
  // Suppress noisy ETIMEDOUT/ECONNREFUSED stack traces on this connection.
  conn.on("error", () => {});
  // BullMQ calls conn.duplicate() internally — patch it so duplicates are
  // also silent.
  const originalDuplicate = conn.duplicate.bind(conn);
  (conn as any).duplicate = (...args: any[]) => {
    const dup: typeof conn = originalDuplicate(...args);
    dup.on("error", () => {});
    return dup;
  };
  return conn;
}

// ─── Queue ─────────────────────────────────────────────────────

const QUEUE_NAME = "notifications";

let queue: Queue<NotificationJob> | null = null;

export function getNotificationQueue(): Queue<NotificationJob> | null {
  // DISABLE_QUEUE=true → skip BullMQ entirely (prevents ioredis stall-checker
  // from firing evalsha every 30s and exhausting Upstash's 500k/day free tier).
  if (process.env.DISABLE_QUEUE === "true") return null;

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
      const emailSubject = job.data.subject || type;
      if (isEmailConfigured()) {
        await sendEmail(to, emailSubject, body);
      } else {
        console.log(`[EMAIL-DEV] → ${to}: ${emailSubject}\n${body}`);
      }
    } else if (channel === "push") {
      // `to` holds the userId for push notifications
      const userId = job.data.userId ?? to;
      if (userId) {
        const [expoResult, webResult] = await Promise.all([
          pushNotifyUser(userId, { title: type, body }),
          notifyUserWebPush(userId, { title: type, body }),
        ]);
        console.log(`[PUSH] → userId=${userId}: expo=${expoResult.sent}, web=${webResult.sent}`);
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

// ─── TCP reachability check ────────────────────────────────────

function checkTCPReachable(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname;
      const port = parseInt(parsed.port, 10) || (url.startsWith("rediss://") ? 6380 : 6379);
      const socket = net.createConnection({ host, port });
      const timer = setTimeout(() => { socket.destroy(); resolve(false); }, 3000);
      socket.on("connect", () => { clearTimeout(timer); socket.destroy(); resolve(true); });
      socket.on("error",   () => { clearTimeout(timer); resolve(false); });
    } catch {
      resolve(false);
    }
  });
}

/**
 * Start the BullMQ notification worker.
 * Call this once during app init, after Redis is ready.
 */
export async function startNotificationWorker(): Promise<void> {
  if (worker) return; // already running

  // DISABLE_QUEUE=true → skip BullMQ entirely. Use this in dev when pointing
  // at Upstash to avoid exhausting the 500k/day free-tier command limit.
  // Notifications fall back to direct (synchronous) delivery instead.
  if (process.env.DISABLE_QUEUE === "true") {
    console.log("⚠ DISABLE_QUEUE=true — BullMQ notification worker disabled (direct delivery fallback active)");
    return;
  }

  if (!process.env.REDIS_URL) {
    console.warn("⚠ REDIS_URL not set — notification worker disabled");
    return;
  }

  // Pre-flight TCP check — BullMQ requires port 6379 (ioredis).
  // Skip entirely if the host is unreachable to avoid flooding the console
  // with ETIMEDOUT stack traces from BullMQ's internal connections.
  const reachable = await checkTCPReachable(process.env.REDIS_URL);
  if (!reachable) {
    console.warn("⚠ Redis TCP endpoint unreachable — notification worker disabled (BullMQ requires port 6379)");
    return;
  }

  worker = new Worker<NotificationJob>(QUEUE_NAME, processNotification, {
    connection: createRedisConnection(),
    concurrency: 5,
    // Increase stall-check interval from 30s (default) to 5 minutes.
    // Each stall check = ~8 Redis commands via evalsha.  At 30s the default
    // exhausts Upstash's 500k/day free tier in hours; 5 min reduces that 10×.
    stalledInterval: 300_000,
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
