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
  const allowedOriginsValue = configService.get("CORS_ALLOWED_ORIGINS", { infer: true });
  const allowedOriginsRaw =
    typeof allowedOriginsValue === "string"
      ? allowedOriginsValue
      : String(allowedOriginsValue ?? "");

  const corsOrigins = Array.from(
    new Set(
      [
        ...allowedOriginsRaw
          .split(",")
          .map((origin) => origin.trim())
          .filter((origin) => origin.length > 0),
        appBaseUrl,
      ].filter((origin): origin is string => Boolean(origin))
    )
  );

  if (corsOrigins.length === 0) {
    throw new Error("No CORS origins configured");
  }

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
