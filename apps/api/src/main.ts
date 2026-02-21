
// 1. Load .env first so SENTRY_DSN is available for instrument.ts
import { config } from "dotenv";
config();

// 2. Initialize Sentry BEFORE NestJS boots (reads process.env.SENTRY_DSN)
import "./instrument";

import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./filters/http-exception.filter";
import helmet from "helmet";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  // Security headers
  app.use(helmet());

  // Enable global validation (class-validator DTOs)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error on unknown properties
      transform: true,           // Auto-transform payloads to DTO instances
    })
  );

  // CORS — allow web, admin, web-public origins + dynamic CORS_ORIGINS env var
  const extraOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim())
    : [];

  app.enableCors({
    origin: [
      "http://localhost:3003", // web (dev)
      "http://localhost:3000", // web-public (dev)
      "http://localhost:3002", // admin (dev)
      "https://kobklein.com",
      "https://www.kobklein.com",
      "https://app.kobklein.com",
      "https://admin.kobklein.com",
      ...extraOrigins,
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID", "X-Idempotency-Key"],
  });

  // Global exception filter — consistent error JSON
  app.useGlobalFilters(new GlobalExceptionFilter());

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`KobKlein API running on port ${port}`);
}
bootstrap();
