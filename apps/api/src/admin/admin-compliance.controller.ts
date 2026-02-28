import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { RolesGuard } from "../policies/roles.guard";
import { Roles } from "../policies/roles.decorator";
import { prisma } from "../db/prisma";
// evaluateKycTier removed — tier is now determined by document presence (not volume)
import { screenUser, getScreeningHistory } from "../compliance/sanctions.service";
import { createNotification } from "../notifications/notification.service";
import { renderTemplate, toLang } from "../i18n/render";

@Controller("v1/admin/compliance")
@UseGuards(SupabaseGuard, RolesGuard)
@Roles("admin")
export class AdminComplianceController {
  // ─── Compliance Cases ───────────────────────────────────────

  /**
   * GET /v1/admin/compliance/cases — List compliance-flagged cases
   */
  @Get("cases")
  async listCases(@Query("status") status?: string) {
    const where: any = { caseType: "compliance_flag" };
    if (status) where.status = status;

    const cases = await prisma.case.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        messages: { take: 1, orderBy: { createdAt: "desc" } },
        actions: { take: 1, orderBy: { createdAt: "desc" } },
      },
    });

    const total = await prisma.case.count({ where });
    const open = await prisma.case.count({
      where: { ...where, status: "open" },
    });

    return { cases, total, open };
  }

  /**
   * GET /v1/admin/compliance/cases/:id — Case detail
   */
  @Get("cases/:id")
  async getCase(@Param("id") id: string) {
    const c = await prisma.case.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        actions: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!c) throw new Error("Case not found");

    // Get the user info if reporterUserId is available
    let User: any = null;
    if (c.reporterUserId && c.reporterUserId !== "system") {
      User = await prisma.user.findUnique({
        where: { id: c.reporterUserId },
        select: {
          id: true,
          kId: true,
          firstName: true,
          lastName: true,
          phone: true,
          kycTier: true,
          isFrozen: true,
        },
      });
    }

    return { case: c, User };
  }

  /**
   * POST /v1/admin/compliance/cases/:id/resolve — Resolve a compliance case
   */
  @Post("cases/:id/resolve")
  async resolveCase(
    @Param("id") id: string,
    @Body() body: { resolution: "clear" | "escalate" | "freeze"; note?: string },
  ) {
    const c = await prisma.case.findUnique({ where: { id } });
    if (!c) throw new Error("Case not found");

    let newStatus = "resolved";
    if (body.resolution === "escalate") newStatus = "investigating";

    await prisma.case.update({
      where: { id },
      data: {
        status: newStatus,
        closedAt: body.resolution === "clear" ? new Date() : undefined,
      },
    });

    // Log action
    await prisma.caseAction.create({
      data: {
        caseId: id,
        actorUserId: "admin",
        actionType: body.resolution,
        meta: { note: body.note || `Case ${body.resolution}` },
      },
    });

    // If freezing, freeze the reported user
    if (body.resolution === "freeze" && c.reporterUserId && c.reporterUserId !== "system") {
      // Try to find the actual target user from the description
      // For now, we skip auto-freeze — admin should do it manually via Users page
    }

    return { ok: true, status: newStatus };
  }

  // ─── KYC Management ────────────────────────────────────────

  /**
   * GET /v1/admin/compliance/kyc-pending — Users with pending KYC
   */
  @Get("kyc-pending")
  async kycPending() {
    const profiles = await prisma.kycProfile.findMany({
      where: {
        user: { kycStatus: "pending" },
      },
      include: {
        user: {
          select: {
            id: true,
            kId: true,
            firstName: true,
            lastName: true,
            phone: true,
            kycTier: true,
            kycStatus: true,
          },
        },
      },
      orderBy: { submittedAt: "asc" },
      take: 100,
    });

    return { profiles };
  }

  /**
   * POST /v1/admin/compliance/kyc/:userId/approve — Approve KYC
   *
   * Tier logic:
   *  - Caller can pass body.tier to explicitly set the tier.
   *  - Otherwise: if the user has submitted both a document + selfie (full KYC),
   *    approve at Tier 2 (the standard verified tier).
   *  - If only Level-1 info was submitted (no documents), approve at Tier 1.
   *  - evaluateKycTier() computes based on TRANSACTION VOLUME which is $0 for
   *    new users — so we never use it to downgrade an admin's manual approval.
   */
  @Post("kyc/:userId/approve")
  async approveKyc(
    @Param("userId") userId: string,
    @Body() body: { tier?: number },
  ) {
    // Determine the correct tier from the KYC profile documents
    const kycProfile = await prisma.kycProfile.findUnique({
      where: { userId },
      select: { documentUrl: true, selfieUrl: true, addressProof: true },
    });

    let newTier: number;
    if (body.tier !== undefined) {
      // Admin explicitly passed the desired tier
      newTier = body.tier;
    } else if (kycProfile?.documentUrl && kycProfile?.selfieUrl) {
      // Full document review — upgrade to Tier 2 (Verified)
      newTier = kycProfile.addressProof ? 3 : 2;
    } else {
      // Only Level-1 info submitted — Tier 1
      newTier = 1;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: "approved",
        kycTier: newTier,
      },
    });

    await prisma.kycProfile.update({
      where: { userId },
      data: {
        reviewedAt: new Date(),
        reviewedBy: "admin",
      },
    });

    // Notify user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferredLang: true },
    });
    const lang = toLang(user?.preferredLang);
    const msg = renderTemplate("kyc_approved", lang, {});
    await createNotification(userId, msg.title, msg.body, "system");

    return { ok: true, tier: newTier };
  }

  /**
   * POST /v1/admin/compliance/kyc/:userId/reject — Reject KYC
   */
  @Post("kyc/:userId/reject")
  async rejectKyc(
    @Param("userId") userId: string,
    @Body() body: { reason: string },
  ) {
    await prisma.user.update({
      where: { id: userId },
      data: { kycStatus: "rejected" },
    });

    await prisma.kycProfile.update({
      where: { userId },
      data: {
        reviewedAt: new Date(),
        reviewedBy: "admin",
        rejectionReason: body.reason,
      },
    });

    // Notify user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferredLang: true },
    });
    const lang = toLang(user?.preferredLang);
    const msg = renderTemplate("kyc_rejected", lang, { reason: body.reason });
    await createNotification(userId, msg.title, msg.body, "system");

    return { ok: true };
  }

  // ─── Sanctions Screening ───────────────────────────────────

  /**
   * GET /v1/admin/compliance/sanctions/:userId — Screening history
   */
  @Get("sanctions/:userId")
  async sanctionsHistory(@Param("userId") userId: string) {
    const checks = await getScreeningHistory(userId);
    return { checks };
  }

  /**
   * POST /v1/admin/compliance/sanctions/:userId/screen — Trigger manual screen
   */
  @Post("sanctions/:userId/screen")
  async triggerScreen(@Param("userId") userId: string) {
    const result = await screenUser(userId);
    return { result };
  }

  // ─── Dashboard Stats ───────────────────────────────────────

  /**
   * GET /v1/admin/compliance/stats — Compliance dashboard stats
   */
  @Get("stats")
  async stats() {
    const [openCases, kycPending, resolvedToday] = await Promise.all([
      prisma.case.count({
        where: { caseType: "compliance_flag", status: "open" },
      }),
      prisma.user.count({
        where: { kycStatus: "pending" },
      }),
      prisma.case.count({
        where: {
          caseType: "compliance_flag",
          closedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

    return {
      openCases,
      kycPending,
      sanctionsAlerts: 0, // Phase 1: placeholder
      resolvedToday,
    };
  }
}
