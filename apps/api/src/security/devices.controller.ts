import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Body,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Auth0Guard } from "../auth/auth0.guard";
import {
  getUserDevices,
  trustDevice,
  labelDevice,
  revokeDevice,
} from "./device.service";

@Controller("devices")
export class DevicesController {
  /**
   * GET /devices — List the authenticated user's active devices
   */
  @UseGuards(Auth0Guard)
  @Get()
  async list(@Req() req: any) {
    const userId = req.localUser?.id || req.user?.sub;
    const devices = await getUserDevices(userId);
    return { devices };
  }

  /**
   * PATCH /devices/:id/trust — Mark a device as trusted (skip step-up OTP)
   */
  @UseGuards(Auth0Guard)
  @Patch(":id/trust")
  async trust(@Req() req: any, @Param("id") id: string) {
    const userId = req.localUser?.id || req.user?.sub;
    await trustDevice(userId, id);
    return { ok: true };
  }

  /**
   * PATCH /devices/:id/label — Rename a device
   */
  @UseGuards(Auth0Guard)
  @Patch(":id/label")
  async label(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: { label: string },
  ) {
    const userId = req.localUser?.id || req.user?.sub;
    await labelDevice(userId, id, body.label);
    return { ok: true };
  }

  /**
   * DELETE /devices/:id — Revoke a device (soft delete)
   */
  @UseGuards(Auth0Guard)
  @Delete(":id")
  async revoke(@Req() req: any, @Param("id") id: string) {
    const userId = req.localUser?.id || req.user?.sub;
    await revokeDevice(userId, id);
    return { ok: true };
  }
}
