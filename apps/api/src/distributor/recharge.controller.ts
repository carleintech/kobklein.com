/**
 * Distributor Recharge Controller — KobKlein API
 *
 * POST   /v1/distributor/recharge         — Submit recharge request
 * GET    /v1/distributor/recharges        — List my recharges
 * GET    /v1/admin/distributor/recharges  — List pending recharges (admin)
 * POST   /v1/admin/distributor/recharges/:id/approve — Approve
 * POST   /v1/admin/distributor/recharges/:id/reject  — Reject
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
import {
  requestRecharge,
  listRecharges,
  listPendingRecharges,
  approveRecharge,
  rejectRecharge,
} from "./recharge.service";
import { prisma } from "../db/prisma";

// ─── Distributor-Facing ──────────────────────────────────────────────

@Controller("v1/distributor")
export class DistributorRechargeController {
  @Post("recharge")
  async submit(@Req() req: any, @Body() body: any) {
    const userId = req.user?.sub;
    if (!userId) throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED);

    // Look up distributor record
    const distributor = await prisma.distributor.findUnique({
      where: { userId },
    });
    if (!distributor) {
      throw new HttpException("Not a distributor", HttpStatus.FORBIDDEN);
    }

    if (!body.amount || !body.method) {
      throw new HttpException("amount and method are required", HttpStatus.BAD_REQUEST);
    }

    const recharge = await requestRecharge({
      distributorId: distributor.id,
      amount: parseFloat(body.amount),
      currency: body.currency ?? "HTG",
      method: body.method,
      reference: body.reference,
      proofUrl: body.proofUrl,
    });

    return { ok: true, recharge };
  }

  @Get("recharges")
  async list(@Req() req: any, @Query("status") status?: string) {
    const userId = req.user?.sub;
    if (!userId) throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED);

    const distributor = await prisma.distributor.findUnique({
      where: { userId },
    });
    if (!distributor) {
      throw new HttpException("Not a distributor", HttpStatus.FORBIDDEN);
    }

    return listRecharges(distributor.id, { status });
  }
}

// ─── Admin ───────────────────────────────────────────────────────────

@Controller("v1/admin/distributor/recharges")
export class AdminRechargeController {
  @Get()
  async listAll(
    @Req() req: any,
    @Query("status") status?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    if (req.user?.role !== "admin") {
      throw new HttpException("Forbidden", HttpStatus.FORBIDDEN);
    }

    return listPendingRecharges({
      status,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  @Post(":id/approve")
  async approve(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: { note?: string },
  ) {
    if (req.user?.role !== "admin") {
      throw new HttpException("Forbidden", HttpStatus.FORBIDDEN);
    }

    try {
      const recharge = await approveRecharge(id, req.user.sub, body.note);
      return { ok: true, recharge };
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post(":id/reject")
  async reject(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: { note?: string },
  ) {
    if (req.user?.role !== "admin") {
      throw new HttpException("Forbidden", HttpStatus.FORBIDDEN);
    }

    try {
      const recharge = await rejectRecharge(id, req.user.sub, body.note);
      return { ok: true, recharge };
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }
}
