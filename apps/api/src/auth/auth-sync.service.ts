import { pool } from "../db/pool";
import { ensureDefaultWallets } from "../wallets/wallet.service";
import { generateKId } from "../utils/kid";
import { notifyWithEmail } from "../notifications/notification.service";
import { welcomeEmail } from "../notifications/email-templates";

// ─── In-memory user cache ────────────────────────────────────────────────────
// Prevents 4 DB round-trips on every authenticated request for existing users.
// TTL: 30 seconds — short enough to pick up role/profile changes promptly.
type CachedUser = { user: Record<string, unknown>; expiresAt: number };
const USER_CACHE = new Map<string, CachedUser>();
const USER_CACHE_TTL_MS = 30_000;

/**
 * Invalidate the user sync cache for a specific Supabase user.
 * Call this after any operation that changes the user's role or profile.
 */
export function invalidateUserCache(supabaseId: string) {
  USER_CACHE.delete(supabaseId);
}

/**
 * Sync user from Supabase Auth JWT to local database.
 * Called by SupabaseGuard on every authenticated request.
 * Creates user on first login, backfills K-ID for existing users.
 * Uses an in-memory cache to skip DB calls for the common case (returning user).
 */
export async function syncUserFromSupabase(payload: any) {
  const supabaseId = payload.sub;

  // Cache hit — return the cached user row, skip all DB calls
  const cached = USER_CACHE.get(supabaseId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.user;
  }
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

  // Send welcome email on first login (createdAt within last 10 seconds = new insert)
  const isNew = (Date.now() - new Date(user.createdAt).getTime()) < 10_000;
  if (isNew && user.email) {
    notifyWithEmail(user.id, () => welcomeEmail(user.firstName || user.email)).catch(() => {});
  }

  // Cache the synced user row so subsequent requests skip all DB calls
  USER_CACHE.set(supabaseId, { user, expiresAt: Date.now() + USER_CACHE_TTL_MS });

  return user;
}

/**
 * Sync user from Auth0 JWT to local database.
 * Kept for admin app backward compatibility (Auth0 fallback).
 *
 * Auth0 sets the role under TWO possible claim names:
 *   - https://kobklein.com/admin_role  (preferred — set by Auth0 Action)
 *   - https://kobklein.com/role        (legacy fallback)
 * We check admin_role first so admin sub-roles (super_admin, regional_manager,
 * support_agent) are stored correctly and pass the RolesGuard.
 */
export async function syncUserFromAuth0(payload: any) {
  const auth0Id = payload.sub;

  // Prefer admin_role (set by Auth0 Action) over legacy role claim
  const role: string =
    (payload["https://kobklein.com/admin_role"] as string | undefined) ||
    (payload["https://kobklein.com/role"] as string | undefined) ||
    "admin"; // fallback: admin app users are admins

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
    // Always sync the role from the JWT for admin users.
    // This corrects existing rows that may have been set to "user" before this fix.
    const kId = user.rows[0].kId || await generateKId();
    const result = await pool.query(
      `UPDATE "User" SET "role" = $1, "kId" = COALESCE("kId", $2), "updatedAt" = now()
       WHERE "auth0Id" = $3
       RETURNING *`,
      [role, kId, auth0Id],
    );
    user = result;

    await ensureDefaultWallets(user.rows[0].id);
  }

  return user.rows[0];
}
