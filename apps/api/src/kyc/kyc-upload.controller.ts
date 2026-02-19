/**
 * KYC File Upload Controller
 *
 * Handles multipart file uploads for KYC verification documents.
 * Files are stored in Supabase Storage, URLs saved to KycProfile.
 *
 * POST /v1/kyc/upload/document — Upload ID document
 * POST /v1/kyc/upload/selfie   — Upload selfie
 * POST /v1/kyc/upload/address  — Upload address proof
 */
import {
  Controller,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { prisma } from "../db/prisma";
import { uploadKycDocument } from "../storage/storage.service";
import { AuditService } from "../audit/audit.service";

@Controller("v1/kyc/upload")
@UseGuards(SupabaseGuard)
export class KycUploadController {
  constructor(private auditService: AuditService) {}

  /**
   * POST /v1/kyc/upload/document
   *
   * Multipart form: field "file" = the ID document image/PDF
   * Updates KycProfile.documentUrl
   */
  @Post("document")
  async uploadDocument(@Req() req: any, @Res() res: any) {
    return this.handleUpload(req, res, "id_document", "documentUrl");
  }

  /**
   * POST /v1/kyc/upload/selfie
   *
   * Multipart form: field "file" = selfie image
   * Updates KycProfile.selfieUrl
   */
  @Post("selfie")
  async uploadSelfie(@Req() req: any, @Res() res: any) {
    return this.handleUpload(req, res, "selfie", "selfieUrl");
  }

  /**
   * POST /v1/kyc/upload/address
   *
   * Multipart form: field "file" = address proof document
   * Updates KycProfile.addressProof
   */
  @Post("address")
  async uploadAddress(@Req() req: any, @Res() res: any) {
    return this.handleUpload(req, res, "address_proof", "addressProof");
  }

  // ── Internal ─────────────────────────────────────────────

  private async handleUpload(
    req: any,
    res: any,
    docType: string,
    profileField: string,
  ) {
    const userId = req.localUser?.id || req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      // ── Parse multipart body ──────────────────────────────
      // NestJS on Express uses body-parser by default, but for
      // file uploads we read the raw buffer from the Express request.
      // The client should send a multipart/form-data with field "file".
      const chunks: Buffer[] = [];
      let filename = "upload";
      let mimeType = "application/octet-stream";

      // Check if Express parsed a file via built-in middleware
      if (req.file) {
        // If using multer or similar middleware
        const url = await uploadKycDocument(
          userId,
          docType,
          req.file.buffer,
          req.file.originalname || "upload",
          req.file.mimetype || "application/octet-stream",
        );

        await this.saveUrlToProfile(userId, profileField, url);
        await this.logUpload(userId, docType);

        return res.json({ ok: true, url });
      }

      // Fallback: Accept base64 JSON body
      // { "file": "data:image/jpeg;base64,...", "filename": "id.jpg" }
      if (req.body?.file && typeof req.body.file === "string") {
        const matches = req.body.file.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          const buffer = Buffer.from(matches[2], "base64");
          filename = req.body.filename || `${docType}.${mimeType.split("/")[1] || "bin"}`;

          const url = await uploadKycDocument(userId, docType, buffer, filename, mimeType);
          await this.saveUrlToProfile(userId, profileField, url);
          await this.logUpload(userId, docType);

          return res.json({ ok: true, url });
        }
      }

      // If a URL is provided directly (mobile app may upload to CDN first)
      if (req.body?.url && typeof req.body.url === "string") {
        await this.saveUrlToProfile(userId, profileField, req.body.url);
        await this.logUpload(userId, docType);

        return res.json({ ok: true, url: req.body.url });
      }

      return res.status(400).json({
        error: "No file provided. Send multipart file, base64 data URI, or URL.",
      });
    } catch (err: any) {
      console.error(`[KYC-UPLOAD] Failed:`, err.message);
      return res.status(400).json({ error: err.message });
    }
  }

  private async saveUrlToProfile(
    userId: string,
    field: string,
    url: string,
  ) {
    await prisma.kycProfile.upsert({
      where: { userId },
      update: { [field]: url },
      create: { userId, [field]: url },
    });
  }

  private async logUpload(userId: string, docType: string) {
    await this.auditService.logFinancialAction({
      actorUserId: userId,
      eventType: "kyc_document_uploaded",
      meta: { docType },
    });
  }
}
