import { Injectable, Logger } from "@nestjs/common";
import { LocalPaymentProvider, InitiateResult, VerifyResult } from "./local-payment.interface";

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

@Injectable()
export class MoncashService implements LocalPaymentProvider {
  private readonly logger = new Logger(MoncashService.name);
  private tokenCache: TokenCache | null = null;

  private get baseUrl(): string {
    return process.env.MONCASH_BASE_URL ?? "https://sandbox.moncashbutton.digicelhaiti.com";
  }

  private get clientId(): string {
    return process.env.MONCASH_CLIENT_ID ?? "";
  }

  private get clientSecret(): string {
    return process.env.MONCASH_CLIENT_SECRET ?? "";
  }

  // ─── Auth token (cached) ─────────────────────────────────────

  private async getAccessToken(): Promise<string> {
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now() + 30_000) {
      return this.tokenCache.accessToken;
    }

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");
    const res = await fetch(`${this.baseUrl}/oauth/token?grant_type=client_credentials`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`MonCash auth failed (${res.status}): ${text}`);
    }

    const data = await res.json() as { access_token: string; expires_in: number };
    this.tokenCache = {
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
    };

    return this.tokenCache.accessToken;
  }

  // ─── Initiate payment ─────────────────────────────────────────

  async initiate(userId: string, amount: number, _currency: string): Promise<InitiateResult> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error("MONCASH_CLIENT_ID / MONCASH_CLIENT_SECRET not configured");
    }

    const token = await this.getAccessToken();
    // orderId must be unique per transaction — use userId + timestamp
    const orderId = `kk-${userId.slice(0, 8)}-${Date.now()}`;

    const res = await fetch(`${this.baseUrl}/Api/v1/CreatePayment`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ amount, orderId }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`MonCash CreatePayment failed (${res.status}): ${text}`);
    }

    const data = await res.json() as { payment_token?: { token?: string }; timestamp?: number };
    const paymentToken = data.payment_token?.token;

    if (!paymentToken) {
      throw new Error("MonCash did not return a payment_token");
    }

    const redirectUrl = `${this.baseUrl}/Payment?token=${paymentToken}`;

    this.logger.log(`MonCash payment initiated: orderId=${orderId}`);
    return { orderId, paymentToken, redirectUrl };
  }

  // ─── Verify payment ───────────────────────────────────────────

  async verify(orderId: string): Promise<VerifyResult> {
    const token = await this.getAccessToken();

    const res = await fetch(`${this.baseUrl}/Api/v1/RetrieveOrderPayment`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ orderId }),
    });

    if (!res.ok) {
      this.logger.warn(`MonCash verify failed (${res.status}) for orderId=${orderId}`);
      return { status: "failed" };
    }

    const data = await res.json() as {
      payment?: { status?: string; cost?: number; reference?: string };
    };
    const payment = data.payment;

    if (!payment) return { status: "pending" };

    const statusStr = (payment.status ?? "").toLowerCase();

    if (statusStr === "successful" || statusStr === "success") {
      return { status: "confirmed", paidAmount: payment.cost };
    }
    if (statusStr === "failed" || statusStr === "cancelled") {
      return { status: "failed" };
    }
    return { status: "pending" };
  }
}
