import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { SupabaseGuard } from "../auth/supabase.guard";
import { AuditService } from "../audit/audit.service";

const RESERVED_HANDLES = [
  "admin", "support", "kobklein", "api", "security", "bank",
  "help", "system", "root", "pay", "send", "receive", "wallet",
];

const HANDLE_REGEX = /^[a-z0-9_]{3,20}$/;

@Controller("v1/handles")
export class HandlesController {
  constructor(private auditService: AuditService) {}

  /**
   * Check if a handle is available.
   */
  @Get("check")
  async check(@Query("value") value: string) {
    if (!value) throw new Error("Handle value required");

    const normalized = value.toLowerCase().trim();

    if (!HANDLE_REGEX.test(normalized)) {
      return { available: false, reason: "Invalid format. Use 3-20 lowercase letters, numbers, or underscores." };
    }

    if (RESERVED_HANDLES.includes(normalized)) {
      return { available: false, reason: "This handle is reserved." };
    }

    const existing = await prisma.user.findFirst({
      where: { handle: normalized },
    });

    return { available: !existing };
  }

  /**
   * Set or update the user's handle.
   */
  @UseGuards(SupabaseGuard)
  @Post()
  async setHandle(
    @Req() req: any,
    @Body() body: { handle: string },
  ) {
    const userId = req.localUser?.id || req.user?.sub;
    const normalized = body.handle.toLowerCase().trim();

    if (!HANDLE_REGEX.test(normalized)) {
      throw new Error("Invalid handle format. Use 3-20 lowercase letters, numbers, or underscores.");
    }

    if (RESERVED_HANDLES.includes(normalized)) {
      throw new Error("This handle is reserved.");
    }

    // Check availability
    const existing = await prisma.user.findFirst({
      where: { handle: normalized, id: { not: userId } },
    });

    if (existing) {
      throw new Error("Handle already taken.");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { handle: normalized },
    });

    await this.auditService.logFinancialAction({
      actorUserId: userId,
      eventType: "handle_set",
      meta: { handle: normalized },
    });

    return { ok: true, handle: normalized };
  }
}
