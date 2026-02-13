export type Lang = "en" | "fr" | "ht" | "es";

type TemplateFn = (p: Record<string, any>) => { title: string; body: string };

/**
 * Multilingual notification templates.
 *
 * Each key maps to a template function per language.
 * Params are injected at render time — never store rendered text.
 */
export const templates: Record<string, Record<Lang, TemplateFn>> = {
  // ─── Subscription ────────────────────────────────────────────────
  subscription_due: {
    en: (p) => ({
      title: `Upcoming payment: ${p.merchant}`,
      body: `Your ${p.merchant} subscription ($${p.amountUsd}) is due soon. Ensure your USD wallet has enough balance.`,
    }),
    fr: (p) => ({
      title: `Paiement bientôt : ${p.merchant}`,
      body: `Votre abonnement ${p.merchant} ($${p.amountUsd}) arrive bientôt. Assurez-vous d'avoir assez de fonds.`,
    }),
    ht: (p) => ({
      title: `Peman ap vini: ${p.merchant}`,
      body: `Abònman ${p.merchant} ou ($${p.amountUsd}) prèt pou renouvle. Mete lajan nan bous USD ou.`,
    }),
    es: (p) => ({
      title: `Pago próximo: ${p.merchant}`,
      body: `Tu suscripción de ${p.merchant} ($${p.amountUsd}) vence pronto. Asegúrate de tener fondos suficientes.`,
    }),
  },

  low_balance: {
    en: (p) => ({
      title: "Low balance warning",
      body: `Your USD wallet ($${p.availableBalance}) may not cover your ${p.merchant} subscription ($${p.maxDue}). Top up to avoid payment failure.`,
    }),
    fr: (p) => ({
      title: "Solde faible",
      body: `Votre portefeuille USD ($${p.availableBalance}) pourrait ne pas couvrir votre abonnement ${p.merchant} ($${p.maxDue}). Rechargez pour éviter l'échec.`,
    }),
    ht: (p) => ({
      title: "Lajan ap fini",
      body: `Bous USD ou ($${p.availableBalance}) ka pa kouvri abònman ${p.merchant} ($${p.maxDue}). Mete lajan pou li pa echwe.`,
    }),
    es: (p) => ({
      title: "Saldo bajo",
      body: `Tu billetera USD ($${p.availableBalance}) podría no cubrir tu suscripción de ${p.merchant} ($${p.maxDue}). Recarga para evitar fallos.`,
    }),
  },

  subscription_active: {
    en: (p) => ({
      title: "Subscription Active",
      body: `Your ${p.merchant} subscription ($${p.amountUsd}/mo) is now active.`,
    }),
    fr: (p) => ({
      title: "Abonnement actif",
      body: `Votre abonnement ${p.merchant} ($${p.amountUsd}/mois) est maintenant actif.`,
    }),
    ht: (p) => ({
      title: "Abònman aktif",
      body: `Abònman ${p.merchant} ou ($${p.amountUsd}/mwa) aktif kounye a.`,
    }),
    es: (p) => ({
      title: "Suscripción activa",
      body: `Tu suscripción de ${p.merchant} ($${p.amountUsd}/mes) está activa.`,
    }),
  },

  subscription_paused: {
    en: (p) => ({
      title: "Subscription Paused",
      body: `Your ${p.merchant} subscription has been paused. No further charges until resumed.`,
    }),
    fr: (p) => ({
      title: "Abonnement en pause",
      body: `Votre abonnement ${p.merchant} est en pause. Aucun frais jusqu'à la reprise.`,
    }),
    ht: (p) => ({
      title: "Abònman kanpe",
      body: `Abònman ${p.merchant} ou kanpe. Pa gen chaj jiskaske ou reprann li.`,
    }),
    es: (p) => ({
      title: "Suscripción pausada",
      body: `Tu suscripción de ${p.merchant} está pausada. Sin cargos hasta que la reanudes.`,
    }),
  },

  subscription_canceled: {
    en: (p) => ({
      title: "Subscription Canceled",
      body: `Your ${p.merchant} subscription has been canceled.`,
    }),
    fr: (p) => ({
      title: "Abonnement annulé",
      body: `Votre abonnement ${p.merchant} a été annulé.`,
    }),
    ht: (p) => ({
      title: "Abònman anile",
      body: `Abònman ${p.merchant} ou anile.`,
    }),
    es: (p) => ({
      title: "Suscripción cancelada",
      body: `Tu suscripción de ${p.merchant} ha sido cancelada.`,
    }),
  },

  subscription_suspended: {
    en: (p) => ({
      title: "Subscription Suspended",
      body: `Your ${p.merchant} subscription was suspended after ${p.maxFailures} failed payment attempts. Please top up your USD wallet.`,
    }),
    fr: (p) => ({
      title: "Abonnement suspendu",
      body: `Votre abonnement ${p.merchant} a été suspendu après ${p.maxFailures} tentatives échouées. Rechargez votre portefeuille USD.`,
    }),
    ht: (p) => ({
      title: "Abònman sispann",
      body: `Abònman ${p.merchant} ou sispann apre ${p.maxFailures} tantativ ki echwe. Mete lajan nan bous USD ou.`,
    }),
    es: (p) => ({
      title: "Suscripción suspendida",
      body: `Tu suscripción de ${p.merchant} fue suspendida después de ${p.maxFailures} intentos fallidos. Recarga tu billetera USD.`,
    }),
  },

  payment_failed: {
    en: (p) => ({
      title: "Payment Failed",
      body: `Your ${p.merchant} payment failed (attempt ${p.attempt}/${p.maxAttempts}). Ensure you have sufficient USD balance.`,
    }),
    fr: (p) => ({
      title: "Paiement échoué",
      body: `Votre paiement ${p.merchant} a échoué (tentative ${p.attempt}/${p.maxAttempts}). Assurez-vous d'avoir un solde USD suffisant.`,
    }),
    ht: (p) => ({
      title: "Peman echwe",
      body: `Peman ${p.merchant} ou echwe (tantativ ${p.attempt}/${p.maxAttempts}). Asire w gen ase lajan nan USD.`,
    }),
    es: (p) => ({
      title: "Pago fallido",
      body: `Tu pago de ${p.merchant} falló (intento ${p.attempt}/${p.maxAttempts}). Asegúrate de tener suficiente saldo USD.`,
    }),
  },

  // ─── Transfers ───────────────────────────────────────────────────
  transfer_sent: {
    en: (p) => ({
      title: "Money Sent",
      body: `You sent ${p.amount} ${p.currency} to ${p.recipientName}.`,
    }),
    fr: (p) => ({
      title: "Argent envoyé",
      body: `Vous avez envoyé ${p.amount} ${p.currency} à ${p.recipientName}.`,
    }),
    ht: (p) => ({
      title: "Lajan voye",
      body: `Ou voye ${p.amount} ${p.currency} bay ${p.recipientName}.`,
    }),
    es: (p) => ({
      title: "Dinero enviado",
      body: `Enviaste ${p.amount} ${p.currency} a ${p.recipientName}.`,
    }),
  },

  transfer_received: {
    en: (p) => ({
      title: "Money Received",
      body: `You received ${p.amount} ${p.currency} from ${p.senderName}.`,
    }),
    fr: (p) => ({
      title: "Argent reçu",
      body: `Vous avez reçu ${p.amount} ${p.currency} de ${p.senderName}.`,
    }),
    ht: (p) => ({
      title: "Lajan resevwa",
      body: `Ou resevwa ${p.amount} ${p.currency} nan men ${p.senderName}.`,
    }),
    es: (p) => ({
      title: "Dinero recibido",
      body: `Recibiste ${p.amount} ${p.currency} de ${p.senderName}.`,
    }),
  },

  // ─── Cash-In / Cash-Out (Phase 48) ─────────────────────────────────
  cash_in_received: {
    en: (p) => ({
      title: "Cash-In Received",
      body: `${p.amount} ${p.currency} has been added to your wallet via a K-Agent.`,
    }),
    fr: (p) => ({
      title: "Dépôt reçu",
      body: `${p.amount} ${p.currency} a été ajouté à votre portefeuille via un K-Agent.`,
    }),
    ht: (p) => ({
      title: "Depo resevwa",
      body: `${p.amount} ${p.currency} ajoute nan bous ou atravè yon K-Ajan.`,
    }),
    es: (p) => ({
      title: "Depósito recibido",
      body: `${p.amount} ${p.currency} se ha añadido a tu billetera a través de un K-Agente.`,
    }),
  },

  cash_out_processed: {
    en: (p) => ({
      title: "Cash-Out Processed",
      body: `${p.amount} ${p.currency} has been withdrawn from your wallet. Fee: ${p.fee} ${p.currency}.`,
    }),
    fr: (p) => ({
      title: "Retrait effectué",
      body: `${p.amount} ${p.currency} a été retiré de votre portefeuille. Frais : ${p.fee} ${p.currency}.`,
    }),
    ht: (p) => ({
      title: "Retrè fèt",
      body: `${p.amount} ${p.currency} retire nan bous ou. Frè: ${p.fee} ${p.currency}.`,
    }),
    es: (p) => ({
      title: "Retiro procesado",
      body: `${p.amount} ${p.currency} se ha retirado de tu billetera. Comisión: ${p.fee} ${p.currency}.`,
    }),
  },

  // ─── Merchant / POS (Phase 48) ─────────────────────────────────────
  pos_payment_sent: {
    en: (p) => ({
      title: "Payment Sent",
      body: `You paid ${p.amount} ${p.currency} to ${p.merchantName}.`,
    }),
    fr: (p) => ({
      title: "Paiement envoyé",
      body: `Vous avez payé ${p.amount} ${p.currency} à ${p.merchantName}.`,
    }),
    ht: (p) => ({
      title: "Peman voye",
      body: `Ou peye ${p.amount} ${p.currency} bay ${p.merchantName}.`,
    }),
    es: (p) => ({
      title: "Pago enviado",
      body: `Pagaste ${p.amount} ${p.currency} a ${p.merchantName}.`,
    }),
  },

  pos_payment_received: {
    en: (p) => ({
      title: "Payment Received",
      body: `You received ${p.net} ${p.currency} from a customer (fee: ${p.fee}).`,
    }),
    fr: (p) => ({
      title: "Paiement reçu",
      body: `Vous avez reçu ${p.net} ${p.currency} d'un client (frais : ${p.fee}).`,
    }),
    ht: (p) => ({
      title: "Peman resevwa",
      body: `Ou resevwa ${p.net} ${p.currency} nan men yon kliyan (frè: ${p.fee}).`,
    }),
    es: (p) => ({
      title: "Pago recibido",
      body: `Recibiste ${p.net} ${p.currency} de un cliente (comisión: ${p.fee}).`,
    }),
  },

  // ─── Distributor (Phase 48) ────────────────────────────────────────
  distributor_approved: {
    en: () => ({
      title: "Distributor Approved",
      body: "Your distributor application has been approved. You can now process cash-in/cash-out operations.",
    }),
    fr: () => ({
      title: "Distributeur approuvé",
      body: "Votre demande de distributeur a été approuvée. Vous pouvez maintenant traiter les opérations de dépôt/retrait.",
    }),
    ht: () => ({
      title: "Distribitè apwouve",
      body: "Demann distribitè ou apwouve. Ou ka kòmanse fè operasyon depo/retrè kounye a.",
    }),
    es: () => ({
      title: "Distribuidor aprobado",
      body: "Tu solicitud de distribuidor ha sido aprobada. Ahora puedes procesar operaciones de depósito/retiro.",
    }),
  },

  commission_payout: {
    en: (p) => ({
      title: "Commission Payout",
      body: `Your earned commissions of ${p.amount} HTG have been credited to your float wallet.`,
    }),
    fr: (p) => ({
      title: "Paiement de commissions",
      body: `Vos commissions de ${p.amount} HTG ont été créditées sur votre portefeuille flottant.`,
    }),
    ht: (p) => ({
      title: "Peman komisyon",
      body: `Komisyon ou touche ${p.amount} HTG depoze nan bous flòt ou.`,
    }),
    es: (p) => ({
      title: "Pago de comisiones",
      body: `Tus comisiones de ${p.amount} HTG han sido acreditadas en tu billetera flotante.`,
    }),
  },

  float_low: {
    en: (p) => ({
      title: "Low Float Warning",
      body: `Your float balance (${p.balance} HTG) is below the threshold (${p.threshold} HTG). Please request a refill.`,
    }),
    fr: (p) => ({
      title: "Flottant faible",
      body: `Votre solde flottant (${p.balance} HTG) est en dessous du seuil (${p.threshold} HTG). Demandez un rechargement.`,
    }),
    ht: (p) => ({
      title: "Flòt ba",
      body: `Balans flòt ou (${p.balance} HTG) anba limit (${p.threshold} HTG). Tanpri mande yon rechajman.`,
    }),
    es: (p) => ({
      title: "Flotante bajo",
      body: `Tu saldo flotante (${p.balance} HTG) está por debajo del límite (${p.threshold} HTG). Solicita una recarga.`,
    }),
  },

  // ─── Diaspora / Remittance (Phase 48) ──────────────────────────────
  remittance_sent: {
    en: (p) => ({
      title: "Remittance Sent",
      body: `You sent $${p.amountUsd} USD to ${p.recipientName} in Haiti (≈${p.amountHtg} HTG).`,
    }),
    fr: (p) => ({
      title: "Envoi effectué",
      body: `Vous avez envoyé $${p.amountUsd} USD à ${p.recipientName} en Haïti (≈${p.amountHtg} HTG).`,
    }),
    ht: (p) => ({
      title: "Lajan voye",
      body: `Ou voye $${p.amountUsd} USD bay ${p.recipientName} ann Ayiti (≈${p.amountHtg} HTG).`,
    }),
    es: (p) => ({
      title: "Remesa enviada",
      body: `Enviaste $${p.amountUsd} USD a ${p.recipientName} en Haití (≈${p.amountHtg} HTG).`,
    }),
  },

  remittance_received: {
    en: (p) => ({
      title: "Money from Abroad",
      body: `You received ${p.amountHtg} HTG from ${p.senderName} (diaspora).`,
    }),
    fr: (p) => ({
      title: "Argent de l'étranger",
      body: `Vous avez reçu ${p.amountHtg} HTG de ${p.senderName} (diaspora).`,
    }),
    ht: (p) => ({
      title: "Lajan soti lòt bò dlo",
      body: `Ou resevwa ${p.amountHtg} HTG nan men ${p.senderName} (dyaspora).`,
    }),
    es: (p) => ({
      title: "Dinero del extranjero",
      body: `Recibiste ${p.amountHtg} HTG de ${p.senderName} (diáspora).`,
    }),
  },

  // ─── Security (Phase 48) ───────────────────────────────────────────
  account_frozen: {
    en: () => ({
      title: "Account Frozen",
      body: "Your account has been frozen due to suspicious activity. Contact support for assistance.",
    }),
    fr: () => ({
      title: "Compte gelé",
      body: "Votre compte a été gelé en raison d'activité suspecte. Contactez le support.",
    }),
    ht: () => ({
      title: "Kont jele",
      body: "Kont ou jele poutèt aktivite sispèk. Kontakte sipò pou èd.",
    }),
    es: () => ({
      title: "Cuenta congelada",
      body: "Tu cuenta ha sido congelada por actividad sospechosa. Contacta soporte.",
    }),
  },

  kyc_reminder: {
    en: () => ({
      title: "Complete Your KYC",
      body: "Please complete your KYC verification to unlock higher transaction limits.",
    }),
    fr: () => ({
      title: "Complétez votre KYC",
      body: "Veuillez compléter votre vérification KYC pour débloquer des limites plus élevées.",
    }),
    ht: () => ({
      title: "Konplete KYC ou",
      body: "Tanpri konplete verifikasyon KYC ou pou debloke limit pi wo.",
    }),
    es: () => ({
      title: "Completa tu KYC",
      body: "Completa tu verificación KYC para desbloquear límites de transacción más altos.",
    }),
  },
};
