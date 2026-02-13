import type { MetadataRoute } from "next";

const BASE_URL = "https://kobklein.com";
const locales = ["en", "fr", "es", "ht"] as const;

type ChangeFreq = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

interface RouteConfig {
  path: string;
  changeFrequency: ChangeFreq;
  priority: number;
}

const routes: RouteConfig[] = [
  // Core pages
  { path: "", changeFrequency: "daily", priority: 1.0 },
  { path: "/about", changeFrequency: "monthly", priority: 0.8 },
  { path: "/how-it-works", changeFrequency: "monthly", priority: 0.9 },
  { path: "/card", changeFrequency: "weekly", priority: 0.9 },
  { path: "/app", changeFrequency: "weekly", priority: 0.8 },

  // Landing pages
  { path: "/business", changeFrequency: "weekly", priority: 0.8 },
  { path: "/distributor", changeFrequency: "weekly", priority: 0.8 },
  { path: "/diaspora", changeFrequency: "weekly", priority: 0.8 },
  { path: "/institutional", changeFrequency: "monthly", priority: 0.7 },
  { path: "/fx-calculator", changeFrequency: "daily", priority: 0.7 },

  // Company
  { path: "/mission", changeFrequency: "monthly", priority: 0.6 },
  { path: "/team", changeFrequency: "monthly", priority: 0.5 },
  { path: "/careers", changeFrequency: "weekly", priority: 0.5 },
  { path: "/community", changeFrequency: "monthly", priority: 0.5 },
  { path: "/reviews", changeFrequency: "weekly", priority: 0.5 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.5 },

  // Resources
  { path: "/help", changeFrequency: "weekly", priority: 0.6 },
  { path: "/docs", changeFrequency: "weekly", priority: 0.5 },
  { path: "/developer-resources", changeFrequency: "weekly", priority: 0.5 },

  // Legal & Compliance
  { path: "/security", changeFrequency: "monthly", priority: 0.6 },
  { path: "/compliance", changeFrequency: "monthly", priority: 0.6 },
  { path: "/terms", changeFrequency: "monthly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "monthly", priority: 0.3 },
  { path: "/risk-disclosure", changeFrequency: "monthly", priority: 0.3 },
  { path: "/acceptable-use", changeFrequency: "monthly", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const route of routes) {
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}${route.path}`,
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
      });
    }
  }

  return entries;
}
