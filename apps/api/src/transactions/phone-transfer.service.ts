import { pool } from "../db/pool";
import { postTransfer } from "./transfer.service";
import { upsertContact, isNewRecipient } from "./contact.service";

/** Normalize Haiti phone: strip spaces, prepend +509 if needed */
function normalizePhone(phone: string): string {
  let p = phone.replace(/[\s\-()]/g, "");
  if (p.startsWith("509") && !p.startsWith("+")) p = `+${p}`;
  if (!p.startsWith("+")) p = `+509${p}`;
  return p;
}

export async function sendByPhone(params: {
  senderUserId: string;
  recipientPhone: string;
  amount: number;
  currency: string;
  idempotencyKey: string;
}) {
  const { senderUserId, recipientPhone, amount, currency, idempotencyKey } = params;
  const phone = normalizePhone(recipientPhone);

  // 1. Find recipient by phone
  const recipientResult = await pool.query(
    `SELECT id FROM "User" WHERE phone = $1`, [phone]
  );
  if (recipientResult.rows.length === 0) {
    throw new Error("Recipient not found. They need a KobKlein account.");
  }
  const recipientUserId = recipientResult.rows[0].id;

  if (recipientUserId === senderUserId) {
    throw new Error("Cannot send money to yourself");
  }

  // 2. Find sender's wallet
  const senderWallet = await pool.query(
    `SELECT id FROM "Wallet" WHERE "userId" = $1 AND currency = $2`, [senderUserId, currency]
  );
  if (senderWallet.rows.length === 0) throw new Error("Sender wallet not found");

  // 3. Find recipient's wallet
  const recipientWallet = await pool.query(
    `SELECT id FROM "Wallet" WHERE "userId" = $1 AND currency = $2`, [recipientUserId, currency]
  );
  if (recipientWallet.rows.length === 0) throw new Error("Recipient wallet not found");

  // 4. Check if new recipient (for warning/risk)
  const newRecipient = await isNewRecipient(senderUserId, recipientUserId);

  // 5. Execute transfer
  const transfer = await postTransfer({
    fromWalletId: senderWallet.rows[0].id,
    toWalletId: recipientWallet.rows[0].id,
    amount,
    currency,
    idempotencyKey,
  });

  // 6. Track contact
  await upsertContact(senderUserId, recipientUserId);

  return { ...transfer, newRecipient };
}
