import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { Auth0Guard } from "../auth/auth0.guard";
import { Roles } from "../policies/roles.decorator";
import { RolesGuard } from "../policies/roles.guard";

@Controller("admin/audit")
export class AdminAuditController {
  @UseGuards(Auth0Guard, RolesGuard)
  @Roles("admin")
  @Get()
  async list(@Query("take") take = "50") {
    return prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: Math.min(Number(take), 200),
    });
  }
}