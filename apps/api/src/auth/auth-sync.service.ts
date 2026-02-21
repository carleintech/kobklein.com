import { pool } from "../db/pool";
import { ensureDefaultWallets } from "../wallets/wallet.service";
import { generateKId } from "../utils/kid";

/**
 * Sync user from Supabase Auth JWT to local database.
 * Called by SupabaseGuard on every authenticated request.
 * Creates user on first login, backfills K-ID for existing users.
 */
export async function syncUserFromSupabase(payload: any) {
  const supabaseId = payload.sub;
  const role = payload.user_metadata?.role || "user";
  const email = payload.email || null;
  const firstName = payload.user_metadata?.first_name || null;
  const lastName = payload.user_metadata?.last_name || null;
  const phone = payload.user_metadata?.phone || null;
  const kId = await generateKId();

  // Atomic upsert — handles concurrent first-login requests without race conditions.
  // ON CONFLICT: if the user already exists, only backfill fields that are still NULL
  // (never overwrite firstName/lastName/phone the user may have updated locally).
  const result = await pool.query(
    `INSERT INTO "User" ("id", "supabaseId", "role", "email", "firstName", "lastName", "phone", "kId", "createdAt", "updatedAt")
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, now(), now())
     ON CONFLICT ("supabaseId") DO UPDATE SET
       -- NEVER overwrite role once a user has completed onboarding
       -- Only use the JWT role if the DB role is still the default "user"
       "role"      = CASE WHEN "User"."role" IN ('user') THEN EXCLUDED."role" ELSE "User"."role" END,
       "email"     = COALESCE("User"."email",     EXCLUDED."email"),
       "firstName" = COALESCE("User"."firstName", EXCLUDED."firstName"),
       "lastName"  = COALESCE("User"."lastName",  EXCLUDED."lastName"),
       "phone"     = COALESCE("User"."phone",     EXCLUDED."phone"),
       "kId"       = COALESCE("User"."kId",       EXCLUDED."kId"),
       "updatedAt" = now()
     RETURNING *`,
    [supabaseId, role, email, firstName, lastName, phone, kId],
  );

  const user = result.rows[0];
  await ensureDefaultWallets(user.id);
  return user;
}

/**
 * Sync user from Auth0 JWT to local database.
 * Kept for admin app backward compatibility (Auth0 fallback).
 */
export async function syncUserFromAuth0(payload: any) {
  const auth0Id = payload.sub;
  const role = payload["https://kobklein.com/role"] || "user";

  let user = await pool.query(
    `SELECT * FROM "User" WHERE "auth0Id" = $1`,
    [auth0Id],
  );

  if (user.rows.length === 0) {
    const kId = await generateKId();

    const result = await pool.query(
      `INSERT INTO "User" ("id", "auth0Id", "role", "kId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, now(), now())
       RETURNING *`,
      [auth0Id, role, kId],
    );
    user = result;

    await ensureDefaultWallets(user.rows[0].id);
  } else {
    if (!user.rows[0].kId) {
      const kId = await generateKId();
      await pool.query(
        `UPDATE "User" SET "kId" = $1 WHERE "auth0Id" = $2`,
        [kId, auth0Id],
      );
      user.rows[0].kId = kId;
    }

    await ensureDefaultWallets(user.rows[0].id);
  }

  return user.rows[0];
}
