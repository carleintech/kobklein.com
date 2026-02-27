/**
 * KobKlein — Production HTML Email Templates
 * Sovereign Luxury brand: dark background, gold accents, Playfair Display headings.
 * All functions return { subject, html } ready to pass to sendEmail().
 */

// ─── Base wrapper ─────────────────────────────────────────────────────────────

function base(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${title}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{background:#080B14;font-family:'Inter',sans-serif;color:#C4C7CF;-webkit-font-smoothing:antialiased}
a{color:#C6A756;text-decoration:none}
</style>
</head>
<body style="background:#080B14;padding:32px 16px">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" role="presentation"
             style="max-width:600px;width:100%">

        <!-- Header -->
        <tr><td style="background:#0F1626;border-radius:12px 12px 0 0;padding:32px 40px;border-bottom:1px solid #1E2A45;text-align:center">
          <div style="font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:700;color:#F2F2F2;letter-spacing:1px">KobKlein</div>
          <div style="font-size:11px;color:#7A8394;margin-top:4px;letter-spacing:2px;text-transform:uppercase">Sovereign Digital Finance</div>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#0F1626;padding:40px 40px 32px">
          ${content}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#080B14;border-radius:0 0 12px 12px;padding:24px 40px;border-top:1px solid #1E2A45;text-align:center">
          <p style="font-size:11px;color:#7A8394;line-height:1.6">
            © ${new Date().getFullYear()} KobKlein. All rights reserved.<br/>
            This is an automated message — please do not reply directly to this email.<br/>
            <a href="https://kobklein.com" style="color:#C6A756">kobklein.com</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function heading(text: string): string {
  return `<h1 style="font-family:'Playfair Display',Georgia,serif;font-size:24px;font-weight:700;color:#F2F2F2;margin-bottom:16px">${text}</h1>`;
}

function para(text: string): string {
  return `<p style="font-size:15px;line-height:1.7;color:#C4C7CF;margin-bottom:16px">${text}</p>`;
}

function statBox(label: string, value: string, color = "#C6A756"): string {
  return `<div style="background:#151B2E;border:1px solid #1E2A45;border-radius:8px;padding:20px 24px;margin-bottom:20px;text-align:center">
    <div style="font-size:12px;color:#7A8394;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">${label}</div>
    <div style="font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:700;color:${color}">${value}</div>
  </div>`;
}

function ctaButton(text: string, url: string): string {
  return `<div style="text-align:center;margin:28px 0">
    <a href="${url}" style="display:inline-block;background:#C6A756;color:#080B14;font-family:'Inter',sans-serif;font-weight:600;font-size:15px;padding:14px 36px;border-radius:8px;text-decoration:none;letter-spacing:0.3px">${text}</a>
  </div>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #1E2A45;margin:28px 0" />`;
}

function alertBox(text: string, color = "#C6A756"): string {
  return `<div style="background:${color}18;border:1px solid ${color}44;border-radius:8px;padding:16px 20px;margin-bottom:20px">
    <p style="font-size:14px;color:${color};margin:0;line-height:1.6">${text}</p>
  </div>`;
}

// ─── Templates ────────────────────────────────────────────────────────────────

export function welcomeEmail(name: string): { subject: string; html: string } {
  return {
    subject: "Welcome to KobKlein — Your Account is Ready",
    html: base("Welcome to KobKlein", `
      ${heading("Welcome, " + name + ".")}
      ${para("Your KobKlein account has been created. You now have access to secure digital payments, instant transfers, and a growing network of merchants and agents across Haiti.")}
      ${alertBox("Complete your KYC verification to unlock higher transaction limits and the full KobKlein experience.")}
      ${ctaButton("Open Your Account", "https://app.kobklein.com/dashboard")}
      ${divider()}
      ${para("If you did not create this account, please contact our support team immediately.")}
    `),
  };
}

export function transactionEmail(
  name: string,
  type: "sent" | "received" | "deposit" | "withdrawal",
  amount: number,
  currency: string,
  ref: string,
): { subject: string; html: string } {
  const typeLabels: Record<string, string> = {
    sent: "Transfer Sent",
    received: "Transfer Received",
    deposit: "Deposit Confirmed",
    withdrawal: "Withdrawal Processed",
  };
  const typeColors: Record<string, string> = {
    sent: "#C6A756",
    received: "#1F6F4A",
    deposit: "#1F6F4A",
    withdrawal: "#C6A756",
  };
  const label = typeLabels[type] ?? "Transaction";
  const color = typeColors[type] ?? "#C6A756";
  const formatted = `${Number(amount).toLocaleString("fr-HT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;

  return {
    subject: `KobKlein: ${label} — ${formatted}`,
    html: base(label, `
      ${heading(label)}
      ${para(`Hello ${name}, the following transaction has been processed on your account.`)}
      ${statBox(label, formatted, color)}
      <div style="background:#151B2E;border-radius:8px;padding:16px 20px;margin-bottom:20px">
        <p style="font-size:12px;color:#7A8394;margin-bottom:4px;text-transform:uppercase;letter-spacing:1px">Reference</p>
        <p style="font-size:13px;color:#C4C7CF;font-family:monospace">${ref}</p>
      </div>
      ${ctaButton("View Transaction", "https://app.kobklein.com/transactions")}
      ${divider()}
      ${para("If you did not authorise this transaction, please freeze your account immediately and contact support.")}
    `),
  };
}

export function depositConfirmedEmail(
  name: string,
  amount: number,
  currency: string,
  provider: string,
): { subject: string; html: string } {
  const formatted = `${Number(amount).toLocaleString("fr-HT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  const providerLabel = provider === "moncash" ? "MonCash (Digicel)" : provider.charAt(0).toUpperCase() + provider.slice(1);

  return {
    subject: `KobKlein: Deposit Confirmed — ${formatted}`,
    html: base("Deposit Confirmed", `
      ${heading("Deposit Confirmed")}
      ${para(`Hello ${name}, your deposit via ${providerLabel} has been confirmed and credited to your wallet.`)}
      ${statBox("Amount Credited", formatted, "#1F6F4A")}
      ${alertBox(`Provider: <strong>${providerLabel}</strong>`, "#1F6F4A")}
      ${ctaButton("View Your Balance", "https://app.kobklein.com/wallet")}
    `),
  };
}

export function kycApprovedEmail(name: string, tier: number): { subject: string; html: string } {
  return {
    subject: "KobKlein: Identity Verified — KYC Approved",
    html: base("KYC Approved", `
      ${heading("Identity Verified")}
      ${para(`Congratulations, ${name}. Your identity has been verified and your account has been upgraded to KYC Tier ${tier}.`)}
      ${statBox("KYC Tier", `Tier ${tier}`, "#1F6F4A")}
      ${para("You now have access to higher transaction limits and premium features.")}
      ${ctaButton("Explore Your Account", "https://app.kobklein.com/dashboard")}
    `),
  };
}

export function kycRejectedEmail(name: string, reason: string): { subject: string; html: string } {
  return {
    subject: "KobKlein: KYC Verification — Action Required",
    html: base("KYC Verification", `
      ${heading("Verification Incomplete")}
      ${para(`Hello ${name}, your KYC verification could not be completed at this time.`)}
      ${alertBox(`<strong>Reason:</strong> ${reason}`, "#EF4444")}
      ${para("Please re-submit your documents with the corrections noted above. Our team will review your updated submission promptly.")}
      ${ctaButton("Re-submit Documents", "https://app.kobklein.com/verify")}
      ${divider()}
      ${para("If you believe this is an error, please contact our support team.")}
    `),
  };
}

export function physicalCardShippedEmail(name: string, trackingNum: string): { subject: string; html: string } {
  return {
    subject: "KobKlein: Your Physical Card Has Shipped",
    html: base("Card Shipped", `
      ${heading("Your Card Is On Its Way")}
      ${para(`Great news, ${name}! Your KobKlein physical card has been shipped and is on its way to you.`)}
      <div style="background:#151B2E;border-radius:8px;padding:16px 20px;margin-bottom:20px">
        <p style="font-size:12px;color:#7A8394;margin-bottom:4px;text-transform:uppercase;letter-spacing:1px">Tracking Number</p>
        <p style="font-size:18px;color:#C6A756;font-weight:600;font-family:monospace">${trackingNum}</p>
      </div>
      ${para("You can track your shipment using the number above. Expected delivery is 3–7 business days.")}
      ${ctaButton("Track Your Card", "https://app.kobklein.com/card")}
    `),
  };
}

export function fraudAlertEmail(name: string, detail: string): { subject: string; html: string } {
  return {
    subject: "KobKlein: Security Alert on Your Account",
    html: base("Security Alert", `
      ${heading("Security Alert")}
      ${para(`Hello ${name}, we have detected suspicious activity on your account and wanted to alert you immediately.`)}
      ${alertBox(`<strong>Alert:</strong> ${detail}`, "#EF4444")}
      ${para("If this was you, no action is required. If you do not recognise this activity, please freeze your account and contact our support team immediately.")}
      ${ctaButton("Review Account Activity", "https://app.kobklein.com/settings/security")}
      ${divider()}
      ${para("Your security is our highest priority. We are here to help — contact support at any time.")}
    `),
  };
}

export function passwordChangedEmail(name: string): { subject: string; html: string } {
  return {
    subject: "KobKlein: Your Security Credentials Were Updated",
    html: base("Security Update", `
      ${heading("Security Credentials Updated")}
      ${para(`Hello ${name}, your account security credentials (password or transaction PIN) were recently updated.`)}
      ${alertBox("If you made this change, no further action is required.", "#C6A756")}
      ${para("If you did not make this change, your account may have been compromised. Please contact our support team immediately.")}
      ${ctaButton("Secure My Account", "https://app.kobklein.com/settings/security")}
    `),
  };
}

export function planUpgradeEmail(name: string, planName: string): { subject: string; html: string } {
  return {
    subject: `KobKlein: Welcome to the ${planName} Plan`,
    html: base("Plan Upgraded", `
      ${heading("Plan Upgraded")}
      ${para(`Congratulations, ${name}! Your KobKlein subscription has been upgraded.`)}
      ${statBox("Active Plan", planName, "#C6A756")}
      ${para("Your new plan features and limits are now active. Thank you for your continued trust in KobKlein.")}
      ${ctaButton("Explore Your Plan", "https://app.kobklein.com/settings/plan")}
    `),
  };
}

export function lowBalanceEmail(
  name: string,
  balance: number,
  currency: string,
): { subject: string; html: string } {
  const formatted = `${Number(balance).toLocaleString("fr-HT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;

  return {
    subject: "KobKlein: Low Float Alert — Refill Required",
    html: base("Low Float Alert", `
      ${heading("Low Float Alert")}
      ${para(`Hello ${name}, your distributor float balance has dropped below the minimum threshold.`)}
      ${statBox("Current Float Balance", formatted, "#EF4444")}
      ${alertBox("Please refill your float balance to continue serving cash-in and cash-out requests.", "#EF4444")}
      ${ctaButton("Refill Float", "https://app.kobklein.com/dashboard")}
    `),
  };
}
