/**
 * Français (fr) — KobKlein Traductions Partagées
 */
const fr = {
  common: {
    appName: "KobKlein",
    continue: "Continuer",
    cancel: "Annuler",
    confirm: "Confirmer",
    save: "Enregistrer",
    done: "Terminé",
    next: "Suivant",
    back: "Retour",
    retry: "Réessayer",
    close: "Fermer",
    search: "Rechercher",
    seeAll: "Voir tout",
    loading: "Chargement...",
    noResults: "Aucun résultat",
    submit: "Soumettre",
    edit: "Modifier",
    delete: "Supprimer",
    yes: "Oui",
    no: "Non",
  },

  auth: {
    welcome: "Bienvenue sur KobKlein",
    tagline: "Souveraineté Financière Numérique",
    signIn: "Connexion",
    signUp: "Créer un compte",
    signOut: "Déconnexion",
    signingIn: "Connexion en cours...",
    forgotPassword: "Mot de passe oublié ?",
    sessionExpired: "Session expirée. Veuillez vous reconnecter.",
  },

  tabs: {
    home: "Accueil",
    wallet: "Portefeuille",
    send: "Envoyer",
    scan: "Scanner",
    settings: "Paramètres",
  },

  dashboard: {
    greeting: "Bonjour, {{name}}",
    balance: "Solde Total",
    quickActions: "Actions Rapides",
    recentActivity: "Activité Récente",
    noActivity: "Aucune activité récente",
  },

  wallet: {
    title: "Portefeuille",
    htg: "Gourde Haïtienne",
    usd: "Dollar Américain",
    history: "Historique des Transactions",
    noTransactions: "Aucune transaction",
    receive: "Recevoir",
    topUp: "Recharger",
  },

  send: {
    title: "Envoyer de l'Argent",
    to: "À",
    amount: "Montant",
    currency: "Devise",
    preview: "Aperçu du Transfert",
    confirm: "Confirmer le Transfert",
    rate: "Taux de Change",
    fee: "Frais",
    total: "Total",
    theyReceive: "Ils Reçoivent",
    success: "Transfert Envoyé !",
    enterOtp: "Entrez le code de vérification",
    otpSent: "Code envoyé au {{phone}}",
  },

  recipients: {
    title: "Destinataires",
    addNew: "Ajouter un Destinataire",
    recent: "Récents",
    favorites: "Favoris",
    searchPlaceholder: "Rechercher par nom, K-ID ou téléphone",
  },

  pay: {
    title: "Scanner pour Payer",
    scanQr: "Scanner le Code QR",
    myQr: "Mon Code QR",
    shareQr: "Partagez votre code QR pour recevoir des paiements",
  },

  merchant: {
    title: "Tableau de Bord Marchand",
    pos: "Terminal POS",
    enterAmount: "Entrer le Montant",
    generateQr: "Générer le QR",
    waitingPayment: "En attente du paiement...",
    paymentReceived: "Paiement Reçu !",
    todaySales: "Ventes du Jour",
    weekSales: "Cette Semaine",
    withdraw: "Retirer",
    requestSettlement: "Demander un Règlement",
  },

  distributor: {
    title: "Tableau de Bord Distributeur",
    float: "Solde Float",
    cashIn: "Dépôt",
    cashOut: "Retrait",
    commissions: "Commissions",
    availableCash: "Liquidité Disponible",
    reserved: "Réservé",
    requestRecharge: "Demander un Rechargement",
    lowFloat: "Float faible — demandez un rechargement",
  },

  diaspora: {
    title: "Tableau de Bord Diaspora",
    family: "Ma Famille",
    addMember: "Ajouter un Membre",
    sendHome: "Envoyer au Pays",
    recurring: "Transferts Récurrents",
    walletBalance: "Solde du Portefeuille",
    selectFamily: "Sélectionner un Membre",
    sendMoney: "Envoyer de l'Argent",
    amount: "Montant",
    successSent: "Transfert envoyé avec succès",
  },

  settings: {
    title: "Paramètres",
    profile: "Profil",
    security: "Sécurité",
    language: "Langue",
    notifications: "Notifications",
    kyc: "Vérification",
    plan: "Mon Plan",
    help: "Aide & Support",
    about: "À Propos de KobKlein",
    version: "Version {{version}}",
  },

  security: {
    lockAccount: "Verrouiller le Compte",
    devices: "Appareils de Confiance",
    biometric: "Connexion Biométrique",
    pin: "Changer le PIN",
  },

  kyc: {
    unverified: "Non Vérifié",
    pending: "Vérification en Cours",
    verified: "Vérifié",
    rejected: "Vérification Rejetée",
    startVerification: "Commencer la Vérification",
    tier1: "Basique (Niveau 1)",
    tier2: "Complet (Niveau 2)",
  },

  notifications: {
    title: "Notifications",
    empty: "Aucune notification",
    markRead: "Tout marquer comme lu",
  },

  admin: {
    title: "Tableau de Bord Admin",
    users: "Utilisateurs",
    transactions: "Transactions",
    distributors: "Distributeurs",
    merchants: "Marchands",
    compliance: "Conformité",
    risk: "Moteur de Risque",
    aml: "Surveillance AML",
    fx: "Taux de Change",
    analytics: "Analytique",
    settings: "Paramètres Système",
    recharges: "Rechargements",
    cases: "Dossiers",
    treasury: "Trésorerie",
  },

  errors: {
    generic: "Une erreur est survenue. Veuillez réessayer.",
    network: "Pas de connexion internet",
    unauthorized: "Session expirée. Veuillez vous reconnecter.",
    frozen: "Votre compte est verrouillé. Contactez le support.",
    notFound: "Non trouvé",
    forbidden: "Accès refusé",
  },
};

export default fr;
