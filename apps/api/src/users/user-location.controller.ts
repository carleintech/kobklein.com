import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";

/**
 * POST /v1/users/location
 *
 * Accepts a geolocation signal from the client (app-shell.tsx fires this
 * silently on first page load).  Acknowledged-only for now — coordinates
 * are logged server-side for future fraud/risk-engine integration once a
 * dedicated UserLocation table is added to the schema.
 *
 * Body: { lat: number, lng: number }
 */
@Controller("v1/users")
@UseGuards(SupabaseGuard)
export class UserLocationController {
  @Post("location")
  setLocation(
    @Req() req: any,
    @Body() body: { lat?: number; lng?: number },
  ) {
    // Log for observability — no DB write until UserLocation table is added
    const userId = req.localUser?.id || req.user?.sub;
    if (userId && body.lat != null && body.lng != null) {
      console.debug(`[location] user=${userId} lat=${body.lat} lng=${body.lng}`);
    }
    return { ok: true };
  }
}
