import { Controller, Get, Param, Query, Req, UseGuards } from "@nestjs/common";
import { pool } from "../db/pool";
import { SupabaseGuard } from "../auth/supabase.guard";
import { getWalletTimeline } from "./timeline.service";

@Controller("v1")
export class TimelineController {
  @UseGuards(SupabaseGuard)
  @Get("wallets/:walletId/timeline")
  async timeline(
    @Req() req: any,
    @Param("walletId") walletId: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    const userId = req.localUser?.id;
    if (!userId) throw new Error("Missing local user");

    // Verify wallet belongs to user
    const walletCheck = await pool.query(
      `SELECT id FROM "Wallet" WHERE id = $1 AND "userId" = $2`, [walletId, userId]
    );
    if (walletCheck.rows.length === 0) throw new Error("Wallet not found or access denied");

    return getWalletTimeline(walletId, Number(limit) || 50, Number(offset) || 0);
  }
}
