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

    // Read role from namespaced custom claim or fallback to direct claim
    const role =
      user?.["https://kobklein.com/role"] ||
      user?.role;

    if (!role) throw new ForbiddenException("No role in token");
    if (!roles.includes(role)) throw new ForbiddenException("Insufficient role");

    return true;
  }
}
