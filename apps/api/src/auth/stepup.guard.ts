import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { prisma } from "../db/prisma";
import { isDeviceTrusted } from "../security/device.service";

/**
 * StepUpGuard — Requires a valid step-up token for sensitive operations.
 *
 * Checks the `x-stepup-token` header for a valid, unexpired, unused StepUpToken.
 * If the user's current device is trusted, the guard passes without a token.
 *
 * On failure: returns 403 with code "STEPUP_REQUIRED" so the client can
 * prompt the user through the step-up OTP flow.
 */
@Injectable()
export class StepUpGuard implements CanActivate {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const userId = req.localUser?.id || req.user?.sub;

    if (!userId) {
      throw new ForbiddenException("Authentication required");
    }

    // ─── Trusted device bypass ──────────────────────────────
    const fingerprint = req.headers["x-device-id"] || req.headers["user-agent"];
    const ip = req.ip;

    if (fingerprint && ip) {
      const trusted = await isDeviceTrusted(userId, fingerprint, ip);
      if (trusted) return true;
    }

    // ─── Step-up token check ────────────────────────────────
    const tokenId = req.headers["x-stepup-token"];

    if (!tokenId) {
      throw new ForbiddenException({
        code: "STEPUP_REQUIRED",
        message: "Step-up verification required for this operation",
      });
    }

    const token = await prisma.stepUpToken.findUnique({
      where: { id: tokenId },
    });

    if (!token) {
      throw new ForbiddenException({
        code: "STEPUP_REQUIRED",
        message: "Invalid step-up token",
      });
    }

    if (token.userId !== userId) {
      throw new ForbiddenException({
        code: "STEPUP_REQUIRED",
        message: "Step-up token does not belong to this user",
      });
    }

    if (token.expiresAt < new Date()) {
      throw new ForbiddenException({
        code: "STEPUP_REQUIRED",
        message: "Step-up token expired",
      });
    }

    if (token.usedAt) {
      throw new ForbiddenException({
        code: "STEPUP_REQUIRED",
        message: "Step-up token already used",
      });
    }

    // Mark token as used (one-time use)
    await prisma.stepUpToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    });

    return true;
  }
}
