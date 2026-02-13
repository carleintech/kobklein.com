import { initSentry } from "./monitoring/sentry";

// Initialize Sentry BEFORE other imports
initSentry();

import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./filters/http-exception.filter";
import helmet from "helmet";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  // Security headers
  app.use(helmet());

  // CORS — allow web, admin, web-public origins
  app.enableCors({
    origin: [
      "http://localhost:3003", // web (dev)
      "http://localhost:3004", // web-public (dev)
      "http://localhost:3005", // admin (dev)
      "https://kobklein.com",
      "https://www.kobklein.com",
      "https://app.kobklein.com",
      "https://admin.kobklein.com",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID", "X-Idempotency-Key"],
  });

  // Global exception filter — consistent error JSON
  app.useGlobalFilters(new GlobalExceptionFilter());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`KobKlein API running on port ${port}`);
}
bootstrap();
