import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { Auth0Guard } from "../auth/auth0.guard";
import { RolesGuard } from "../policies/roles.guard";
import { Roles } from "../policies/roles.decorator";
import {
  getDevicesForUser,
  adminRevokeDevice,
  revokeAllDevices,
} from "../security/device.service";

@Controller("v1/admin/devices")
@UseGuards(Auth0Guard, RolesGuard)
@Roles("admin")
export class AdminDevicesController {
  /**
   * GET /v1/admin/devices/:userId — List all devices for a user (admin view)
   */
  @Get(":userId")
  async listForUser(@Param("userId") userId: string) {
    const devices = await getDevicesForUser(userId);
    return { devices };
  }

  /**
   * DELETE /v1/admin/devices/:id/revoke — Admin force-revoke a single device
   */
  @Delete(":id/revoke")
  async revokeOne(@Param("id") id: string) {
    await adminRevokeDevice(id);
    return { ok: true };
  }

  /**
   * POST /v1/admin/devices/revoke-all/:userId — Revoke all devices for a user
   */
  @Post("revoke-all/:userId")
  async revokeAll(@Param("userId") userId: string) {
    await revokeAllDevices(userId);
    return { ok: true, message: "All devices revoked" };
  }
}
