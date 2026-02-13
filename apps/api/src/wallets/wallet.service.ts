import { pool } from "../db/pool";

const DEFAULT_WALLETS = ["HTG", "USD"];

export async function ensureDefaultWallets(userId: string) {
  for (const currency of DEFAULT_WALLETS) {
    await pool.query(`
      INSERT INTO "Wallet" ("id", "userId", "currency", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, now(), now())
      ON CONFLICT ("userId", "currency") DO NOTHING
    `, [userId, currency]);
  }
}
