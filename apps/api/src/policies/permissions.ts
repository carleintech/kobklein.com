/**
 * Role-Based Permission Matrix
 *
 * Single source of truth for which roles access which endpoint groups.
 * Usage: @Roles(...Permissions.MERCHANT)
 */

export const Role = {
  user: "user",
  diaspora: "diaspora",
  merchant: "merchant",
  distributor: "distributor",
  admin: "admin",
} as const;

export const Permissions = {
  /** Admin-only endpoints */
  ADMIN: ["admin"],

  /** Merchant endpoints (merchants + admin) */
  MERCHANT: ["merchant", "admin"],

  /** Distributor/agent endpoints (distributors + admin) */
  DISTRIBUTOR: ["distributor", "admin"],

  /** Diaspora endpoints (diaspora + admin) */
  DIASPORA: ["diaspora", "admin"],

  /** Regular user endpoints (users + admin) */
  USER: ["user", "admin"],

  /** Shared: any authenticated user with wallet (users + diaspora + admin) */
  WALLET_USER: ["user", "diaspora", "admin"],

  /** Shared: any role can access (no role restriction) */
  ANY: [] as string[],
} as const;
