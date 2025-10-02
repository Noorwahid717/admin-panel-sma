import "reflect-metadata";
import { Logger, VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import type { EnvironmentVariables } from "./config/env.validation";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configService = app.get(ConfigService<EnvironmentVariables>);

  app.setGlobalPrefix("api");
  app.enableVersioning({ type: VersioningType.URI });
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  const appBaseUrl = configService.get("APP_BASE_URL", { infer: true });
  const allowedOriginsRaw = configService.get("CORS_ALLOWED_ORIGINS", { infer: true }) ?? "";
  const parsedOrigins = allowedOriginsRaw
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  if (appBaseUrl) {
    parsedOrigins.push(appBaseUrl);
  }

  const corsOrigins =
    parsedOrigins.length > 0 ? Array.from(new Set(parsedOrigins)) : ["http://localhost:5173"];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type", "Accept", "X-Requested-With", "X-CSRF-Token"],
  });

  app.useLogger(new Logger());

  const port = configService.get("PORT", { infer: true }) ?? 3000;
  await app.listen(port);
  Logger.log(`API running on port ${port}`, "Bootstrap");
}

bootstrap().catch((error) => {
  const logger = new Logger("Bootstrap");
  logger.error(error);
  process.exit(1);
});
