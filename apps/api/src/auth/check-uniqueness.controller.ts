import { Controller, Get, Query } from "@nestjs/common";

/**
 * Public endpoint — no auth required.
 * Called from the signup form in real-time to tell the user whether
 * their email or phone number is already registered.
 *
 * GET /v1/auth/check?email=user@example.com
 * GET /v1/auth/check?phone=%2B15551234567
 * GET /v1/auth/check?email=x&phone=y
 *
 * Response: { emailTaken: boolean, phoneTaken: boolean }
 */
@Controller("v1/auth")
export class CheckUniquenessController {
  @Get("check")
  async checkUniqueness(
    @Query("email") email?: string,
    @Query("phone") phone?: string,
  ): Promise<{ emailTaken: boolean; phoneTaken: boolean }> {
    const { prisma } = await import("../db/prisma.js");

    const [emailTaken, phoneTaken] = await Promise.all([
      email?.trim()
        ? prisma.user.findFirst({ where: { email: email.trim().toLowerCase() }, select: { id: true } }).then(Boolean)
        : Promise.resolve(false),
      phone?.trim()
        ? prisma.user.findFirst({ where: { phone: phone.trim() }, select: { id: true } }).then(Boolean)
        : Promise.resolve(false),
    ]);

    return { emailTaken, phoneTaken };
  }
}
