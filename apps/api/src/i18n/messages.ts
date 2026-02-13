import { type Lang } from "./templates";

/**
 * Multilingual API response messages.
 *
 * Phase 48: Common error/success messages translated into all 4 supported languages.
 * Usage: t("insufficient_funds", "ht") → "Ou pa gen ase lajan."
 */
const messages: Record<string, Record<Lang, string>> = {
  // ─── Auth & Account ──────────────────────────────────────────────
  unauthorized: {
    en: "Unauthorized. Please log in.",
    fr: "Non autorisé. Veuillez vous connecter.",
    ht: "Pa otorize. Tanpri konekte.",
    es: "No autorizado. Por favor inicie sesión.",
  },
  account_frozen: {
    en: "Your account is frozen. Contact support.",
    fr: "Votre compte est gelé. Contactez le support.",
    ht: "Kont ou jele. Kontakte sipò.",
    es: "Tu cuenta está congelada. Contacta soporte.",
  },
  account_not_found: {
    en: "Account not found.",
    fr: "Compte introuvable.",
    ht: "Kont pa jwenn.",
    es: "Cuenta no encontrada.",
  },

  // ─── Wallet & Balance ────────────────────────────────────────────
  insufficient_funds: {
    en: "Insufficient funds.",
    fr: "Fonds insuffisants.",
    ht: "Ou pa gen ase lajan.",
    es: "Fondos insuficientes.",
  },
  wallet_not_found: {
    en: "Wallet not found.",
    fr: "Portefeuille introuvable.",
    ht: "Bous pa jwenn.",
    es: "Billetera no encontrada.",
  },

  // ─── Transfers ───────────────────────────────────────────────────
  transfer_success: {
    en: "Transfer completed successfully.",
    fr: "Transfert effectué avec succès.",
    ht: "Transfè fèt avèk siksè.",
    es: "Transferencia completada exitosamente.",
  },
  transfer_failed: {
    en: "Transfer failed. Please try again.",
    fr: "Le transfert a échoué. Veuillez réessayer.",
    ht: "Transfè echwe. Tanpri eseye ankò.",
    es: "La transferencia falló. Intente de nuevo.",
  },
  recipient_not_found: {
    en: "Recipient not found.",
    fr: "Destinataire introuvable.",
    ht: "Moun ou voye bay la pa jwenn.",
    es: "Destinatario no encontrado.",
  },
  cannot_send_to_self: {
    en: "You cannot send money to yourself.",
    fr: "Vous ne pouvez pas vous envoyer de l'argent.",
    ht: "Ou pa ka voye lajan ba tèt ou.",
    es: "No puedes enviarte dinero a ti mismo.",
  },

  // ─── Cash-In / Cash-Out ──────────────────────────────────────────
  cash_in_success: {
    en: "Cash-in completed.",
    fr: "Dépôt effectué.",
    ht: "Depo fèt.",
    es: "Depósito completado.",
  },
  cash_out_success: {
    en: "Cash-out completed.",
    fr: "Retrait effectué.",
    ht: "Retrè fèt.",
    es: "Retiro completado.",
  },
  not_active_distributor: {
    en: "You are not an active distributor.",
    fr: "Vous n'êtes pas un distributeur actif.",
    ht: "Ou pa yon distribitè aktif.",
    es: "No eres un distribuidor activo.",
  },
  insufficient_float: {
    en: "Insufficient float balance.",
    fr: "Solde de flottant insuffisant.",
    ht: "Ou pa gen ase lajan nan flòt ou.",
    es: "Saldo flotante insuficiente.",
  },

  // ─── Merchant / POS ──────────────────────────────────────────────
  payment_success: {
    en: "Payment completed successfully.",
    fr: "Paiement effectué avec succès.",
    ht: "Peman fèt avèk siksè.",
    es: "Pago completado exitosamente.",
  },
  payment_request_expired: {
    en: "Payment request has expired.",
    fr: "La demande de paiement a expiré.",
    ht: "Demann peman an ekspire.",
    es: "La solicitud de pago ha expirado.",
  },
  merchant_not_found: {
    en: "Merchant not found.",
    fr: "Commerçant introuvable.",
    ht: "Machann pa jwenn.",
    es: "Comerciante no encontrado.",
  },

  // ─── KYC ─────────────────────────────────────────────────────────
  kyc_required: {
    en: "KYC verification required. Please complete your profile.",
    fr: "Vérification KYC requise. Veuillez compléter votre profil.",
    ht: "Verifikasyon KYC obligatwa. Tanpri konplete pwofil ou.",
    es: "Se requiere verificación KYC. Complete su perfil.",
  },
  kyc_tier_insufficient: {
    en: "Your KYC tier is insufficient for this operation.",
    fr: "Votre niveau KYC est insuffisant pour cette opération.",
    ht: "Nivo KYC ou pa ase pou operasyon sa.",
    es: "Tu nivel KYC es insuficiente para esta operación.",
  },

  // ─── Limits ──────────────────────────────────────────────────────
  daily_limit_exceeded: {
    en: "Daily transaction limit exceeded.",
    fr: "Limite quotidienne de transactions dépassée.",
    ht: "Ou depase limit tranzaksyon jounen an.",
    es: "Límite diario de transacciones excedido.",
  },
  monthly_limit_exceeded: {
    en: "Monthly transaction limit exceeded.",
    fr: "Limite mensuelle de transactions dépassée.",
    ht: "Ou depase limit tranzaksyon mwa a.",
    es: "Límite mensual de transacciones excedido.",
  },

  // ─── Subscriptions ───────────────────────────────────────────────
  subscription_created: {
    en: "Subscription created successfully.",
    fr: "Abonnement créé avec succès.",
    ht: "Abònman kreye avèk siksè.",
    es: "Suscripción creada exitosamente.",
  },
  subscription_paused: {
    en: "Subscription paused.",
    fr: "Abonnement mis en pause.",
    ht: "Abònman kanpe.",
    es: "Suscripción pausada.",
  },
  subscription_canceled: {
    en: "Subscription canceled.",
    fr: "Abonnement annulé.",
    ht: "Abònman anile.",
    es: "Suscripción cancelada.",
  },

  // ─── Generic ─────────────────────────────────────────────────────
  success: {
    en: "Operation completed successfully.",
    fr: "Opération effectuée avec succès.",
    ht: "Operasyon fèt avèk siksè.",
    es: "Operación completada exitosamente.",
  },
  invalid_request: {
    en: "Invalid request.",
    fr: "Requête invalide.",
    ht: "Demann pa valab.",
    es: "Solicitud inválida.",
  },
  server_error: {
    en: "An error occurred. Please try again later.",
    fr: "Une erreur est survenue. Veuillez réessayer plus tard.",
    ht: "Yon erè rive. Tanpri eseye ankò pita.",
    es: "Ocurrió un error. Intente de nuevo más tarde.",
  },
  not_found: {
    en: "Resource not found.",
    fr: "Ressource introuvable.",
    ht: "Resous pa jwenn.",
    es: "Recurso no encontrado.",
  },
  forbidden: {
    en: "You do not have permission to perform this action.",
    fr: "Vous n'avez pas la permission d'effectuer cette action.",
    ht: "Ou pa gen pèmisyon pou fè aksyon sa.",
    es: "No tienes permiso para realizar esta acción.",
  },
};

/**
 * Translate an API message key into the user's language.
 *
 * Falls back to English if the key or language is missing.
 * Returns the raw key if the message is not found.
 */
export function t(key: string, lang: Lang = "en"): string {
  const entry = messages[key];
  if (!entry) return key;
  return entry[lang] || entry.en || key;
}

export { messages };
