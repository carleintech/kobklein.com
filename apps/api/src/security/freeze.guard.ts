import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { prisma } from "../db/prisma";

@Injectable()
export class FreezeGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const userId = req.localUser?.id;

    if (!userId) return true;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isFrozen: true },
    });

    if (user?.isFrozen) {
      throw new Error("Account is frozen");
    }

    return true;
  }
}