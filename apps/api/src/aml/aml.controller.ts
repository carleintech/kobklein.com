/**
 * AML Controller — KobKlein API
 *
 * GET   /v1/admin/aml/flags       — List AML flags
 * GET   /v1/admin/aml/stats       — AML dashboard stats
 * POST  /v1/admin/aml/flags/:id/resolve — Resolve a flag
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { listFlags, resolveFlag, getAmlStats } from "./aml.service";

@Controller("v1/admin/aml")
export class AmlController {
  @Get("flags")
  async list(
    @Req() req: any,
    @Query("status") status?: string,
    @Query("severity") severity?: string,
    @Query("type") type?: string,
    @Query("userId") userId?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    if (req.user?.role !== "admin") {
      throw new HttpException("Forbidden", HttpStatus.FORBIDDEN);
    }

    return listFlags({
      status,
      severity,
      type,
      userId,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  @Get("stats")
  async stats(@Req() req: any) {
    if (req.user?.role !== "admin") {
      throw new HttpException("Forbidden", HttpStatus.FORBIDDEN);
    }

    return getAmlStats();
  }

  @Post("flags/:id/resolve")
  async resolve(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: { status: "resolved" | "false_positive" | "escalated"; note?: string },
  ) {
    if (req.user?.role !== "admin") {
      throw new HttpException("Forbidden", HttpStatus.FORBIDDEN);
    }

    if (!body.status) {
      throw new HttpException("status is required (resolved, false_positive, escalated)", HttpStatus.BAD_REQUEST);
    }

    try {
      const flag = await resolveFlag(id, req.user.sub, body.status, body.note);
      return { ok: true, flag };
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }
}
