// Mock the pool module before importing deposit.service
const mockQuery = jest.fn();
const mockClientQuery = jest.fn();
const mockClientRelease = jest.fn();
const mockConnect = jest.fn().mockResolvedValue({
  query: mockClientQuery,
  release: mockClientRelease,
});

jest.mock("../db/pool", () => ({
  pool: {
    query: mockQuery,
    connect: mockConnect,
  },
}));

jest.mock("./balance.service", () => ({
  invalidateBalance: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../services/event-bus.service", () => ({
  emitEvent: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../notifications/notification.service", () => ({
  notifyDepositSuccess: jest.fn().mockResolvedValue(undefined),
}));

import { postDeposit } from "./deposit.service";
import { invalidateBalance } from "./balance.service";

describe("postDeposit()", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // By default: no existing deposit (idempotency check returns empty)
    mockQuery.mockResolvedValue({ rows: [] });
    // Transactional client queries succeed
    mockClientQuery
      .mockResolvedValueOnce(undefined)           // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: "deposit-1", walletId: "w1", amount: 100 }] }) // INSERT Deposit
      .mockResolvedValueOnce({ rows: [] })         // INSERT LedgerEntry
      .mockResolvedValueOnce(undefined);           // COMMIT
  });

  it("inserts a Deposit and LedgerEntry on first call", async () => {
    await postDeposit({
      walletId: "w1",
      amount: 100,
      currency: "HTG",
      source: "moncash",
      idempotencyKey: "moncash:order-001",
    });

    // BEGIN + INSERT Deposit + INSERT LedgerEntry + COMMIT = 4 client queries
    expect(mockClientQuery).toHaveBeenCalledTimes(4);
    // First client query is BEGIN
    expect(mockClientQuery).toHaveBeenNthCalledWith(1, "BEGIN");
    // Second contains INSERT INTO "Deposit"
    expect(mockClientQuery.mock.calls[1][0]).toContain('INSERT INTO "Deposit"');
    // Third contains INSERT INTO "LedgerEntry"
    expect(mockClientQuery.mock.calls[2][0]).toContain('INSERT INTO "LedgerEntry"');
    // Fourth is COMMIT
    expect(mockClientQuery).toHaveBeenNthCalledWith(4, "COMMIT");
  });

  it("calls invalidateBalance after successful deposit", async () => {
    await postDeposit({
      walletId: "wallet-xyz",
      amount: 250,
      currency: "USD",
      source: "stripe",
      idempotencyKey: "stripe:pi_abc",
    });

    expect(invalidateBalance).toHaveBeenCalledWith("wallet-xyz");
  });

  it("returns existing deposit without inserting on duplicate idempotencyKey", async () => {
    const existing = { id: "deposit-existing", walletId: "w1", amount: 100 };
    // Idempotency check returns existing row
    mockQuery.mockResolvedValueOnce({ rows: [existing] });

    const result = await postDeposit({
      walletId: "w1",
      amount: 100,
      currency: "HTG",
      source: "moncash",
      idempotencyKey: "moncash:order-already-done",
    });

    expect(result).toEqual(existing);
    // No transactional client should be used (connect never called)
    expect(mockConnect).not.toHaveBeenCalled();
  });

  it("throws when amount is zero or negative", async () => {
    await expect(
      postDeposit({ walletId: "w1", amount: 0, currency: "HTG", source: "test", idempotencyKey: "k1" }),
    ).rejects.toThrow(/positive/i);

    await expect(
      postDeposit({ walletId: "w1", amount: -50, currency: "HTG", source: "test", idempotencyKey: "k2" }),
    ).rejects.toThrow(/positive/i);
  });

  it("rolls back transaction and rethrows on DB error", async () => {
    // Reset queue added by beforeEach, then set up the failure scenario
    mockClientQuery.mockReset();
    mockClientQuery
      .mockResolvedValueOnce(undefined)            // BEGIN
      .mockRejectedValueOnce(new Error("DB down")) // INSERT Deposit fails
      .mockResolvedValueOnce(undefined);            // ROLLBACK

    await expect(
      postDeposit({ walletId: "w1", amount: 100, currency: "HTG", source: "test", idempotencyKey: "k3" }),
    ).rejects.toThrow("DB down");

    // ROLLBACK should have been called
    expect(mockClientQuery).toHaveBeenCalledWith("ROLLBACK");
    // Connection should be released even on error
    expect(mockClientRelease).toHaveBeenCalled();
  });
});
