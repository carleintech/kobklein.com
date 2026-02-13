import { pool } from "../db/pool";
import { ensureDefaultWallets } from "../wallets/wallet.service";
import { generateKId } from "../utils/kid";

export async function syncUserFromAuth0(payload: any) {
  const auth0Id = payload.sub;
  const role = payload["https://kobklein.com/role"] || "user";

  let user = await pool.query(`
    SELECT * FROM "User" WHERE "auth0Id" = $1
  `, [auth0Id]);

  if (user.rows.length === 0) {
    // Generate unique K-ID for new user
    const kId = await generateKId();

    const result = await pool.query(`
      INSERT INTO "User" ("id", "auth0Id", "role", "kId", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, now(), now())
      RETURNING *
    `, [auth0Id, role, kId]);
    user = result;

    await ensureDefaultWallets(user.rows[0].id);
  } else {
    // Backfill K-ID for existing users who don't have one
    if (!user.rows[0].kId) {
      const kId = await generateKId();
      await pool.query(`UPDATE "User" SET "kId" = $1 WHERE "auth0Id" = $2`, [kId, auth0Id]);
      user.rows[0].kId = kId;
    }

    await ensureDefaultWallets(user.rows[0].id);
  }

  return user.rows[0];
}
