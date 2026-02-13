/**
 * Seed K-Pay Catalog with subscription services.
 *
 * Usage: npx ts-node src/scripts/seed-kpay-catalog.ts
 *
 * Phase 49: Populates SubscriptionCatalogItem and SubscriptionPlan
 * with multilingual data (EN/FR/HT/ES).
 */
import { prisma } from "../db/prisma";

const catalog = [
  {
    merchantKey: "NETFLIX",
    category: "streaming",
    nameEn: "Netflix",
    nameFr: "Netflix",
    nameHt: "Netflix",
    nameEs: "Netflix",
    descEn: "Stream movies and TV shows worldwide.",
    descFr: "Regardez des films et séries en streaming.",
    descHt: "Gade fim ak seri sou entènèt.",
    descEs: "Transmite películas y series en todo el mundo.",
    plans: [
      { planKey: "NETFLIX_BASIC", amountUsd: 6.99, labelEn: "Basic with Ads", labelFr: "Essentiel avec pub", labelHt: "Debaz ak piblisite", labelEs: "Básico con anuncios" },
      { planKey: "NETFLIX_STANDARD", amountUsd: 15.49, labelEn: "Standard", labelFr: "Standard", labelHt: "Estanda", labelEs: "Estándar" },
      { planKey: "NETFLIX_PREMIUM", amountUsd: 22.99, labelEn: "Premium", labelFr: "Premium", labelHt: "Premyòm", labelEs: "Premium" },
    ],
  },
  {
    merchantKey: "SPOTIFY",
    category: "music",
    nameEn: "Spotify",
    nameFr: "Spotify",
    nameHt: "Spotify",
    nameEs: "Spotify",
    descEn: "Music streaming with millions of songs.",
    descFr: "Streaming musical avec des millions de chansons.",
    descHt: "Mizik an liy avèk plizyè milyon chante.",
    descEs: "Streaming de música con millones de canciones.",
    plans: [
      { planKey: "SPOTIFY_INDIVIDUAL", amountUsd: 11.99, labelEn: "Individual", labelFr: "Individuel", labelHt: "Endividyèl", labelEs: "Individual" },
      { planKey: "SPOTIFY_DUO", amountUsd: 16.99, labelEn: "Duo", labelFr: "Duo", labelHt: "Doub", labelEs: "Dúo" },
      { planKey: "SPOTIFY_FAMILY", amountUsd: 19.99, labelEn: "Family", labelFr: "Famille", labelHt: "Fanmi", labelEs: "Familiar" },
    ],
  },
  {
    merchantKey: "PRIME",
    category: "streaming",
    nameEn: "Amazon Prime Video",
    nameFr: "Amazon Prime Vidéo",
    nameHt: "Amazon Prime Videyo",
    nameEs: "Amazon Prime Video",
    descEn: "Stream movies, TV shows, and originals.",
    descFr: "Regardez des films, séries et contenus originaux.",
    descHt: "Gade fim, seri, ak kontni orijinal.",
    descEs: "Transmite películas, series y contenido original.",
    plans: [
      { planKey: "PRIME_MONTHLY", amountUsd: 8.99, labelEn: "Monthly", labelFr: "Mensuel", labelHt: "Chak mwa", labelEs: "Mensual" },
    ],
  },
  {
    merchantKey: "YOUTUBE_PREMIUM",
    category: "streaming",
    nameEn: "YouTube Premium",
    nameFr: "YouTube Premium",
    nameHt: "YouTube Premium",
    nameEs: "YouTube Premium",
    descEn: "Ad-free YouTube with background play and music.",
    descFr: "YouTube sans publicité avec lecture en arrière-plan.",
    descHt: "YouTube san piblisite avèk mizik nan fon.",
    descEs: "YouTube sin anuncios con reproducción en segundo plano.",
    plans: [
      { planKey: "YOUTUBE_INDIVIDUAL", amountUsd: 13.99, labelEn: "Individual", labelFr: "Individuel", labelHt: "Endividyèl", labelEs: "Individual" },
      { planKey: "YOUTUBE_FAMILY", amountUsd: 22.99, labelEn: "Family", labelFr: "Famille", labelHt: "Fanmi", labelEs: "Familiar" },
    ],
  },
  {
    merchantKey: "DISNEY_PLUS",
    category: "streaming",
    nameEn: "Disney+",
    nameFr: "Disney+",
    nameHt: "Disney+",
    nameEs: "Disney+",
    descEn: "Stream Disney, Marvel, Star Wars and more.",
    descFr: "Regardez Disney, Marvel, Star Wars et plus.",
    descHt: "Gade Disney, Marvel, Star Wars ak plis ankò.",
    descEs: "Transmite Disney, Marvel, Star Wars y más.",
    plans: [
      { planKey: "DISNEY_BASIC", amountUsd: 7.99, labelEn: "Basic with Ads", labelFr: "Essentiel avec pub", labelHt: "Debaz ak piblisite", labelEs: "Básico con anuncios" },
      { planKey: "DISNEY_PREMIUM", amountUsd: 13.99, labelEn: "Premium", labelFr: "Premium", labelHt: "Premyòm", labelEs: "Premium" },
    ],
  },
  {
    merchantKey: "CHATGPT",
    category: "tools",
    nameEn: "ChatGPT Plus",
    nameFr: "ChatGPT Plus",
    nameHt: "ChatGPT Plus",
    nameEs: "ChatGPT Plus",
    descEn: "AI assistant with advanced capabilities.",
    descFr: "Assistant IA avec des capacités avancées.",
    descHt: "Asistan IA avèk kapasite avanse.",
    descEs: "Asistente IA con capacidades avanzadas.",
    plans: [
      { planKey: "CHATGPT_PLUS", amountUsd: 20.00, labelEn: "Plus", labelFr: "Plus", labelHt: "Plus", labelEs: "Plus" },
    ],
  },
  {
    merchantKey: "DUOLINGO",
    category: "education",
    nameEn: "Duolingo Plus",
    nameFr: "Duolingo Plus",
    nameHt: "Duolingo Plus",
    nameEs: "Duolingo Plus",
    descEn: "Learn languages without ads.",
    descFr: "Apprenez des langues sans publicité.",
    descHt: "Aprann lang san piblisite.",
    descEs: "Aprende idiomas sin anuncios.",
    plans: [
      { planKey: "DUOLINGO_MONTHLY", amountUsd: 12.99, labelEn: "Monthly", labelFr: "Mensuel", labelHt: "Chak mwa", labelEs: "Mensual" },
    ],
  },
];

