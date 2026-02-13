import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { Auth0Guard } from "./auth0.guard";
import { createOtp, verifyOtp } from "./otp.service";
import { prisma } from "../db/prisma";
import { enqueueSMS } from "../notifications/notification.service";
import { enqueueNotification } from "../notifications/notification.queue";
import { isDeviceTrusted } from "../security/device.service";
import { renderTemplate, toLang } from "../i18n/render";

const STEPUP_TTL_MS = 15 * 60 * 1000; // 15 minutes

@Controller("auth/stepup")
export class StepUpController {
  /**
   * POST /auth/stepup/request
   *
   * Initiates a step-up verification. If the user's device is trusted,
   * returns a token immediately (no OTP needed). Otherwise, sends an OTP
   * via SMS and optionally email.
   */
  @UseGuards(Auth0Guard)
  @Post("request")
  async request(
    @Req() req: any,
    @Body() body: { scope?: string },
  ) {
    const userId = req.localUser?.id || req.user?.sub;
    const scope = body.scope || "withdrawal";

    // Check if device is trusted → skip OTP
    const fingerprint = req.headers["x-device-id"] || req.headers["user-agent"];
    const ip = req.ip;

    if (fingerprint && ip) {
      const trusted = await isDeviceTrusted(userId, fingerprint, ip);
      if (trusted) {
        const token = await prisma.stepUpToken.create({
          data: {
            userId,
            scope,
            expiresAt: new Date(Date.now() + STEPUP_TTL_MS),
          },
        });
        return { ok: true, trusted: true, tokenId: token.id };
      }
    }

    // Load user for phone + email + language
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.phone) throw new Error("No phone number on file");

    const code = await createOtp(userId, "stepup", user.phone);
    const lang = toLang(user.preferredLang);
    const msg = renderTemplate("stepup_otp", lang, { code });

    // Send OTP via SMS
    await enqueueSMS(user.phone, msg.body);

    // Also send via email if user has one configured
    if (user.email) {
      const subjectMsg = renderTemplate("stepup_email_subject", lang, {});
      await enqueueNotification({
        channel: "email",
        to: user.email,
        body: `<h2>${subjectMsg.title}</h2><p>${msg.body}</p>`,
        type: "stepup_otp",
        data: { userId, scope },
        attempt: 0,
        userId,
      });
    }

    return { ok: true, trusted: false };
  }

  /**
   * POST /auth/stepup/verify
   *
   * Verifies the OTP code and issues a short-lived StepUpToken.
   * The client should pass this token in the `x-stepup-token` header
   * when making sensitive requests.
   */
  @UseGuards(Auth0Guard)
  @Post("verify")
  async verify(
    @Req() req: any,
    @Body() body: { code: string; scope?: string },
  ) {
    const userId = req.localUser?.id || req.user?.sub;
    const scope = body.scope || "withdrawal";

    await verifyOtp({ userId, code: body.code, purpose: "stepup" });

    const token = await prisma.stepUpToken.create({
      data: {
        userId,
        scope,
        expiresAt: new Date(Date.now() + STEPUP_TTL_MS),
      },
    });

    return { ok: true, tokenId: token.id, expiresAt: token.expiresAt };
  }
}
