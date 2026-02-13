import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { Auth0Guard } from "../auth/auth0.guard";
import { Roles } from "../policies/roles.decorator";
import { RolesGuard } from "../policies/roles.guard";

@Controller("v1/kcard")
export class CardWaitlistController {
  /**
   * Join the K-Card waitlist (public, no auth required for marketing).
   */
  @Post("waitlist")
  async joinWaitlist(
    @Body()
    body: {
      fullName: string;
      phone: string;
      city?: string;
      interest?: string;
    },
  ) {
    if (!body.fullName || !body.phone) {
      throw new Error("Name and phone are required");
    }

    const existing = await prisma.cardWaitlist.findUnique({
      where: { phone: body.phone },
    });

    if (existing) {
      return { ok: true, alreadyJoined: true, position: null };
    }

    await prisma.cardWaitlist.create({
      data: {
        fullName: body.fullName,
        phone: body.phone,
        city: body.city,
        interest: body.interest || "both",
      },
    });

    const count = await prisma.cardWaitlist.count();

    return { ok: true, alreadyJoined: false, position: count };
  }

  /**
   * Get waitlist count (public).
   */
  @Get("waitlist/count")
  async waitlistCount() {
    const count = await prisma.cardWaitlist.count();

    const byInterest = await prisma.cardWaitlist.groupBy({
      by: ["interest"],
      _count: { id: true },
    });

    return {
      total: count,
      breakdown: Object.fromEntries(
        byInterest.map((g) => [g.interest, g._count.id]),
      ),
    };
  }

  /**
   * Admin: View full waitlist.
   */
  @UseGuards(Auth0Guard, RolesGuard)
  @Roles("admin")
  @Get("waitlist/admin")
  async adminWaitlist() {
    return prisma.cardWaitlist.findMany({
      orderBy: { createdAt: "asc" },
      take: 500,
    });
  }
}
