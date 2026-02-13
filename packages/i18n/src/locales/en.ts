/**
 * English (en) — KobKlein Shared Translations
 *
 * Covers: common, auth, dashboard, wallet, send, merchant,
 * distributor, diaspora, settings, security, kyc, errors, admin
 */
const en = {
  common: {
    appName: "KobKlein",
    continue: "Continue",
    cancel: "Cancel",
    confirm: "Confirm",
    save: "Save",
    done: "Done",
    next: "Next",
    back: "Back",
    retry: "Retry",
    close: "Close",
    search: "Search",
    seeAll: "See All",
    loading: "Loading...",
    noResults: "No results found",
    submit: "Submit",
    edit: "Edit",
    delete: "Delete",
    yes: "Yes",
    no: "No",
  },

  auth: {
    welcome: "Welcome to KobKlein",
    tagline: "Digital Financial Sovereignty",
    signIn: "Sign In",
    signUp: "Create Account",
    signOut: "Sign Out",
    signingIn: "Signing in...",
    forgotPassword: "Forgot password?",
    sessionExpired: "Session expired. Please sign in again.",
  },

  tabs: {
    home: "Home",
    wallet: "Wallet",
    send: "Send",
    scan: "Scan",
    settings: "Settings",
  },

  dashboard: {
    greeting: "Hello, {{name}}",
    balance: "Total Balance",
    quickActions: "Quick Actions",
    recentActivity: "Recent Activity",
    noActivity: "No recent activity",
  },

  wallet: {
    title: "Wallet",
    htg: "Haitian Gourde",
    usd: "US Dollar",
    history: "Transaction History",
    noTransactions: "No transactions yet",
    receive: "Receive",
    topUp: "Top Up",
  },

  send: {
    title: "Send Money",
    to: "To",
    amount: "Amount",
    currency: "Currency",
    preview: "Preview Transfer",
    confirm: "Confirm Transfer",
    rate: "Exchange Rate",
    fee: "Fee",
    total: "Total",
    theyReceive: "They Receive",
    success: "Transfer Sent!",
    enterOtp: "Enter verification code",
    otpSent: "Code sent to {{phone}}",
  },

  recipients: {
    title: "Recipients",
    addNew: "Add Recipient",
    recent: "Recent",
    favorites: "Favorites",
    searchPlaceholder: "Search by name, K-ID, or phone",
  },

  pay: {
    title: "Scan to Pay",
    scanQr: "Scan QR Code",
    myQr: "My QR Code",
    shareQr: "Share your QR code to receive payments",
  },

  merchant: {
    title: "Merchant Dashboard",
    pos: "POS Terminal",
    enterAmount: "Enter Amount",
    generateQr: "Generate QR",
    waitingPayment: "Waiting for payment...",
    paymentReceived: "Payment Received!",
    todaySales: "Today's Sales",
    weekSales: "This Week",
    withdraw: "Withdraw",
    requestSettlement: "Request Settlement",
  },

  distributor: {
    title: "Distributor Dashboard",
    float: "Float Balance",
    cashIn: "Cash In",
    cashOut: "Cash Out",
    commissions: "Commissions",
    availableCash: "Available Cash",
    reserved: "Reserved",
    requestRecharge: "Request Recharge",
    lowFloat: "Low float — request a recharge",
  },

  diaspora: {
    title: "Diaspora Dashboard",
    family: "My Family",
    addMember: "Add Family Member",
    sendHome: "Send Home",
    recurring: "Recurring Transfers",
    walletBalance: "Wallet Balance",
    selectFamily: "Select Family Member",
    sendMoney: "Send Money",
    amount: "Amount",
    successSent: "Transfer sent successfully",
  },

  settings: {
    title: "Settings",
    profile: "Profile",
    security: "Security",
    language: "Language",
    notifications: "Notifications",
    kyc: "Verification",
    plan: "My Plan",
    help: "Help & Support",
    about: "About KobKlein",
    version: "Version {{version}}",
  },

  security: {
    lockAccount: "Lock Account",
    devices: "Trusted Devices",
    biometric: "Biometric Login",
    pin: "Change PIN",
  },

  kyc: {
    unverified: "Unverified",
    pending: "Verification Pending",
    verified: "Verified",
    rejected: "Verification Rejected",
    startVerification: "Start Verification",
    tier1: "Basic (Tier 1)",
    tier2: "Full (Tier 2)",
  },

  notifications: {
    title: "Notifications",
    empty: "No notifications",
    markRead: "Mark all as read",
  },

  admin: {
    title: "Admin Dashboard",
    users: "Users",
    transactions: "Transactions",
    distributors: "Distributors",
    merchants: "Merchants",
    compliance: "Compliance",
    risk: "Risk Engine",
    aml: "AML Monitoring",
    fx: "FX Rates",
    analytics: "Analytics",
    settings: "System Settings",
    recharges: "Recharges",
    cases: "Cases",
    treasury: "Treasury",
  },

  errors: {
    generic: "Something went wrong. Please try again.",
    network: "No internet connection",
    unauthorized: "Session expired. Please sign in again.",
    frozen: "Your account is locked. Contact support.",
    notFound: "Not found",
    forbidden: "Access denied",
  },
};

export default en;
export type TranslationKeys = typeof en;
