import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { RolesGuard } from "../policies/roles.guard";
import { Roles } from "../policies/roles.decorator";
import { prisma } from "../db/prisma";

const VALID_CATEGORIES = ["general", "payment", "kyc", "account", "technical", "other"];
const VALID_PRIORITIES = ["low", "normal", "high", "urgent"];

/**
 * Support Tickets — user-facing
 * POST   /v1/support/tickets           — create ticket
 * GET    /v1/support/tickets           — list my tickets
 * GET    /v1/support/tickets/:id       — get single ticket
 *
 * Admin
 * GET    /v1/support/admin/tickets     — list all tickets
 * PATCH  /v1/support/admin/tickets/:id — resolve / update
 */
@Controller("v1/support")
export class SupportController {
  // ─── User endpoints ────────────────────────────────────────────────────────

  @UseGuards(SupabaseGuard)
  @Post("tickets")
  async createTicket(
    @Req() req: any,
    @Body() body: { subject: string; body: string; category?: string; priority?: string },
  ) {
    const userId = req.localUser?.id;
    const category = VALID_CATEGORIES.includes(body.category ?? "") ? body.category! : "general";
    const priority = VALID_PRIORITIES.includes(body.priority ?? "") ? body.priority! : "normal";

    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        subject: body.subject?.trim().slice(0, 200) || "Support Request",
        body: body.body?.trim().slice(0, 4000) || "",
        category,
        priority,
      },
      select: {
        id: true,
        subject: true,
        category: true,
        priority: true,
        status: true,
        createdAt: true,
      },
    });

    return { ok: true, ticket };
  }

  @UseGuards(SupabaseGuard)
  @Get("tickets")
  async myTickets(@Req() req: any) {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: req.localUser?.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        subject: true,
        category: true,
        priority: true,
        status: true,
        agentNotes: true,
        resolvedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return { ok: true, tickets };
  }

  @UseGuards(SupabaseGuard)
  @Get("tickets/:id")
  async getTicket(@Req() req: any, @Param("id") id: string) {
    const ticket = await prisma.supportTicket.findFirst({
      where: { id, userId: req.localUser?.id },
    });
    if (!ticket) throw new NotFoundException("Ticket not found");
    return { ok: true, ticket };
  }

  // ─── Admin endpoints ────────────────────────────────────────────────────────

  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Get("admin/tickets")
  async adminList(
    @Query("status") status?: string,
    @Query("priority") priority?: string,
    @Query("take") take = "50",
    @Query("skip") skip = "0",
  ) {
    const where: Record<string, unknown> = {};
    if (status && status !== "all") where.status = status;
    if (priority && priority !== "all") where.priority = priority;

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: Math.min(Number(take), 200),
        skip: Number(skip),
        include: {
          user: {
            select: { id: true, kId: true, firstName: true, lastName: true, email: true, phone: true },
          },
        },
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return { ok: true, tickets, total };
  }

  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Patch("admin/tickets/:id")
  async adminUpdate(
    @Param("id") id: string,
    @Body() body: { status?: string; agentNotes?: string; priority?: string },
  ) {
    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException("Ticket not found");

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(body.agentNotes !== undefined ? { agentNotes: body.agentNotes } : {}),
        ...(body.priority ? { priority: body.priority } : {}),
        ...(body.status === "resolved" ? { resolvedAt: new Date() } : {}),
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    return { ok: true, ticket: updated };
  }

  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Get("admin/stats")
  async adminStats() {
    const [open, inProgress, resolved, urgent] = await Promise.all([
      prisma.supportTicket.count({ where: { status: "open" } }),
      prisma.supportTicket.count({ where: { status: "in_progress" } }),
      prisma.supportTicket.count({ where: { status: "resolved" } }),
      prisma.supportTicket.count({ where: { status: { in: ["open", "in_progress"] }, priority: "urgent" } }),
    ]);
    return { open, inProgress, resolved, urgent, total: open + inProgress + resolved };
  }
}
