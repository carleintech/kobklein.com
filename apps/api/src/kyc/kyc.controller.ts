import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { SupabaseGuard } from "../auth/supabase.guard";
import { Roles } from "../policies/roles.decorator";
import { RolesGuard } from "../policies/roles.guard";
import { AuditService } from "../audit/audit.service";
import { createNotification } from "../notifications/notification.service";
import { supabaseAdmin } from "../lib/supabase-admin";

@Controller("v1/kyc")
export class KycController {
  constructor(private auditService: AuditService) {}

  /**
   * Level 1: Submit basic identity info (name, DOB, country, address).
   */
  @UseGuards(SupabaseGuard)
  @Post("level1")
  async submitLevel1(
    @Req() req: any,
    @Body() body: {
      fullName: string;
      dob: string;
      country: string;
      address?: string;
    },
  ) {
    const userId = req.localUser?.id || req.user?.sub;

    await prisma.kycProfile.upsert({
      where: { userId },
      update: {
        fullName: body.fullName,
        dob: new Date(body.dob),
        country: body.country,
        address: body.address,
        submittedAt: new Date(),
      },
      create: {
        userId,
        fullName: body.fullName,
        dob: new Date(body.dob),
        country: body.country,
        address: body.address,
        submittedAt: new Date(),
      },
    });

    // Upgrade to tier 1 immediately (no review needed for basic info)
    await prisma.user.update({
      where: { id: userId },
      data: { kycTier: 1, kycStatus: "pending" },
    });

    await this.auditService.logFinancialAction({
      actorUserId: userId,
      eventType: "kyc_level1_submitted",
    });

    return { ok: true, kycTier: 1 };
  }

  /**
   * Level 2: Submit ID document + selfie for full verification.
   */
  @UseGuards(SupabaseGuard)
  @Post("level2")
  async submitLevel2(
    @Req() req: any,
    @Body() body: {
      documentType: string;
      idNumber?: string;
      documentUrl: string;
      selfieUrl?: string;
    },
  ) {
    const userId = req.localUser?.id || req.user?.sub;

    await prisma.kycProfile.upsert({
      where: { userId },
      update: {
        documentType: body.documentType,
        idNumber: body.idNumber,
        documentUrl: body.documentUrl,
        selfieUrl: body.selfieUrl,
        submittedAt: new Date(),
      },
      create: {
        userId,
        documentType: body.documentType,
        idNumber: body.idNumber,
        documentUrl: body.documentUrl,
        selfieUrl: body.selfieUrl,
        submittedAt: new Date(),
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { kycStatus: "pending" },
    });

    await this.auditService.logFinancialAction({
      actorUserId: userId,
      eventType: "kyc_level2_submitted",
    });

    return { ok: true, status: "pending_review" };
  }

  /**
   * Get my KYC status — includes document upload URLs for the verify page.
   */
  @UseGuards(SupabaseGuard)
  @Get("status")
  async status(@Req() req: any) {
    const userId = req.localUser?.id || req.user?.sub;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { kycTier: true, kycStatus: true },
    });

    const profile = await prisma.kycProfile.findUnique({
      where: { userId },
      select: {
        fullName: true,
        country: true,
        documentType: true,
        documentUrl: true,
        selfieUrl: true,
        addressProof: true,
        submittedAt: true,
        reviewedAt: true,
        rejectionReason: true,
      },
    });

