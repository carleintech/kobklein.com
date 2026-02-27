import { MoncashService } from "./moncash.service";

// Helper to create a Response-like mock
function mockResponse(body: object, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

describe("MoncashService", () => {
  let service: MoncashService;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    service = new MoncashService();
    // Set required env vars
    process.env.MONCASH_CLIENT_ID = "test-client-id";
    process.env.MONCASH_CLIENT_SECRET = "test-secret";
    process.env.MONCASH_BASE_URL = "https://sandbox.moncashbutton.digicelhaiti.com";

    fetchSpy = jest.spyOn(global, "fetch" as any);
    // Clear token cache between tests
    (service as any).tokenCache = null;
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    delete process.env.MONCASH_CLIENT_ID;
    delete process.env.MONCASH_CLIENT_SECRET;
    delete process.env.MONCASH_BASE_URL;
  });

  // ─── Token auth mock ─────────────────────────────────────────

  function mockAuthToken() {
    return mockResponse({
      access_token: "mock-bearer-token",
      expires_in: 3600,
    });
  }

  // ─── initiate() ──────────────────────────────────────────────

  describe("initiate()", () => {
    it("fetches auth token and creates payment, returns orderId + redirectUrl", async () => {
      fetchSpy
        .mockResolvedValueOnce(mockAuthToken())
        .mockResolvedValueOnce(
          mockResponse({ payment_token: { token: "tok_abc123" } }),
        );

      const result = await service.initiate("user-001", 500, "HTG");

      expect(result.paymentToken).toBe("tok_abc123");
      expect(result.redirectUrl).toContain("tok_abc123");
      expect(result.orderId).toContain("user-00");
    });

    it("throws if CreatePayment call fails", async () => {
      fetchSpy
        .mockResolvedValueOnce(mockAuthToken())
        .mockResolvedValueOnce(mockResponse({}, false, 500));

      await expect(service.initiate("user-001", 500, "HTG")).rejects.toThrow();
    });

    it("throws if no MONCASH_CLIENT_ID configured", async () => {
      delete process.env.MONCASH_CLIENT_ID;
      await expect(service.initiate("user-001", 500, "HTG")).rejects.toThrow(
        /not configured/,
      );
    });

    it("caches the auth token — second call reuses it (fetch called once for auth)", async () => {
      fetchSpy
        .mockResolvedValueOnce(mockAuthToken())                               // auth
        .mockResolvedValueOnce(mockResponse({ payment_token: { token: "t1" } })) // payment 1
        .mockResolvedValueOnce(mockResponse({ payment_token: { token: "t2" } })); // payment 2

      await service.initiate("u1", 100, "HTG");
      await service.initiate("u2", 200, "HTG");

      // fetch called 3 times total: 1 auth + 2 payments (NOT 2 auths)
      expect(fetchSpy).toHaveBeenCalledTimes(3);
    });
  });

  // ─── verify() ────────────────────────────────────────────────

  describe("verify()", () => {
    it("returns confirmed with paidAmount on successful payment", async () => {
      fetchSpy
        .mockResolvedValueOnce(mockAuthToken())
        .mockResolvedValueOnce(
          mockResponse({ payment: { status: "SUCCESSFUL", cost: 500 } }),
        );

      const result = await service.verify("order-123");
      expect(result.status).toBe("confirmed");
      expect(result.paidAmount).toBe(500);
    });

    it("returns failed for FAILED status", async () => {
      fetchSpy
        .mockResolvedValueOnce(mockAuthToken())
        .mockResolvedValueOnce(
          mockResponse({ payment: { status: "FAILED" } }),
        );

      const result = await service.verify("order-456");
      expect(result.status).toBe("failed");
    });

    it("returns pending when payment object is missing", async () => {
      fetchSpy
        .mockResolvedValueOnce(mockAuthToken())
        .mockResolvedValueOnce(mockResponse({}));

      const result = await service.verify("order-789");
      expect(result.status).toBe("pending");
    });

    it("returns failed when RetrieveOrderPayment HTTP call fails", async () => {
      fetchSpy
        .mockResolvedValueOnce(mockAuthToken())
        .mockResolvedValueOnce(mockResponse({}, false, 404));

      const result = await service.verify("order-bad");
      expect(result.status).toBe("failed");
    });
  });
});