async function seedCatalog() {
  console.log("Seeding K-Pay catalog...\n");

  for (const item of catalog) {
    const created = await prisma.subscriptionCatalogItem.upsert({
      where: { merchantKey: item.merchantKey },
      create: {
        merchantKey: item.merchantKey,
        category: item.category,
        nameEn: item.nameEn,
        nameFr: item.nameFr,
        nameHt: item.nameHt,
        nameEs: item.nameEs,
        descEn: item.descEn,
        descFr: item.descFr,
        descHt: item.descHt,
        descEs: item.descEs,
      },
      update: {
        category: item.category,
        nameEn: item.nameEn,
        nameFr: item.nameFr,
        nameHt: item.nameHt,
        nameEs: item.nameEs,
        descEn: item.descEn,
        descFr: item.descFr,
        descHt: item.descHt,
        descEs: item.descEs,
      },
    });

    console.log(`  ✓ ${item.merchantKey} (${item.category})`);

    for (const plan of item.plans) {
      await prisma.subscriptionPlan.upsert({
        where: { planKey: plan.planKey },
        create: {
          planKey: plan.planKey,
          itemId: created.id,
          amountUsd: plan.amountUsd,
          labelEn: plan.labelEn,
          labelFr: plan.labelFr,
          labelHt: plan.labelHt,
          labelEs: plan.labelEs,
        },
        update: {
          amountUsd: plan.amountUsd,
          labelEn: plan.labelEn,
          labelFr: plan.labelFr,
          labelHt: plan.labelHt,
          labelEs: plan.labelEs,
        },
      });

      console.log(`    → ${plan.planKey}: $${plan.amountUsd}/mo`);
    }
  }

  console.log(`\nDone! Seeded ${catalog.length} items with ${catalog.reduce((s, i) => s + i.plans.length, 0)} plans.`);
}

seedCatalog()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
