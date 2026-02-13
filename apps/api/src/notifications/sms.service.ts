import Twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE;

let client: ReturnType<typeof Twilio> | null = null;

function getClient() {
  if (!client) {
    if (!accountSid || !authToken) {
      throw new Error("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set");
    }
    client = Twilio(accountSid, authToken);
  }
  return client;
}

/**
 * Send an SMS via Twilio.
 * @returns Twilio message SID on success
 */
export async function sendSMS(to: string, body: string): Promise<string> {
  if (!fromPhone) throw new Error("TWILIO_PHONE must be set");

  // Normalize Haitian numbers: +509XXXXXXXX
  const normalized = to.startsWith("+") ? to : `+509${to.replace(/\D/g, "")}`;

  const msg = await getClient().messages.create({
    body,
    from: fromPhone,
    to: normalized,
  });

  console.log(`SMS sent to ${normalized} → sid: ${msg.sid}`);
  return msg.sid;
}

/**
 * Check if Twilio is configured (env vars present).
 * Returns false in dev/test when credentials aren't set.
 */
export function isTwilioConfigured(): boolean {
  return Boolean(accountSid && authToken && fromPhone);
}
