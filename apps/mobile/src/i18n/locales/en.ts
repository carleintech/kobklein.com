export default {
  // Common
  appName: "KobKlein",
  loading: "Loading...",
  cancel: "Cancel",
  confirm: "Confirm",
  done: "Done",
  save: "Save",
  next: "Next",
  back: "Back",
  retry: "Retry",
  close: "Close",
  search: "Search",
  seeAll: "See All",

  // Auth
  "auth.welcome": "Welcome to KobKlein",
  "auth.tagline": "Digital Financial Sovereignty",
  "auth.signIn": "Sign In",
  "auth.signUp": "Create Account",
  "auth.signOut": "Sign Out",
  "auth.signingIn": "Signing in...",

  // Tabs
  "tab.home": "Home",
  "tab.wallet": "Wallet",
  "tab.send": "Send",
  "tab.scan": "Scan",
  "tab.settings": "Settings",

  // Dashboard
  "dashboard.greeting": "Hello, %{name}",
  "dashboard.balance": "Total Balance",
  "dashboard.quickActions": "Quick Actions",
  "dashboard.recentActivity": "Recent Activity",
  "dashboard.noActivity": "No recent activity",

  // Wallet
  "wallet.title": "Wallet",
  "wallet.htg": "Haitian Gourde",
  "wallet.usd": "US Dollar",
  "wallet.history": "Transaction History",
  "wallet.noTransactions": "No transactions yet",

  // Send
  "send.title": "Send Money",
  "send.to": "To",
  "send.amount": "Amount",
  "send.currency": "Currency",
  "send.preview": "Preview Transfer",
  "send.confirm": "Confirm Transfer",
  "send.rate": "Exchange Rate",
  "send.fee": "Fee",
  "send.total": "Total",
  "send.theyReceive": "They Receive",
  "send.success": "Transfer Sent!",
  "send.enterOtp": "Enter verification code",
  "send.otpSent": "Code sent to %{phone}",

  // Recipients
  "recipients.title": "Recipients",
  "recipients.addNew": "Add Recipient",
  "recipients.recent": "Recent",
  "recipients.favorites": "Favorites",
  "recipients.searchPlaceholder": "Search by name, K-ID, or phone",

  // QR / Pay
  "pay.title": "Scan to Pay",
  "pay.scanQr": "Scan QR Code",
  "pay.myQr": "My QR Code",
  "pay.shareQr": "Share your QR code to receive payments",

  // Merchant
  "merchant.pos": "POS Terminal",
  "merchant.enterAmount": "Enter Amount",
  "merchant.generateQr": "Generate QR",
  "merchant.waitingPayment": "Waiting for payment...",
  "merchant.paymentReceived": "Payment Received!",
  "merchant.todaySales": "Today's Sales",
  "merchant.withdraw": "Withdraw",

  // Distributor
  "distributor.title": "Distributor",
  "distributor.float": "Float Balance",
  "distributor.cashIn": "Cash In",
  "distributor.cashOut": "Cash Out",
  "distributor.commissions": "Commissions",

  // Diaspora
  "diaspora.family": "My Family",
  "diaspora.addMember": "Add Family Member",
  "diaspora.sendHome": "Send Home",
  "diaspora.recurring": "Recurring Transfers",

  // Settings
  "settings.title": "Settings",
  "settings.profile": "Profile",
  "settings.security": "Security",
  "settings.language": "Language",
  "settings.notifications": "Notifications",
  "settings.kyc": "Verification",
  "settings.plan": "My Plan",
  "settings.help": "Help & Support",
  "settings.about": "About KobKlein",
  "settings.version": "Version %{version}",

  // Security
  "security.lockAccount": "Lock Account",
  "security.devices": "Trusted Devices",
  "security.biometric": "Biometric Login",
  "security.pin": "Change PIN",

  // KYC
  "kyc.unverified": "Unverified",
  "kyc.pending": "Verification Pending",
  "kyc.verified": "Verified",
  "kyc.rejected": "Verification Rejected",
  "kyc.startVerification": "Start Verification",
  "kyc.tier1": "Basic (Tier 1)",
  "kyc.tier2": "Full (Tier 2)",

  // Notifications
  "notifications.title": "Notifications",
  "notifications.empty": "No notifications",
  "notifications.markRead": "Mark all as read",

  // Errors
  "error.generic": "Something went wrong. Please try again.",
  "error.network": "No internet connection",
  "error.unauthorized": "Session expired. Please sign in again.",
  "error.frozen": "Your account is locked. Contact support.",
} as const;
