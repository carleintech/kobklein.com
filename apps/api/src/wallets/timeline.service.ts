import { pool } from "../db/pool";

export async function getWalletTimeline(walletId: string, limit = 50, offset = 0) {
  const result = await pool.query(`
    SELECT * FROM (
      SELECT d.id, d.amount, d.currency, 'deposit' as type, d.source as detail, d."createdAt"
      FROM "Deposit" d WHERE d."walletId" = $1

      UNION ALL

      SELECT t.id, -t.amount as amount, t.currency, 'transfer_sent' as type,
             COALESCE(u."firstName", u.phone, 'Unknown') as detail, t."createdAt"
      FROM "Transfer" t
      JOIN "Wallet" w ON w.id = t."toWalletId"
      JOIN "User" u ON u.id = w."userId"
      WHERE t."fromWalletId" = $1 AND t.status IN ('posted', 'completed')

      UNION ALL

      SELECT t.id, t.amount, t.currency, 'transfer_received' as type,
             COALESCE(u."firstName", u.phone, 'Unknown') as detail, t."createdAt"
      FROM "Transfer" t
      JOIN "Wallet" w ON w.id = t."fromWalletId"
      JOIN "User" u ON u.id = w."userId"
      WHERE t."toWalletId" = $1 AND t.status IN ('posted', 'completed')

      UNION ALL

      SELECT w.id, -w.amount::float as amount, w.currency, 'withdrawal' as type,
             w.status as detail, w."createdAt"
      FROM "Withdrawal" w WHERE w."walletId" = $1
    ) timeline
    ORDER BY "createdAt" DESC
    LIMIT $2 OFFSET $3
  `, [walletId, limit, offset]);

  return result.rows;
}
