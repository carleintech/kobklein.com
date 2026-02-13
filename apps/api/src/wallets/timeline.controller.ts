import { Controller, Get, Param, Query, Req, UseGuards } from "@nestjs/common";
import { pool } from "../db/pool";
import { Auth0Guard } from "../auth/auth0.guard";
import { getWalletTimeline } from "./timeline.service";
import { getBalance } from "./balance.service";

@Controller("v1")
export class TimelineController {
  @UseGuards(Auth0Guard)
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

  @UseGuards(Auth0Guard)
  @Get("wallets/balance")
  async balance(@Req() req: any) {
    const userId = req.localUser?.id;
    if (!userId) throw new Error("Missing local user");

    const walletsResult = await pool.query(
      `SELECT id, currency, type FROM "Wallet" WHERE "userId" = $1`, [userId]
    );

    const balances = await Promise.all(
      walletsResult.rows.map(async (w: any) => ({
        walletId: w.id,
        currency: w.currency,
        type: w.type,
        balance: await getBalance(w.id),
      }))
    );

    return { balances };
  }
}
