/**
 * Push Token Controller — KobKlein API
 *
 * GET  /v1/push/vapid-public-key — return VAPID public key (no auth required)
 * POST /v1/push/register         — register Expo token OR web push subscription
 * POST /v1/push/unregister       — deactivate a push token
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  HttpCode,
  HttpException,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import {
  registerToken,
  deactivateToken,
  registerWebSubscription,
  type WebPushSubscription,
} from "./push.service";

@Controller("v1/push")
export class PushController {
  /** Public — no auth needed. Browser fetches this to set up push subscription. */
  @Get("vapid-public-key")
  vapidPublicKey() {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    if (!publicKey) {
      throw new HttpException("VAPID not configured", HttpStatus.SERVICE_UNAVAILABLE);
    }
    return { publicKey };
  }

  @Post("register")
  @HttpCode(200)
  @UseGuards(SupabaseGuard)
  async register(
    @Req() req: any,
    @Body() body: { expoToken?: string; webSubscription?: WebPushSubscription; platform: string },
  ) {
    const userId = req.localUser?.id ?? req.user?.sub;
    if (!userId) throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED);

    // Web push subscription (PWA)
    if (body.platform === "web" && body.webSubscription) {
      if (!body.webSubscription.endpoint || !body.webSubscription.keys) {
        throw new HttpException("Invalid web push subscription", HttpStatus.BAD_REQUEST);
      }
      const result = await registerWebSubscription(userId, body.webSubscription);
      return { ok: true, tokenId: result.id };
    }

    // Expo push token (mobile)
    if (!body.expoToken || !body.platform) {
      throw new HttpException("expoToken and platform are required", HttpStatus.BAD_REQUEST);
    }
    const result = await registerToken(userId, body.expoToken, body.platform);
    return { ok: true, tokenId: result.id };
  }

  @Post("unregister")
  @HttpCode(200)
  @UseGuards(SupabaseGuard)
  async unregister(
    @Req() req: any,
    @Body() body: { expoToken?: string; endpoint?: string },
  ) {
    const userId = req.localUser?.id ?? req.user?.sub;
    if (!userId) throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED);

    const token = body.expoToken ?? body.endpoint;
    if (!token) {
      throw new HttpException("expoToken or endpoint is required", HttpStatus.BAD_REQUEST);
    }

    await deactivateToken(token);
    return { ok: true };
  }
}
