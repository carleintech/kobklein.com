import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { PosDeviceService } from "./pos-device.service";

class RegisterPosDeviceDto {
  deviceFingerprint!: string;
  deviceLabel?: string;
  platform!: string; // web | ios | android
  agreementAcceptedAt!: string; // ISO timestamp of when user accepted agreement
}

/**
 * POS Device endpoints — Merchant & Distributor roles.
 *
 * Turn a merchant/distributor's phone into a KobKlein POS terminal.
 * V1: KobKlein-to-KobKlein NFC/QR payments only.
 *
 * Endpoints:
 *   POST   /v1/pos/devices/register    → Register this device as POS terminal
 *   GET    /v1/pos/devices/my          → List my active POS devices
 *   DELETE /v1/pos/devices/:id         → Revoke a POS device
 *   GET    /v1/pos/session/init        → Initialize payment session (NFC/QR payload)
 */
@Controller("v1/pos")
@UseGuards(SupabaseGuard)
export class PosDeviceController {
  constructor(private readonly posService: PosDeviceService) {}

  /**
   * POST /v1/pos/devices/register
   * Register the current device as an authorized POS terminal.
   * User must have accepted the POS agreement.
   *
   * Body: { deviceFingerprint, deviceLabel?, platform, agreementAcceptedAt }
   */
  @Post("devices/register")
  async register(@Req() req: any, @Body() body: RegisterPosDeviceDto) {
    const userId = req.localUser?.id || req.user?.sub;
    const role = req.localUser?.role || req.user?.role;
    return this.posService.registerDevice(userId, role, {
      deviceFingerprint: body.deviceFingerprint,
      deviceLabel: body.deviceLabel,
      platform: body.platform,
      agreementAcceptedAt: body.agreementAcceptedAt,
    });
  }

  /**
   * GET /v1/pos/devices/my
   * Returns all active POS devices for the current user.
   * Used by dashboard to show K-NFC icon state (active vs inactive).
   */
  @Get("devices/my")
  async myDevices(@Req() req: any) {
    const userId = req.localUser?.id || req.user?.sub;
    return this.posService.getMyDevices(userId);
  }

  /**
   * DELETE /v1/pos/devices/:id
   * Revoke (deactivate) a specific POS device.
   */
  @Delete("devices/:id")
  async revoke(@Req() req: any, @Param("id") deviceId: string) {
    const userId = req.localUser?.id || req.user?.sub;
    return this.posService.revokeDevice(userId, deviceId);
  }

  /**
   * GET /v1/pos/session/init
   * Initialize a POS payment session.
   * Returns a signed NFC URI and session token (15-min TTL).
   *
   * Query params: ?amount=150&currency=HTG (optional — for fixed-amount requests)
   */
  @Get("session/init")
  async initSession(
    @Req() req: any,
    @Query("amount") amount?: string,
    @Query("currency") currency?: string,
  ) {
    const userId = req.localUser?.id || req.user?.sub;
    return this.posService.initSession(
      userId,
      amount ? parseFloat(amount) : undefined,
      currency,
    );
  }
}
