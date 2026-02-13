import { prisma } from "../db/prisma";

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Create a rotating 6-digit receive code valid for 5 minutes.
 * Used for offline/voice/street transactions in Haiti.
 */
export async function createReceiveCode(userId: string) {
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  let code = generateCode();

  // Retry on collision (unlikely but safe)
  let attempts = 0;
  while (await prisma.receiveCode.findUnique({ where: { code } })) {
    code = generateCode();
    attempts++;
    if (attempts > 10) throw new Error("Could not generate unique code");
  }

  await prisma.receiveCode.create({
    data: { userId, code, expiresAt },
  });

  return { code, expiresIn: 300 };
}

/**
 * Resolve a receive code to a recipient userId.
 */
export async function resolveReceiveCode(code: string) {
  const entry = await prisma.receiveCode.findUnique({ where: { code } });

  if (!entry) throw new Error("Invalid receive code");
  if (new Date(entry.expiresAt) < new Date()) throw new Error("Receive code expired");

  return { recipientUserId: entry.userId };
}
