import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { prisma } from "../db/prisma";
import { getActiveFxRate } from "../fx/fx.service";

type SupportedLang = "en" | "fr" | "ht" | "es";

@Controller("v1/kpay")
export class KpayMeController {
  /**
   * "My K-Pay" dashboard — returns all user subscriptions
   * with multilingual plan labels and HTG estimates.
   *
   * GET /v1/kpay/me?lang=ht
   */
  @UseGuards(SupabaseGuard)
  @Get("me")
  async mySubscriptions(@Req() req: any, @Query("lang") lang?: string) {
    const userId = req.localUser?.id || req.user?.sub;

    // Auto-detect language: ?lang= param > user's preferredLang > middleware > "en"
    let language: SupportedLang = "en";
    if (lang) {
      language = lang.toLowerCase() as SupportedLang;
    } else {
      // Try user's saved preference
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { preferredLang: true },
      });
      language = ((user?.preferredLang || req.lang || "en").toLowerCase()) as SupportedLang;
    }

    let fxRate = 0;
    try {
      fxRate = await getActiveFxRate("USD", "HTG");
    } catch {
      // No FX rate configured
    }

    const subs = await prisma.subscriptionProxy.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const enriched: Array<{
      id: string;
      merchant: string;
      label: string;
      externalAccountRef: string | null;
      amountUsd: number;
      estimatedHtg: number | null;
      interval: string;
      status: string;
      nextBilling: Date;
      lastCharged: Date | null;
      failureCount: number;
      createdAt: Date;
    }> = [];

    for (const sub of subs) {
      // Try to resolve plan info via meta.planKey
      let planLabel = sub.merchant;
      let interval = "monthly";

      const meta = sub.meta as Record<string, any> | null;
      if (meta?.planKey) {
        const plan = await prisma.subscriptionPlan.findUnique({
          where: { planKey: meta.planKey as string },
        });

        if (plan) {
          interval = plan.interval;

          planLabel =
            language === "fr"
              ? plan.labelFr
              : language === "ht"
                ? plan.labelHt
                : language === "es"
                  ? plan.labelEs
                  : plan.labelEn;
        }
      }

      enriched.push({
        id: sub.id,
        merchant: sub.merchant,
        label: planLabel,
        externalAccountRef: sub.externalAccountRef,
        amountUsd: Number(sub.amountUsd),
        estimatedHtg:
          fxRate > 0 ? Math.round(Number(sub.amountUsd) * fxRate * 100) / 100 : null,
        interval,
        status: sub.status,
        nextBilling: sub.nextBilling,
        lastCharged: sub.lastCharged,
        failureCount: sub.failureCount,
        createdAt: sub.createdAt,
      });
    }

    return {
      ok: true,
      fxRate: fxRate || null,
      currencyDisplay: {
        primary: "USD",
        secondary: "HTG",
      },
      items: enriched,
    };
  }
}
