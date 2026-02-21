import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { SupabaseGuard } from "../auth/supabase.guard";
import { Roles } from "../policies/roles.decorator";
import { RolesGuard } from "../policies/roles.guard";

@Controller("admin/audit")
export class AuditAdminController {
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Get()
  async list(@Query("take") take = "50") {
    return prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: Math.min(Number(take), 200),
      include: {
        // Safe joins (server-side only, admin-only endpoint)
        actorUser: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
  }
}
