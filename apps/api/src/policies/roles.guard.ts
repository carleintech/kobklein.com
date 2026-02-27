import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "./roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    if (!roles || roles.length === 0) return true;

    const req = ctx.switchToHttp().getRequest();
    const user = req.user;

    // Read role from Supabase user_metadata, local DB user, or Auth0 namespaced claims.
    // admin_role is checked before role so Auth0 admin sub-roles work correctly.
    const role =
      user?.user_metadata?.role ||
      req.localUser?.role ||
      user?.["https://kobklein.com/admin_role"] ||
      user?.["https://kobklein.com/role"] ||
      user?.role;

    if (!role) throw new ForbiddenException("No role in token");

    // All admin sub-roles satisfy @Roles("admin") so any authenticated admin
    // can reach endpoints that only require "admin" access level.
    const ADMIN_FAMILY = new Set([
      "admin",
      "super_admin",
      "regional_manager",
      "support_agent",
      "compliance_officer",
      "treasury_officer",
      "hr_manager",
      "investor",
      "auditor",
      "broadcaster",
    ]);
    if (roles.includes("admin") && ADMIN_FAMILY.has(role)) return true;

    if (!roles.includes(role)) throw new ForbiddenException("Insufficient role");

    return true;
  }
}
