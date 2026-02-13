/**
 * Kreyòl Ayisyen (ht) — KobKlein Tradiksyon Pataje
 */
const ht = {
  common: {
    appName: "KobKlein",
    continue: "Kontinye",
    cancel: "Anile",
    confirm: "Konfime",
    save: "Sove",
    done: "Fini",
    next: "Pwochen",
    back: "Retounen",
    retry: "Eseye ankò",
    close: "Fèmen",
    search: "Chèche",
    seeAll: "Wè Tout",
    loading: "Ap chaje...",
    noResults: "Pa gen rezilta",
    submit: "Soumèt",
    edit: "Modifye",
    delete: "Efase",
    yes: "Wi",
    no: "Non",
  },

  auth: {
    welcome: "Byenveni sou KobKlein",
    tagline: "Souverènte Finansyè Nimerik",
    signIn: "Konekte",
    signUp: "Kreye Kont",
    signOut: "Dekonekte",
    signingIn: "Ap konekte...",
    forgotPassword: "Bliye modpas?",
    sessionExpired: "Sesyon fini. Tanpri konekte ankò.",
  },

  tabs: {
    home: "Akèy",
    wallet: "Bous",
    send: "Voye",
    scan: "Eskane",
    settings: "Paramèt",
  },

  dashboard: {
    greeting: "Bonjou, {{name}}",
    balance: "Balans Total",
    quickActions: "Aksyon Rapid",
    recentActivity: "Dènye Aktivite",
    noActivity: "Pa gen aktivite resan",
  },

  wallet: {
    title: "Bous",
    htg: "Goud Ayisyen",
    usd: "Dola Ameriken",
    history: "Istwa Tranzaksyon",
    noTransactions: "Pa gen tranzaksyon toujou",
    receive: "Resevwa",
    topUp: "Rechaje",
  },

  send: {
    title: "Voye Lajan",
    to: "Bay",
    amount: "Kantite",
    currency: "Lajan",
    preview: "Wè Transfè a",
    confirm: "Konfime Transfè",
    rate: "To Chanj",
    fee: "Frè",
    total: "Total",
    theyReceive: "Yo Resevwa",
    success: "Transfè Voye!",
    enterOtp: "Antre kòd verifikasyon",
    otpSent: "Kòd voye nan {{phone}}",
  },

  recipients: {
    title: "Destinatè",
    addNew: "Ajoute Destinatè",
    recent: "Resan",
    favorites: "Favori",
    searchPlaceholder: "Chèche pa non, K-ID, oswa telefòn",
  },

  pay: {
    title: "Eskane pou Peye",
    scanQr: "Eskane Kòd QR",
    myQr: "Kòd QR Mwen",
    shareQr: "Pataje kòd QR ou pou resevwa peman",
  },

  merchant: {
    title: "Tablo Machann",
    pos: "Tèminal POS",
    enterAmount: "Antre Kantite",
    generateQr: "Kreye QR",
    waitingPayment: "Ap tann peman...",
    paymentReceived: "Peman Resevwa!",
    todaySales: "Vant Jodi a",
    weekSales: "Semèn Sa a",
    withdraw: "Retire",
    requestSettlement: "Mande Règleman",
  },

  distributor: {
    title: "Tablo Distribitè",
    float: "Balans Float",
    cashIn: "Depoze",
    cashOut: "Retire",
    commissions: "Komisyon",
    availableCash: "Kach Disponib",
    reserved: "Rezève",
    requestRecharge: "Mande Rechaj",
    lowFloat: "Float ba — mande yon rechaj",
  },

  diaspora: {
    title: "Tablo Dyaspora",
    family: "Fanmi Mwen",
    addMember: "Ajoute Manm Fanmi",
    sendHome: "Voye Lakay",
    recurring: "Transfè Regilye",
    walletBalance: "Balans Bous la",
    selectFamily: "Chwazi Fanmi",
    sendMoney: "Voye Lajan",
    amount: "Kantite",
    successSent: "Transfè a reyisi",
  },

  settings: {
    title: "Paramèt",
    profile: "Pwofil",
    security: "Sekirite",
    language: "Lang",
    notifications: "Notifikasyon",
    kyc: "Verifikasyon",
    plan: "Plan Mwen",
    help: "Èd & Sipò",
    about: "Sou KobKlein",
    version: "Vèsyon {{version}}",
  },

  security: {
    lockAccount: "Bloke Kont",
    devices: "Aparèy Konfyans",
    biometric: "Koneksyon Byometrik",
    pin: "Chanje PIN",
  },

  kyc: {
    unverified: "Pa Verifye",
    pending: "Verifikasyon Ap Tann",
    verified: "Verifye",
    rejected: "Verifikasyon Rejte",
    startVerification: "Kòmanse Verifikasyon",
    tier1: "Debaz (Nivo 1)",
    tier2: "Konplè (Nivo 2)",
  },

  notifications: {
    title: "Notifikasyon",
    empty: "Pa gen notifikasyon",
    markRead: "Make tout kòm li",
  },

  admin: {
    title: "Tablo Admin",
    users: "Itilizatè",
    transactions: "Tranzaksyon",
    distributors: "Distribitè",
    merchants: "Machann",
    compliance: "Konfòmite",
    risk: "Motè Risk",
    aml: "Siveyans AML",
    fx: "To Chanj",
    analytics: "Analitik",
    settings: "Paramèt Sistèm",
    recharges: "Rechajman",
    cases: "Dosye",
    treasury: "Trezori",
  },

  errors: {
    generic: "Yon erè rive. Tanpri eseye ankò.",
    network: "Pa gen koneksyon entènèt",
    unauthorized: "Sesyon fini. Tanpri konekte ankò.",
    frozen: "Kont ou bloke. Kontakte sipò.",
    notFound: "Pa jwenn",
    forbidden: "Aksè refize",
  },
};

export default ht;
