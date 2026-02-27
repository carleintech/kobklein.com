import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from "plaid";
import * as crypto from "crypto";
import { prisma } from "../db/prisma";
import { StripeService } from "../services/stripe.service";
import { computeWalletBalance } from "../wallets/balance.service";

// ─── Encryption helpers ────────────────────────────────────────────────────────
// Plaid access tokens are encrypted at rest using AES-256-GCM

const ENCRYPTION_KEY = process.env.PLAID_ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_KEY?.slice(0, 32) || "";
const ALGORITHM = "aes-256-gcm";

function encryptToken(token: string): string {
  if (!ENCRYPTION_KEY) throw new Error("PLAID_ENCRYPTION_KEY not set");
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32));
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

function decryptToken(enc: string): string {
  if (!ENCRYPTION_KEY) throw new Error("PLAID_ENCRYPTION_KEY not set");
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32));
  const [ivHex, tagHex, dataHex] = enc.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const data = Buffer.from(dataHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

// ─── Plaid client ──────────────────────────────────────────────────────────────

function createPlaidClient(): PlaidApi {
  const env = process.env.PLAID_ENV || "sandbox";
  const basePath =
    env === "production"
      ? PlaidEnvironments.production
      : env === "development"
        ? PlaidEnvironments.development
        : PlaidEnvironments.sandbox;

  const config = new Configuration({
    basePath,
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID || "",
        "PLAID-SECRET": process.env.PLAID_SECRET || "",
      },
    },
  });
  return new PlaidApi(config);
}

