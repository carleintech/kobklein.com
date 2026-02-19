import { Controller, Get, Query, Req } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { getActiveFxRate } from "../fx/fx.service";

type SupportedLang = "en" | "fr" | "ht" | "es";

@Controller("v1/kpay")
export class KpayCatalogController {
  /**
   * Public catalog — returns active items + plans with multilingual labels
   * and HTG estimate via active FX rate.
   *
   * Language detection: ?lang= param > Accept-Language header (via middleware) > "en"
   *
   * Usage: GET /v1/kpay/catalog?lang=ht
   */
  @Get("catalog")
  async catalog(@Req() req: any, @Query("lang") lang?: string) {
    const language = ((lang || req.lang || "en").toLowerCase()) as SupportedLang;

    let fxRate = 0;
    try {
      fxRate = await getActiveFxRate("USD", "HTG");
    } catch {
      // If no FX rate configured, return 0 estimate
    }

    const items = await prisma.subscriptionCatalogItem.findMany({
      where: { active: true },
      include: {
        SubscriptionPlan: {
          where: { active: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const mapped = items.map((item) => {
      const name =
        language === "fr"
          ? item.nameFr
          : language === "ht"
            ? item.nameHt
            : language === "es"
              ? item.nameEs
              : item.nameEn;

      const description =
        language === "fr"
          ? item.descFr
          : language === "ht"
            ? item.descHt
            : language === "es"
              ? item.descEs
              : item.descEn;

      return {
        id: item.id,
        merchantKey: item.merchantKey,
        category: item.category,
        name,
        description,
        SubscriptionPlan: item.SubscriptionPlan.map((plan) => ({
          id: plan.id,
          planKey: plan.planKey,
          interval: plan.interval,
          label:
            language === "fr"
              ? plan.labelFr
              : language === "ht"
                ? plan.labelHt
                : language === "es"
                  ? plan.labelEs
                  : plan.labelEn,
          amountUsd: Number(plan.amountUsd),
          estimatedHtg: fxRate > 0 ? Math.round(Number(plan.amountUsd) * fxRate * 100) / 100 : null,
        })),
      };
    });

    return {
      ok: true,
      fxRate: fxRate || null,
      currencyDisplay: {
        primary: "USD",
        secondary: "HTG",
      },
      items: mapped,
    };
  }
}
