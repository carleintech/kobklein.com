import { pool } from "../db/pool";

/** Upsert a transfer contact (increment count, update lastTransferAt) */
export async function upsertContact(userId: string, contactUserId: string) {
  await pool.query(`
    INSERT INTO "TransferContact" ("id", "userId", "contactUserId", "transferCount", "lastTransferAt", "createdAt")
    VALUES (gen_random_uuid(), $1, $2, 1, now(), now())
    ON CONFLICT ("userId", "contactUserId")
    DO UPDATE SET "transferCount" = "TransferContact"."transferCount" + 1, "lastTransferAt" = now()
  `, [userId, contactUserId]);
}

/** Get user's recent contacts sorted by most recent transfer */
export async function getContacts(userId: string, limit = 20) {
  const result = await pool.query(`
    SELECT tc.*, u."firstName", u."lastName", u.phone, u.handle
    FROM "TransferContact" tc
    JOIN "User" u ON u.id = tc."contactUserId"
    WHERE tc."userId" = $1
    ORDER BY tc."lastTransferAt" DESC
    LIMIT $2
  `, [userId, limit]);
  return result.rows;
}

/** Check if a phone number belongs to an existing user. Returns user info or null. */
export async function checkPhone(phone: string) {
  const result = await pool.query(`
    SELECT id, "firstName", "lastName", phone, handle FROM "User" WHERE phone = $1
  `, [phone]);
  return result.rows[0] || null;
}

/** Check if this is a first-time recipient for the sender */
export async function isNewRecipient(userId: string, contactUserId: string): Promise<boolean> {
  const result = await pool.query(`
    SELECT id FROM "TransferContact" WHERE "userId" = $1 AND "contactUserId" = $2
  `, [userId, contactUserId]);
  return result.rows.length === 0;
}
