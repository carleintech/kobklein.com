const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

function newIdempotencyKey() {
  return crypto.randomUUID();
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}/${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body}`);
  }

  return res.json();
}

export async function attemptTransfer(data: {
  recipientUserId: string;
  amount: number;
  currency: string;
}) {
  const key = newIdempotencyKey();

  return apiFetch<{
    ok?: boolean;
    transferId?: string;
    otpRequired?: boolean;
    challengeId?: string;
    riskLevel?: string;
    riskScore?: number;
  }>("v1/transfers/attempt", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": key,
    },
    body: JSON.stringify(data),
  });
}

export async function confirmTransfer(data: {
  challengeId: string;
  otpCode: string;
}) {
  return apiFetch<{
    ok?: boolean;
    transferId?: string;
  }>("v1/transfers/confirm", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
