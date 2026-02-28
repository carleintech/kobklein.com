
// 1. Load .env first so SENTRY_DSN is available for instrument.ts
import { config } from "dotenv";
config();

// 2. Initialize Sentry BEFORE NestJS boots (reads process.env.SENTRY_DSN)
import "./instrument";

import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./filters/http-exception.filter";
import helmet from "helmet";
import * as express from "express";

async function bootstrap() {
  // Disable NestJS's default body parsers (100 kb limit) so we can replace them
  // with 25 mb parsers that also capture rawBody for Stripe webhook verification.
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    bodyParser: false,
  });

  // Security headers
  app.use(helmet());

  // ── Custom body parsers (must come BEFORE route handlers) ──────────────────
  // Using bodyParser: false above so these are the ONLY parsers running.
  // The verify callback stores req.rawBody for Stripe / webhook signature checks.
  app.use(
    express.json({
      limit: "25mb",
      verify: (req: any, _res, buf) => {
        if (buf?.length) req.rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));

  // Enable global validation (class-validator DTOs)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
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
      "https://app-kobklein.com",
      "https://admin-kobklein.com",
      ...extraOrigins,
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID", "X-Idempotency-Key"],
  });

  // Swagger / OpenAPI — available at /api/docs (disabled in production by default)
  if (process.env.NODE_ENV !== "production" || process.env.SWAGGER_ENABLED === "true") {
    const swaggerDoc = new DocumentBuilder()
      .setTitle("KobKlein API")
      .setDescription(
        "KobKlein digital wallet REST API.\n\n" +
        "**Authentication:** All protected routes require a Supabase JWT in the `Authorization: Bearer <token>` header.\n\n" +
        "**Base URL (production):** `https://api.app-kobklein.com`\n\n" +
        "**Rate limit:** 120 requests / minute per IP."
      )
      .setVersion("1.0")
      .setContact("KobKlein Dev Team", "https://kobklein.com", "dev@kobklein.com")
      .setLicense("Proprietary", "https://kobklein.com/terms")
      .addBearerAuth(
        { type: "http", scheme: "bearer", bearerFormat: "JWT", description: "Supabase access token" },
        "supabase-jwt",
      )
      .addTag("Auth", "Authentication and user profile")
      .addTag("Wallets", "Wallet balance and ledger")
      .addTag("Transfers", "Send money between users")
      .addTag("Merchant", "Merchant payments and stats")
      .addTag("Distributor", "Distributor cash-in/cash-out")
      .addTag("KYC", "Know Your Customer verification")
      .addTag("Cards", "Virtual and physical cards")
      .addTag("Admin", "Admin-only management endpoints")
      .addTag("Support", "Support ticket system")
      .addTag("Webhooks", "Stripe and external webhooks")
      .build();

    const document = SwaggerModule.createDocument(app, swaggerDoc);
    SwaggerModule.setup("api/docs", app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: "none",
        filter: true,
        showExtensions: true,
      },
      customSiteTitle: "KobKlein API Docs",
      customCss: `
        .swagger-ui .topbar { background-color: #080B14; }
        .swagger-ui .topbar-wrapper img { content: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 30"><text y="24" font-size="20" fill="%23C6A756" font-family="serif">KobKlein</text></svg>'); }
      `,
    });

    console.log(`Swagger UI: http://localhost:${process.env.PORT ?? 3001}/api/docs`);
  }

  // Global exception filter — consistent error JSON
  app.useGlobalFilters(new GlobalExceptionFilter());

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`KobKlein API running on port ${port}`);
}
bootstrap();
