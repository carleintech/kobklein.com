import { prisma } from "../db/prisma";
import { createNotification } from "../notifications/notification.service";

export async function registerDeviceSession(userId: string, req: any) {
  const fingerprint = req.headers["x-device-id"] || req.headers["user-agent"];
  const ip = req.ip;
  const userAgent = req.headers["user-agent"];

  const existing = await prisma.deviceSession.findFirst({
    where: { userId, fingerprint, ip },
  });

  if (!existing) {
    await prisma.deviceSession.create({
      data: { userId, fingerprint, ip, userAgent },
    });

    await createNotification(
      userId,
      "New Device Detected",
      `A new device or location accessed your account. If this wasn't you, secure your account.`
    );

    return { isNew: true };
  }

  await prisma.deviceSession.update({
    where: { id: existing.id },
    data: { lastSeenAt: new Date() },
  });

  return { isNew: false };
}