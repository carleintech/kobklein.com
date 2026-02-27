/**
 * Distributor Commission Controller — KobKlein API
 *
 * GET /v1/distributor/commissions         — paginated history
 * GET /v1/distributor/commissions/summary — totals
 */
import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { prisma } from "../db/prisma";
import { getCommissionHistory, getCommissionSummary } from "./commission.service";

@Controller("v1/distributor/commissions")
@UseGuards(SupabaseGuard)
export class CommissionController {
  @Get("summary")
  async summary(@Req() req: any) {
    const userId = req.localUser?.id;
    if (!userId) throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED);

    const distributor = await prisma.distributor.findUnique({ where: { userId } });
    if (!distributor) throw new HttpException("Distributor record not found", HttpStatus.NOT_FOUND);

    return getCommissionSummary(distributor.id);
  }

  @Get()
  async history(@Req() req: any, @Query("page") pageStr = "1") {
    const userId = req.localUser?.id;
    if (!userId) throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED);

    const distributor = await prisma.distributor.findUnique({ where: { userId } });
    if (!distributor) throw new HttpException("Distributor record not found", HttpStatus.NOT_FOUND);

    const page = Math.max(1, parseInt(pageStr, 10) || 1);
    return getCommissionHistory(distributor.id, page);
  }
}
