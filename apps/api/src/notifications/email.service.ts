/**
 * Email Service — Resend
 *
 * Provides transactional email delivery for KobKlein.
 * Falls back to console logging when RESEND_API_KEY is not configured (dev mode).
 */

let resendClient: any = null;

function getResendClient() {
  if (resendClient) return resendClient;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  // Lazy import to avoid loading resend when not configured
  try {
    const { Resend } = require("resend");
    resendClient = new Resend(apiKey);
    return resendClient;
  } catch {
    console.warn("[Email] Failed to initialize Resend client");
    return null;
  }
}

/**
 * Check if email sending is configured.
 */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/**
 * Send a transactional email via Resend.
 *
 * Falls back to console logging if not configured.
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const client = getResendClient();
  const from = process.env.RESEND_FROM || "KobKlein <noreply@kobklein.com>";

  if (!client) {
    console.log(`[EMAIL-DEV] → ${to}: ${subject}\n${html}`);
    return;
  }

  try {
    await client.emails.send({
      from,
      to,
      subject,
      html,
    });
    console.log(`[Email] ✓ Sent to ${to}: ${subject}`);
  } catch (err: any) {
    console.error(`[Email] ✗ Failed to send to ${to}: ${err.message}`);
    throw err;
  }
}
