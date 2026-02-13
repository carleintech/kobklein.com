import { pool } from "../db/pool";

export async function checkTransferLimits(params: {
  userId: string;
  amount: number;
}) {
  const { userId, amount } = params;

  const userResult = await pool.query(`
    SELECT * FROM "User" WHERE id = $1
  `, [userId]);
  const user = userResult.rows[0];
  if (!user) throw new Error("User not found");

  const limitsResult = await pool.query(`
    SELECT * FROM "LimitConfig" WHERE tier = $1
  `, [user.kycTier]);
  const limits = limitsResult.rows[0];
  if (!limits) throw new Error("Limits not configured");

  // Daily total - calculate start of today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get all wallet IDs for this user
  const walletResult = await pool.query(`
    SELECT id FROM "Wallet" WHERE "userId" = $1
  `, [userId]);
  const walletIds = walletResult.rows.map((w) => w.id);

  if (walletIds.length === 0) return; // No wallets, no limits to check

  // Sum all transfers from user's wallets today
  const dailyResult = await pool.query(`
    SELECT COALESCE(SUM(amount), 0) as total FROM "Transfer"
    WHERE "createdAt" >= $1 AND "fromWalletId" = ANY($2)
  `, [today, walletIds]);
  const dailyUsed = parseFloat(dailyResult.rows[0].total);

  if (dailyUsed + amount > limits.dailySend) {
    throw new Error("Daily limit exceeded");
  }

  // Monthly total - calculate start of this month
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthlyResult = await pool.query(`
    SELECT COALESCE(SUM(amount), 0) as total FROM "Transfer"
    WHERE "createdAt" >= $1 AND "fromWalletId" = ANY($2)
  `, [monthStart, walletIds]);
  const monthlyUsed = parseFloat(monthlyResult.rows[0].total);

  if (monthlyUsed + amount > limits.monthlySend) {
    throw new Error("Monthly limit exceeded");
  }
}
