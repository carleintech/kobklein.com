import { sendSMS, isTwilioConfigured } from "./sms.service";
import { sendEmail, isEmailConfigured } from "./email.service";
import { enqueueNotification, NotificationJob } from "./notification.queue";

// ─── Message Templates (Haiti / HTG) ──────────────────────────

function fmtHTG(amount: number | string) {
  return `${Number(amount).toLocaleString("fr-HT")} HTG`;
}

const templates = {
  "withdrawal.ready": (data: { code: string; amount: number }) =>
    `KobKlein: Retrè ou ${fmtHTG(data.amount)} prè. Kòd: ${data.code}`,

  "withdrawal.requested": (data: { code: string; amount: number }) =>
    `KobKlein: Demann retrè ${fmtHTG(data.amount)}. Kòd: ${data.code}. Ale nan ajan ou.`,

  "deposit.success": (data: { amount: number }) =>
    `KobKlein: Depozit ${fmtHTG(data.amount)} resevwa. Balans ou ajou.`,

  "transfer.sent": (data: { amount: number; recipientName?: string }) =>
    `KobKlein: Ou voye ${fmtHTG(data.amount)}${data.recipientName ? ` bay ${data.recipientName}` : ""}. Tranzaksyon fèt.`,

  "transfer.received": (data: { amount: number; senderName?: string }) =>
    `KobKlein: Ou resevwa ${fmtHTG(data.amount)}${data.senderName ? ` de ${data.senderName}` : ""}. Tcheke balans ou.`,

  "fraud.alert": (data: { reason: string }) =>
    `KobKlein: Alèt sekirite sou kont ou — ${data.reason}. Kontakte sipò.`,

  "float.low": (data: { balance: number; threshold: number }) =>
    `KobKlein Ajan: Float ba! Balans: ${fmtHTG(data.balance)}, limit: ${fmtHTG(data.threshold)}. Refill.`,

  "kyc.reminder": () =>
    `KobKlein: Tanpri konplete verifikasyon KYC ou pou ogmante limit ou. Ale nan app la.`,
} as const;

export type NotificationType = keyof typeof templates;

// ─── Dispatch ──────────────────────────────────────────────────

/**
 * Queue a notification for async delivery.
 * Falls back to direct send if BullMQ is unavailable.
 */
export async function notify(
  phone: string,
  type: NotificationType,
  data: Record<string, any>,
) {
  const templateFn = templates[type] as (d: any) => string;
  if (!templateFn) {
    console.warn(`Unknown notification type: ${type}`);
    return;
  }

  const body = templateFn(data);

  const job: NotificationJob = {
    channel: "sms",
    to: phone,
    body,
    type,
    data,
    attempt: 0,
  };

  try {
    await enqueueNotification(job);
  } catch (err) {
    // BullMQ down — send directly as fallback
    console.warn("Queue unavailable, sending SMS directly:", err);
    if (isTwilioConfigured()) {
      await sendSMS(phone, body);
    } else {
      console.log(`[SMS-DRY] → ${phone}: ${body}`);
    }
  }
}

// ─── Convenience helpers ───────────────────────────────────────

export async function notifyWithdrawalReady(phone: string, code: string, amount: number) {
  return notify(phone, "withdrawal.ready", { code, amount });
}

export async function notifyWithdrawalRequested(phone: string, code: string, amount: number) {
  return notify(phone, "withdrawal.requested", { code, amount });
}

export async function notifyDepositSuccess(phone: string, amount: number) {
  return notify(phone, "deposit.success", { amount });
}

export async function notifyTransferSent(phone: string, amount: number, recipientName?: string) {
  return notify(phone, "transfer.sent", { amount, recipientName });
}

export async function notifyTransferReceived(phone: string, amount: number, senderName?: string) {
  return notify(phone, "transfer.received", { amount, senderName });
}

export async function notifyFraudAlert(phone: string, reason: string) {
  return notify(phone, "fraud.alert", { reason });
}

export async function notifyFloatLow(phone: string, balance: number, threshold: number) {
  return notify(phone, "float.low", { balance, threshold });
}

export async function notifyKycReminder(phone: string) {
  return notify(phone, "kyc.reminder", {});
}

export async function enqueueSMS(phone: string, message: string) {
  const job: NotificationJob = {
    channel: "sms",
    to: phone,
    body: message,
    type: "otp",
    data: {},
    attempt: 0,
  };

  try {
    await enqueueNotification(job);
  } catch (err) {
    // Fallback to direct send
    console.warn("Queue unavailable, sending SMS directly:", err);
    if (isTwilioConfigured()) {
      await sendSMS(phone, message);
    }
  }
}

export async function createNotification(
  userId: string,
  title: string,
  body: string,
  type: string = "system"
) {
  const { prisma } = await import("../db/prisma.js");
  return prisma.notification.create({
    data: { userId, title, body, type },
  });
}

/**
 * Send a transactional HTML email to a user by their DB user ID.
 * Looks up the user's email address, then calls sendEmail() directly (not queued).
 * Silently no-ops if the user has no email on record or email is not configured.
 */
export async function notifyWithEmail(
  userId: string,
  template: () => { subject: string; html: string },
): Promise<void> {
  if (!isEmailConfigured()) return;
  try {
    const { prisma } = await import("../db/prisma.js");
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user?.email) return;
    const { subject, html } = template();
    await sendEmail(user.email, subject, html);
  } catch (err) {
    console.error("[notifyWithEmail] failed:", err);
  }
}