// ─── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class PlaidService {
  private readonly stripe: StripeService;

  constructor(stripe: StripeService) {
    this.stripe = stripe;
  }

  /**
   * Create a Plaid Link token for the frontend to initialize Plaid Link.
   * Returns: { linkToken, expiration }
   */
  async createLinkToken(userId: string, userEmail?: string) {
    if (!process.env.PLAID_CLIENT_ID) {
      // Return a structured "not configured" response instead of crashing —
      // the frontend PlaidLinkButton component checks for configured: false
      // and shows a "Coming Soon" state instead of an error.
      return { configured: false as const, linkToken: null, expiration: null };
    }

    const client = createPlaidClient();
    const response = await client.linkTokenCreate({
      user: { client_user_id: userId, email_address: userEmail },
      client_name: "KobKlein",
      products: [Products.Auth],
      country_codes: [CountryCode.Us, CountryCode.Ca],
      language: "en",
      redirect_uri: process.env.PLAID_REDIRECT_URI,
    });

    return {
      linkToken: response.data.link_token,
      expiration: response.data.expiration,
    };
  }

  /**
   * Exchange the public_token from Plaid Link for a persistent access_token.
   * Then fetch accounts and store the linked account in DB (encrypted).
   */
  async exchangePublicToken(userId: string, publicToken: string, institutionName?: string) {
    const client = createPlaidClient();

    // Exchange token
    const exchangeResponse = await client.itemPublicTokenExchange({ public_token: publicToken });
    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    // Fetch accounts
    const accountsResponse = await client.accountsGet({ access_token: accessToken });
    const accounts = accountsResponse.data.accounts;
    const institution = accountsResponse.data.item;

    if (!accounts.length) {
      throw new BadRequestException("No accounts found for this bank connection");
    }

    // Pick the first checking/savings account
    const account = accounts.find((a) =>
      ["checking", "savings"].includes(a.subtype ?? "")
    ) ?? accounts[0];

    const last4 = account.mask ?? "0000";
    const institutionId = institution.institution_id ?? "unknown";
    const finalInstitutionName = institutionName ?? accountsResponse.data.item.institution_id ?? "Bank";

    // Encrypt access token at rest
    const encryptedToken = encryptToken(accessToken);

    // Upsert PlaidAccount record
    const existing = await prisma.plaidAccount.findUnique({
      where: { userId_accountId: { userId, accountId: account.account_id } },
    });

    let plaidAccount;
    if (existing) {
      plaidAccount = await prisma.plaidAccount.update({
        where: { id: existing.id },
        data: {
          plaidAccessTokenEnc: encryptedToken,
          plaidItemId: itemId,
          status: "active",
          accountName: account.name,
          accountType: account.subtype ?? "checking",
          last4,
          institutionId,
          institutionName: finalInstitutionName,
        },
      });
    } else {
      plaidAccount = await prisma.plaidAccount.create({
        data: {
          userId,
          plaidItemId: itemId,
          plaidAccessTokenEnc: encryptedToken,
          institutionId,
          institutionName: finalInstitutionName,
          accountId: account.account_id,
          accountName: account.name,
          last4,
          accountType: account.subtype ?? "checking",
          status: "active",
        },
      });
    }

    return {
      id: plaidAccount.id,
      institutionName: plaidAccount.institutionName,
      accountName: plaidAccount.accountName,
      last4: plaidAccount.last4,
      accountType: plaidAccount.accountType,
      status: plaidAccount.status,
    };
  }

  /**
   * List linked bank accounts for a user.
   */
  async getLinkedAccounts(userId: string) {
    const accounts = await prisma.plaidAccount.findMany({
      where: { userId, status: "active" },
      select: {
        id: true,
        institutionName: true,
        accountName: true,
        last4: true,
        accountType: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return { accounts };
  }

  /**
   * Initiate an ACH top-up using a linked Plaid bank account.
   * Flow: Plaid access token → Stripe Bank Account → Charge → Credit wallet.
   *
   * For sandbox: Returns a mock success since ACH isn't actually processed.
   */
  async initiateAchTopup(userId: string, plaidAccountId: string, amountUsd: number) {
    if (amountUsd < 5 || amountUsd > 5000) {
      throw new BadRequestException("Amount must be between $5 and $5,000 USD");
    }

    const plaidAccount = await prisma.plaidAccount.findFirst({
      where: { id: plaidAccountId, userId, status: "active" },
    });
    if (!plaidAccount) throw new NotFoundException("Bank account not found");

    // Find or create USD wallet for diaspora user
    let wallet = await prisma.wallet.findFirst({
      where: { userId, currency: "USD", type: "USER" },
    });
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId, currency: "USD", type: "USER" },
      });
    }

    const amountCents = Math.round(amountUsd * 100);

    // In sandbox mode: use Stripe test bank token
    const isSandbox = (process.env.PLAID_ENV || "sandbox") === "sandbox";
    let stripePaymentMethodId = plaidAccount.stripePaymentMethodId;

    if (!stripePaymentMethodId) {
      if (isSandbox) {
        // Use Stripe's test bank token for sandbox testing
        stripePaymentMethodId = "pm_usBankAccount_testABARoutingNumber"; // test token
      } else {
        // Production: Create Stripe payment method via Plaid token exchange
        const client = createPlaidClient();
        const accessToken = decryptToken(plaidAccount.plaidAccessTokenEnc);
        const stripeTokenResponse = await client.processorStripeBankAccountTokenCreate({
          access_token: accessToken,
          account_id: plaidAccount.accountId,
        });
        const stripeBankToken = stripeTokenResponse.data.stripe_bank_account_token;

        // Create Stripe payment method from bank token
        const stripeService = this.stripe as any;
        const pm = await stripeService.stripe.paymentMethods.create({
          type: "us_bank_account",
          us_bank_account: { account_holder_type: "individual" },
        });
        stripePaymentMethodId = stripeBankToken; // Use bank token directly for ACH

        // Save for future use
        await prisma.plaidAccount.update({
          where: { id: plaidAccountId },
          data: { stripePaymentMethodId },
        });
      }
    }

    // Create a PaymentIntent for ACH
    const stripeService = this.stripe as any;
    let paymentIntentId: string;
    let clientSecret: string;

    if (isSandbox) {
      // Sandbox: create a card PaymentIntent to simulate the flow
      const pi = await stripeService.stripe.paymentIntents.create({
        amount: amountCents,
        currency: "usd",
        payment_method_types: ["card"],
        metadata: {
          walletId: wallet.id,
          userId,
          source: "plaid_ach",
          plaidAccountId,
        },
      });
      paymentIntentId = pi.id;
      clientSecret = pi.client_secret;
    } else {
      // Production: ACH PaymentIntent
      const pi = await stripeService.stripe.paymentIntents.create({
        amount: amountCents,
        currency: "usd",
        payment_method_types: ["us_bank_account"],
        payment_method: stripePaymentMethodId,
        confirm: true,
        mandate_data: {
          customer_acceptance: {
            type: "online",
            online: { ip_address: "127.0.0.1", user_agent: "KobKlein-App" },
          },
        },
        metadata: {
          walletId: wallet.id,
          userId,
          source: "plaid_ach",
          plaidAccountId,
        },
      });
      paymentIntentId = pi.id;
      clientSecret = pi.client_secret;
    }

    return {
      paymentIntentId,
      clientSecret,
      amountUsd,
      walletId: wallet.id,
      institutionName: plaidAccount.institutionName,
      last4: plaidAccount.last4,
      status: "initiated",
      message: "ACH transfer initiated. Funds typically arrive in 1-3 business days.",
    };
  }

  /**
   * Unlink (deactivate) a Plaid bank account.
   */
  async unlinkAccount(userId: string, plaidAccountId: string) {
    const account = await prisma.plaidAccount.findFirst({
      where: { id: plaidAccountId, userId },
    });
    if (!account) throw new NotFoundException("Bank account not found");

    // Optionally: revoke Plaid access token in production
    if ((process.env.PLAID_ENV || "sandbox") !== "sandbox") {
      try {
        const client = createPlaidClient();
        const accessToken = decryptToken(account.plaidAccessTokenEnc);
        await client.itemRemove({ access_token: accessToken });
      } catch {
        // Best-effort — still deactivate locally
      }
    }

    await prisma.plaidAccount.update({
      where: { id: plaidAccountId },
      data: { status: "inactive" },
    });

    return { ok: true, message: "Bank account unlinked" };
  }
}
