/**
 * Push Token Controller — KobKlein API
 *
 * POST /v1/push/register   — Register or update push token
 * POST /v1/push/unregister — Deactivate a push token
 */
import { Controller, Post, Body, Req, HttpCode, HttpException, HttpStatus } from "@nestjs/common";
import { registerToken, deactivateToken } from "./push.service";

@Controller("v1/push")
export class PushController {
  @Post("register")
  @HttpCode(200)
  async register(
    @Req() req: any,
    @Body() body: { expoToken: string; platform: string },
  ) {
    const userId = req.user?.sub;
    if (!userId) throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED);

    if (!body.expoToken || !body.platform) {
      throw new HttpException("expoToken and platform are required", HttpStatus.BAD_REQUEST);
    }

    const result = await registerToken(userId, body.expoToken, body.platform);
    return { ok: true, tokenId: result.id };
  }

  @Post("unregister")
  @HttpCode(200)
  async unregister(
    @Req() req: any,
    @Body() body: { expoToken: string },
  ) {
    const userId = req.user?.sub;
    if (!userId) throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED);

    if (!body.expoToken) {
      throw new HttpException("expoToken is required", HttpStatus.BAD_REQUEST);
    }

    await deactivateToken(body.expoToken);
    return { ok: true };
  }
}
