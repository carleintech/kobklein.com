import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { prisma } from "../db/prisma";
import { toLang } from "../i18n/render";

const VALID_LANGS = ["en", "fr", "ht", "es"] as const;

@Controller("v1/profile")
export class ProfileController {
  /**
   * Set the user's preferred language.
   *
   * POST /v1/profile/lang
   * Body: { lang: "ht" }
   */
  @UseGuards(SupabaseGuard)
  @Post("lang")
  async setLang(
    @Req() req: any,
    @Body() body: { lang: string },
  ) {
    const userId = req.localUser?.id || req.user?.sub;

    const lang = toLang(body.lang);

    await prisma.user.update({
      where: { id: userId },
      data: { preferredLang: lang },
    });

    return { ok: true, preferredLang: lang };
  }

  /**
   * Get the user's preferred language.
   *
   * GET /v1/profile/lang
   */
  @UseGuards(SupabaseGuard)
  @Get("lang")
  async getLang(@Req() req: any) {
    const userId = req.localUser?.id || req.user?.sub;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferredLang: true },
    });

    return {
      ok: true,
      preferredLang: user?.preferredLang || "en",
      supported: VALID_LANGS,
    };
  }
}
