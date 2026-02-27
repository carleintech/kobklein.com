/**
 * Region Scope Enforcement Helper
 *
 * For regional_manager role: all queries MUST be filtered by region.
 * This helper extracts the region_id from the JWT and returns a Prisma
 * `where` clause fragment.
 *
 * Usage in controllers:
 *
 *   const regionFilter = getRegionFilter(req);
 *   const users = await prisma.user.findMany({
 *     where: { ...regionFilter, role: "client" },
 *   });
 *
 * If the role is NOT regional_manager, regionFilter returns {} (no restriction).
 * If the role IS regional_manager and has no region set, access is denied.
 *
 * GOVERNANCE RULE:
 *   GOVERNANCE_RULES.REGIONAL_SCOPED =
 *   "All regional_manager queries must be filtered by region_id in the backend"
 */

import { ForbiddenException } from "@nestjs/common";

export type RegionFilter =
  | { region: string }   // regional_manager — filtered to their region
  | Record<never, never>; // all other roles — no region restriction

/**
 * Extract region scope from JWT and return Prisma where-clause fragment.
 * Throws 403 if role is regional_manager but no region_id is set in JWT.
 */
export function getRegionFilter(req: any): RegionFilter {
  const meta  = req.user?.user_metadata as Record<string, unknown> | undefined;
  const role  =
    (meta?.["admin_role"] as string | undefined) ??
    (meta?.["role"]       as string | undefined) ??
    req.localUser?.role;

  // Non-regional roles: no restriction
  if (role !== "regional_manager") return {};

  // Extract region from JWT metadata
  const region =
    (meta?.["region_id"]   as string | undefined) ??
    (meta?.["region"]      as string | undefined) ??
    (meta?.["regionCode"]  as string | undefined);

  if (!region) {
    throw new ForbiddenException(
      "Regional Manager account has no region assigned. " +
      "Contact super_admin to assign your region in user_metadata.region_id",
    );
  }

  return { region };
}

/**
 * Get the current user's role from the request.
 */
export function getAdminRole(req: any): string | undefined {
  const meta = req.user?.user_metadata as Record<string, unknown> | undefined;
  return (
    (meta?.["admin_role"] as string | undefined) ??
    (meta?.["role"]       as string | undefined) ??
    req.localUser?.role
  );
}

/**
 * Get the current user's region from the JWT metadata.
 * Returns null if not a regional_manager or no region set.
 */
export function getRegionId(req: any): string | null {
  const meta = req.user?.user_metadata as Record<string, unknown> | undefined;
  const role = getAdminRole(req);
  if (role !== "regional_manager") return null;
  return (
    (meta?.["region_id"]  as string | undefined) ??
    (meta?.["region"]     as string | undefined) ??
    null
  );
}

/**
 * Assert that the current user is operating within their region scope.
 * Use this for record-specific checks (e.g., before updating a specific merchant).
 *
 * @param req     - NestJS request
 * @param region  - The region of the target record
 */
export function assertRegionScope(req: any, region: string | null | undefined): void {
  const role = getAdminRole(req);
  if (role !== "regional_manager") return; // other roles have no restriction

  const myRegion = getRegionId(req);
  if (!myRegion) {
    throw new ForbiddenException("No region assigned to this Regional Manager account");
  }

  if (region && region !== myRegion) {
    throw new ForbiddenException(
      `Access denied: this record belongs to region "${region}" but you are scoped to "${myRegion}"`,
    );
  }
}
