import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { SupabaseGuard } from "../auth/supabase.guard";
import { getWalletTimeline } from "./timeline.service";

/**
 * GET /v1/wallets/timeline?limit=N&offset=N
 *
 * User-level timeline shortcut — no walletId required.
 * Automatically resolves the caller's primary USER wallet and
 * returns its timeline.  Designed for dashboard "recent activity" feeds.
 *
 * Response: { entries: TimelineEntry[], walletId: string }
 */
@Controller("v1/wallets")
@UseGuards(SupabaseGuard)
export class UserTimelineController {
  @Get("timeline")
  async userTimeline(
    @Req() req: any,
    @Query("limit")  limitParam?:  string,
    @Query("offset") offsetParam?: string,
  ) {
    const userId = req.localUser?.id || req.user?.sub;
    const limit  = Math.min(Math.max(parseInt(limitParam  ?? "20", 10), 1), 100);
    const offset = Math.max(parseInt(offsetParam ?? "0",  10), 0);

    // Find the caller's primary USER wallet
    const wallet = await prisma.wallet.findFirst({
      where: { userId, type: "USER" },
      select: { id: true, currency: true },
    });

    if (!wallet) {
      return { entries: [], walletId: null };
    }

    // getWalletTimeline returns pool.query().rows (plain array)
    const rows = await getWalletTimeline(wallet.id, limit, offset);
    return {
      walletId: wallet.id,
      currency: wallet.currency,
      entries:  rows,
    };
  }
}
