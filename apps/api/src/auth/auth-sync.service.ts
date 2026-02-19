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
  // Sync name + phone from Supabase signup metadata so /v1/users/me always returns them
  const firstName = payload.user_metadata?.first_name || null;
  const lastName = payload.user_metadata?.last_name || null;
  const phone = payload.user_metadata?.phone || null;

  let user = await pool.query(
    `SELECT * FROM "User" WHERE "supabaseId" = $1`,
    [supabaseId],
  );

  if (user.rows.length === 0) {
    const kId = await generateKId();

    const result = await pool.query(
      `INSERT INTO "User" ("id", "supabaseId", "role", "email", "firstName", "lastName", "phone", "kId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, now(), now())
       RETURNING *`,
      [supabaseId, role, email, firstName, lastName, phone, kId],
    );
    user = result;

    await ensureDefaultWallets(user.rows[0].id);
  } else {
    // Backfill K-ID for existing users who don't have one
    if (!user.rows[0].kId) {
      const kId = await generateKId();
      await pool.query(
        `UPDATE "User" SET "kId" = $1 WHERE "supabaseId" = $2`,
        [kId, supabaseId],
      );
      user.rows[0].kId = kId;
    }

    // Build a single UPDATE for all fields that may have changed
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (email && user.rows[0].email !== email) {
      updates.push(`"email" = $${idx++}`); values.push(email);
    }
    if (role && user.rows[0].role !== role) {
      updates.push(`"role" = $${idx++}`); values.push(role);
    }
    // Always backfill name/phone if missing in DB (set once from Supabase metadata)
    if (firstName && !user.rows[0].firstName) {
      updates.push(`"firstName" = $${idx++}`); values.push(firstName);
    }
    if (lastName && !user.rows[0].lastName) {
      updates.push(`"lastName" = $${idx++}`); values.push(lastName);
    }
    if (phone && !user.rows[0].phone) {
      updates.push(`"phone" = $${idx++}`); values.push(phone);
    }

    if (updates.length > 0) {
      values.push(supabaseId);
      await pool.query(
        `UPDATE "User" SET ${updates.join(", ")} WHERE "supabaseId" = $${idx}`,
        values,
      );
      // Refresh local cache
      if (email && user.rows[0].email !== email) user.rows[0].email = email;
      if (role && user.rows[0].role !== role) user.rows[0].role = role;
      if (firstName && !user.rows[0].firstName) user.rows[0].firstName = firstName;
      if (lastName && !user.rows[0].lastName) user.rows[0].lastName = lastName;
      if (phone && !user.rows[0].phone) user.rows[0].phone = phone;
    }

    await ensureDefaultWallets(user.rows[0].id);
  }

  return user.rows[0];
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
