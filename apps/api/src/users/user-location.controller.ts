import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { prisma } from "../db/prisma";

/**
 * POST /v1/users/location
 *
 * Soft-updates the authenticated user's last-known geolocation.
 * Called silently by app-shell.tsx on first load (no UI dependency).
 * Stores coordinates in user metadata JSON — used for fraud/risk signals only.
 *
 * Body: { lat: number, lng: number }
 */
@Controller("v1/users")
@UseGuards(SupabaseGuard)
export class UserLocationController {
  @Post("location")
  async setLocation(
    @Req() req: any,
    @Body() body: { lat?: number; lng?: number },
  ) {
    const userId = req.localUser?.id || req.user?.sub;
    if (!userId || body.lat == null || body.lng == null) {
      return { ok: false };
    }

    // Store as meta JSON — non-blocking, best-effort
    await prisma.user.update({
      where: { id: userId },
      data: {
        meta: {
          lastLat: body.lat,
          lastLng: body.lng,
          lastLocAt: new Date().toISOString(),
        } as any,
      },
    }).catch(() => {
      // Silently ignore if user doesn't exist or meta column differs
    });

    return { ok: true };
  }
}
