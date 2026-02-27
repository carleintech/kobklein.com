import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { HealthController } from "../src/health.controller";

/**
 * Health endpoint tests — lightweight, no DB/Redis connections required.
 * Mocks Prisma and Redis so the test runs cleanly in CI without env vars.
 */
describe("Health endpoints", () => {
  let app: INestApplication;

  // Mock Prisma and Redis before the module loads
  jest.mock("../src/db/prisma", () => ({
    prisma: {
      $queryRawUnsafe: jest.fn().mockResolvedValue([{ "?column?": 1 }]),
    },
  }));

  jest.mock("../src/services/redis.client", () => ({
    redis: {
      isOpen: true,
      ping: jest.fn().mockResolvedValue("PONG"),
    },
  }));

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /health/ping → 200 with { ok: true }", () => {
    return request(app.getHttpServer())
      .get("/health/ping")
      .expect(200)
      .expect((res) => {
        expect(res.body.ok).toBe(true);
      });
  });

  it("GET /health → 200 with service name and status", () => {
    return request(app.getHttpServer())
      .get("/health")
      .expect(200)
      .expect((res) => {
        expect(res.body.service).toBe("kobklein-api");
        expect(["ok", "degraded"]).toContain(res.body.status);
        expect(typeof res.body.uptime).toBe("number");
        expect(res.body.checks).toBeDefined();
      });
  });
});
