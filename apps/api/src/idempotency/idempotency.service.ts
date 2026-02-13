import crypto from "crypto";
import { prisma } from "../db/prisma";

function hashJson(obj: any) {
  return crypto.createHash("sha256").update(JSON.stringify(obj)).digest("hex");
}

/**
 * Generic idempotency wrapper for any financial operation.
 * Prevents double-execution from retries, double-taps, or network replays.
 */
export async function withIdempotency<T>(params: {
  userId?: string;
  route: string;
  key: string;
  body: any;
  run: () => Promise<T>;
}): Promise<T> {
  const requestHash = hashJson(params.body);

  // Check for existing key
  const existing = await prisma.idempotencyKey.findUnique({
    where: {
      key_route: { key: params.key, route: params.route },
    },
  });

  if (existing) {
    // Same key with different payload = suspicious reuse
    if (existing.requestHash !== requestHash) {
      throw new Error("Idempotency key reuse with different payload");
    }

    // Return cached response
    return existing.response as T;
  }

  // Create "processing" record to prevent race conditions
  await prisma.idempotencyKey.create({
    data: {
      userId: params.userId,
      key: params.key,
      route: params.route,
      requestHash,
      status: "processing",
      response: {},
    },
  });

  try {
    const result = await params.run();

    await prisma.idempotencyKey.update({
      where: { key_route: { key: params.key, route: params.route } },
      data: {
        status: "completed",
        response: result as any,
      },
    });

    return result;
  } catch (err: any) {
    await prisma.idempotencyKey.update({
      where: { key_route: { key: params.key, route: params.route } },
      data: {
        status: "failed",
        response: { error: String(err?.message || err) },
      },
    });
    throw err;
  }
}
