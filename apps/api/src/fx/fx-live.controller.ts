import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { getActiveFxRateFull } from "./fx.service";

/**
 * GET /v1/fx/rates/live
 *
 * Returns the current live USD→HTG (or any configured pair) FX rate.
 * Used by client/diaspora dashboards to display the live rate card.
 * Requires auth (prevents public scraping of our rates).
 *
 * Query params:
 *   from=USD (default)
 *   to=HTG   (default)
 */
@Controller("v1/fx")
export class FxLiveController {
  @UseGuards(SupabaseGuard)
  @Get("rates/live")
  async liveRate(
    @Query("from") from = "USD",
    @Query("to")   to   = "HTG",
  ) {
    try {
      const rate = await getActiveFxRateFull(from.toUpperCase(), to.toUpperCase());
      return {
        ok: true,
        from: rate.fromCurrency,
        to:   rate.toCurrency,
        mid:  rate.mid,
        buy:  rate.buy,
        sell: rate.sell,
        spreadBps:  rate.spreadBps,
        source:     rate.source,
        updatedAt:  rate.createdAt,
      };
    } catch {
      // FX rate not configured — return null rate (graceful fallback)
      return {
        ok:   false,
        from,
        to,
        mid:  null,
        buy:  null,
        sell: null,
        updatedAt: null,
        message: "FX rate not configured",
      };
    }
  }
}
