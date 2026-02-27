/**
 * @RequiresPermission() decorator
 *
 * Use for granular permission checks beyond role-level access.
 * Enforced by PermissionsGuard.
 *
 * Usage:
 *   @UseGuards(SupabaseGuard, RolesGuard, PermissionsGuard)
 *   @Roles(...Permissions.ADMIN)
 *   @RequiresPermission("kyc:approve")
 *   async approveKyc(...) {}
 */

import { SetMetadata } from "@nestjs/common";

export const PERMISSIONS_KEY = "required_permissions";

export const RequiresPermission = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