    return {
      ...user,
      documentUrl: profile?.documentUrl ?? null,
      selfieUrl: profile?.selfieUrl ?? null,
      addressProof: profile?.addressProof ?? null,
      profile,
    };
  }

  // ── KYC Document Upload Endpoints ──────────────────────────────────────────

  /**
   * Upload government ID document to Supabase Storage.
   * Also triggers Level 2 submission once document + selfie are both uploaded.
   */
  @UseGuards(SupabaseGuard)
  @Post("upload/document")
  async uploadDocument(
    @Req() req: any,
    @Body() body: { file: string; documentType?: string; idNumber?: string },
  ) {
    return this.handleUpload(req.localUser?.id || req.user?.sub, "document", body.file, {
      documentType: body.documentType,
      idNumber: body.idNumber,
    });
  }

  /**
   * Upload selfie to Supabase Storage.
   * Also triggers Level 2 submission once document + selfie are both uploaded.
   */
  @UseGuards(SupabaseGuard)
  @Post("upload/selfie")
  async uploadSelfie(
    @Req() req: any,
    @Body() body: { file: string },
  ) {
    return this.handleUpload(req.localUser?.id || req.user?.sub, "selfie", body.file);
  }

  /**
   * Upload address proof to Supabase Storage.
   */
  @UseGuards(SupabaseGuard)
  @Post("upload/address")
  async uploadAddress(
    @Req() req: any,
    @Body() body: { file: string },
  ) {
    return this.handleUpload(req.localUser?.id || req.user?.sub, "address", body.file);
  }

  // ── Private helper ──────────────────────────────────────────────────────────

  private async handleUpload(
    userId: string,
    step: "document" | "selfie" | "address",
    dataUri: string,
    extra?: { documentType?: string; idNumber?: string },
  ) {
    if (!dataUri || !dataUri.includes(",")) {
      throw new BadRequestException("Invalid file data");
    }

    // Parse base64 data URI  →  data:<mime>;base64,<data>
    const [prefix, base64Data] = dataUri.split(",");
    const mimeMatch = prefix.match(/data:([^;]+)/);
    const mime = mimeMatch?.[1] ?? "application/octet-stream";
    const ext = mime.split("/")[1]?.replace("jpeg", "jpg") ?? "bin";
    const buffer = Buffer.from(base64Data, "base64");

    const path = `kyc/${userId}/${step}_${Date.now()}.${ext}`;

    const { error } = await supabaseAdmin.storage
      .from("kyc-documents")
      .upload(path, buffer, { contentType: mime, upsert: true });

    if (error) throw new BadRequestException(`Storage upload failed: ${error.message}`);

    // Persist path to KycProfile
    const updateData: Record<string, string | undefined> = {};
    if (step === "document") {
      updateData.documentUrl = path;
      if (extra?.documentType) updateData.documentType = extra.documentType;
      if (extra?.idNumber) updateData.idNumber = extra.idNumber;
    } else if (step === "selfie") {
      updateData.selfieUrl = path;
    } else {
      updateData.addressProof = path;
    }

    await prisma.kycProfile.upsert({
      where: { userId },
      update: { ...updateData, submittedAt: new Date() },
      create: { userId, ...updateData, submittedAt: new Date() },
    });

    // Auto-submit Level 2 when both document + selfie are uploaded
    const profile = await prisma.kycProfile.findUnique({
      where: { userId },
      select: { documentUrl: true, selfieUrl: true },
    });
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { kycStatus: true, kycTier: true },
    });

    if (profile?.documentUrl && profile?.selfieUrl && user?.kycStatus !== "pending" && user?.kycStatus !== "approved") {
      await prisma.user.update({
        where: { id: userId },
        data: { kycStatus: "pending" },
      });
      await this.auditService.logFinancialAction({
        actorUserId: userId,
        eventType: "kyc_level2_submitted",
      });
    }

    // Return refreshed status
    const updated = await prisma.user.findUnique({
      where: { id: userId },
      select: { kycTier: true, kycStatus: true },
    });
    const updatedProfile = await prisma.kycProfile.findUnique({
      where: { userId },
      select: { documentUrl: true, selfieUrl: true, addressProof: true },
    });

    return {
      ok: true,
      kycTier: updated?.kycTier ?? 0,
      kycStatus: updated?.kycStatus ?? "none",
      documentUrl: updatedProfile?.documentUrl ?? null,
      selfieUrl: updatedProfile?.selfieUrl ?? null,
      addressProof: updatedProfile?.addressProof ?? null,
    };
  }

  // ── Admin Review Endpoints ──────────────────────────────────

  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Get("admin/pending")
  async pendingReviews() {
    return prisma.kycProfile.findMany({
      where: {
        user: { kycStatus: "pending" },
      },
      include: {
        user: {
          select: { id: true, firstName: true, phone: true, kycTier: true, kycStatus: true },
        },
      },
      orderBy: { submittedAt: "asc" },
      take: 50,
    });
  }

  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Patch("admin/:userId/approve")
  async approve(@Req() req: any, @Param("userId") userId: string) {
    const adminId = req.localUser?.id;

    await prisma.kycProfile.update({
      where: { userId },
      data: { reviewedAt: new Date(), reviewedBy: adminId },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { kycTier: 2, kycStatus: "approved" },
    });

    await createNotification(
      userId,
      "Account Verified",
      "Your identity has been verified. Your limits have been increased.",
      "system",
    );

    await this.auditService.logFinancialAction({
      actorUserId: adminId,
      eventType: "kyc_approved",
      referenceId: userId,
    });

    return { ok: true };
  }

  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Patch("admin/:userId/reject")
  async reject(
    @Req() req: any,
    @Param("userId") userId: string,
    @Body() body: { reason: string },
  ) {
    const adminId = req.localUser?.id;

    await prisma.kycProfile.update({
      where: { userId },
      data: {
        reviewedAt: new Date(),
        reviewedBy: adminId,
        rejectionReason: body.reason,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { kycStatus: "rejected" },
    });

    await createNotification(
      userId,
      "Verification Update",
      "Your identity verification needs more information. Please check and resubmit.",
      "system",
    );

    await this.auditService.logFinancialAction({
      actorUserId: adminId,
      eventType: "kyc_rejected",
      referenceId: userId,
      meta: { reason: body.reason },
    });

    return { ok: true };
  }
}
