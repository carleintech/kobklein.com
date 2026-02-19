/**
 * Role Types and Constants for KobKlein Platform
 *
 * Defines the four user roles and their associated routes/metadata.
 */

export const USER_ROLES = ["client", "diaspora", "merchant", "distributor"] as const;
export type UserRole = typeof USER_ROLES[number];

/**
 * Dashboard routes mapped to each role
 */
// All roles use the unified /dashboard page which switches on profile.role
// This avoids 404s from missing /diaspora, /merchant, /distributor pages
export const ROLE_DASHBOARD: Record<UserRole, string> = {
  client: "/dashboard",
  diaspora: "/dashboard",
  merchant: "/dashboard",
  distributor: "/dashboard",
};

/**
 * Human-readable role display names (for UI)
 */
export const ROLE_LABELS: Record<UserRole, { en: string; fr: string; ht: string; es: string }> = {
  client: {
    en: "Client",
    fr: "Client",
    ht: "Kliyan",
    es: "Cliente",
  },
  diaspora: {
    en: "Diaspora Member",
    fr: "Membre de la Diaspora",
    ht: "Manm Dyaspora",
    es: "Miembro de la Diáspora",
  },
  merchant: {
    en: "Merchant",
    fr: "Commerçant",
    ht: "Machann",
    es: "Comerciante",
  },
  distributor: {
    en: "Cash Agent",
    fr: "Agent de Trésorerie",
    ht: "Ajan Lajan",
    es: "Agente de Efectivo",
  },
};

/**
 * Role descriptions for signup selection
 */
export const ROLE_DESCRIPTIONS: Record<UserRole, { en: string; fr: string; ht: string; es: string }> = {
  client: {
    en: "Send and receive money in Haiti with KobKlein wallet",
    fr: "Envoyer et recevoir de l'argent en Haïti avec le portefeuille KobKlein",
    ht: "Voye epi resevwa lajan an Ayiti ak bous KobKlein",
    es: "Enviar y recibir dinero en Haití con la billetera KobKlein",
  },
  diaspora: {
    en: "Send money to family in Haiti from anywhere in the world",
    fr: "Envoyer de l'argent à la famille en Haïti depuis n'importe où dans le monde",
    ht: "Voye lajan bay fanmi an Ayiti depi nenpòt kote nan mond lan",
    es: "Enviar dinero a familia en Haití desde cualquier lugar del mundo",
  },
  merchant: {
    en: "Accept digital payments at your business",
    fr: "Accepter les paiements numériques dans votre entreprise",
    ht: "Aksepte peman dijital nan biznis ou",
    es: "Aceptar pagos digitales en su negocio",
  },
  distributor: {
    en: "Operate as a cash-in/cash-out agent in your community",
    fr: "Opérer comme agent de dépôt/retrait dans votre communauté",
    ht: "Opere kòm ajan depo/retrè nan kominote ou",
    es: "Operar como agente de depósito/retiro en su comunidad",
  },
};

/**
 * Check if a user has completed onboarding based on role
 */
export function isOnboardingComplete(role: UserRole, user: any): boolean {
  if (!user.profileComplete || !user.onboardingComplete) return false;

  switch (role) {
    case "client":
      return Boolean(user.handle && user.dateOfBirth && user.country);

    case "diaspora":
      return Boolean(user.handle && user.dateOfBirth && user.diasporaProfile?.countryOfResidence);

    case "merchant":
      return Boolean(user.merchant?.businessName);

    case "distributor":
      return Boolean(user.distributor?.businessName);

    default:
      return false;
  }
}
