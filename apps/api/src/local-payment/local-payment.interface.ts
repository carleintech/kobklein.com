export interface InitiateResult {
  orderId: string;
  redirectUrl?: string;
  paymentToken?: string;
}

export interface VerifyResult {
  status: "confirmed" | "failed" | "pending";
  paidAmount?: number;
}

export interface LocalPaymentProvider {
  initiate(userId: string, amount: number, currency: string): Promise<InitiateResult>;
  verify(orderId: string): Promise<VerifyResult>;
}
