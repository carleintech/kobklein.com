import { kkPost } from "./kobklein-api";

function newIdempotencyKey() {
  return crypto.randomUUID();
}

export async function attemptTransfer(data: {
  recipientUserId: string;
  amount: number;
  currency: string;
}) {
  const key = newIdempotencyKey();

  return kkPost<{
    ok?: boolean;
    transferId?: string;
    otpRequired?: boolean;
    challengeId?: string;
    otpCode?: string;
    riskLevel?: string;
    riskScore?: number;
  }>("v1/transfers/attempt", data, key);
}

export async function confirmTransfer(data: {
  challengeId: string;
  otpCode: string;
}) {
  return kkPost<{
    ok?: boolean;
    transferId?: string;
  }>("v1/transfers/confirm", data);
}
