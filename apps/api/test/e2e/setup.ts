import { INestApplication, VersioningType } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import request, { type SuperTest, type Test as SuperTestRequest } from "supertest";
import { newDb } from "pg-mem";
import { Pool } from "pg";
import { vi } from "vitest";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { createDbClient, type Database } from "../../src/db/client";
import { AuthController } from "../../src/modules/auth/auth.controller";
import { StorageController } from "../../src/modules/storage/storage.controller";
import { DRIZZLE_CLIENT } from "../../src/infrastructure/database/database.constants";
import { RedisService } from "../../src/infrastructure/redis/redis.service";
import { REDIS_CLIENT } from "../../src/infrastructure/redis/redis.constants";
import {
  REPORT_PDF_QUEUE,
  NOTIFY_EMAIL_QUEUE,
} from "../../src/infrastructure/queue/queue.constants";
import type { Queue } from "bullmq";
import { UsersService } from "../../src/modules/users/users.service";
import { AuthService } from "../../src/modules/auth/auth.service";
import { StorageService } from "../../src/modules/storage/storage.service";
import type { EnvironmentVariables } from "../../src/config/env.validation";

export interface E2EAppContext {
  app: INestApplication;
  db: Database;
  pool: Pool;
  redis: InMemoryRedisClient;
  usersService: UsersService;
  authService: AuthService;
  request: SuperTest<SuperTestRequest>;
  restoreEnv: () => void;
}

const BASE_ENV: Record<string, string> = {
  NODE_ENV: "test",
  TZ: "UTC",
  PORT: "3001",
  DATABASE_URL: "postgres://test:test@localhost:5432/test",
  REDIS_URL: "redis://localhost:6379",
  JWT_ACCESS_SECRET: "test-access-secret-change-me-1234567890",
  JWT_REFRESH_SECRET: "test-refresh-secret-change-me-1234567890",
  JWT_ACCESS_TTL: "900",
  JWT_REFRESH_TTL: "2592000",
  CORS_ALLOWED_ORIGINS: "http://localhost:5173,https://api.local.test",
  AUTH_MAX_LOGIN_ATTEMPTS: "5",
  AUTH_LOCKOUT_DURATION: "900",
  ARGON2_MEMORY_COST: "19456",
  ARGON2_TIME_COST: "2",
  STORAGE_DRIVER: "supabase",
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_ANON_KEY: "anon",
  SUPABASE_SERVICE_KEY: "service",
  SUPABASE_BUCKET: "public",
  R2_ACCOUNT_ID: "",
  R2_ACCESS_KEY_ID: "",
  R2_SECRET_ACCESS_KEY: "",
  R2_BUCKET: "",
  R2_PUBLIC_BASE_URL: "",
  APP_BASE_URL: "http://localhost:5173",
  EMAIL_FROM: "no-reply@example.local",
};

class FakeConfigService {
  constructor(private readonly store: Record<string, string>) {}

  private coerce(value: string, infer?: boolean) {
    if (!infer) {
      return value;
    }

    if (value === "true" || value === "false") {
      return value === "true";
    }

    const numeric = Number(value);
    if (!Number.isNaN(numeric)) {
      return numeric;
    }

    return value;
  }

  private lookup(key: string) {
    if (key in this.store) {
      return this.store[key];
    }
    return process.env[key];
  }

  get<T = EnvironmentVariables[keyof EnvironmentVariables]>(
    key: keyof EnvironmentVariables | string,
    options?: { infer?: boolean }
  ): T | undefined {
    const raw = this.lookup(key);
    if (raw === undefined || raw === null) {
      return undefined;
    }
    return this.coerce(raw, options?.infer) as unknown as T;
  }

  getOrThrow<T = EnvironmentVariables[keyof EnvironmentVariables]>(
    key: keyof EnvironmentVariables | string,
    options?: { infer?: boolean }
  ): T {
    const value = this.get<T>(key, options);
    if (value === undefined || value === null || value === ("" as unknown as T)) {
      throw new Error(`Missing environment variable ${key}`);
    }
    return value;
  }
}

export class InMemoryRedisClient {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  private resolveEntry(key: string) {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }

    return entry;
  }

  async set(key: string, value: string, mode?: string, ttl?: number) {
    const entry = { value, expiresAt: undefined as number | undefined };

    if (mode === "EX" && typeof ttl === "number") {
      entry.expiresAt = Date.now() + ttl * 1000;
    }

    this.store.set(key, entry);
    return "OK";
  }

  async get(key: string) {
    const entry = this.resolveEntry(key);
    return entry?.value ?? null;
  }

  async del(...keys: string[]) {
    let removed = 0;
    for (const key of keys) {
      if (this.store.delete(key)) {
        removed += 1;
      }
    }
    return removed;
  }

  async incr(key: string) {
    const current = Number((await this.get(key)) ?? "0");
    const next = current + 1;
    await this.set(key, String(next));
    return next;
  }

  async expire(key: string, seconds: number) {
    const entry = this.resolveEntry(key);
    if (!entry) {
      return 0;
    }
    entry.expiresAt = Date.now() + seconds * 1000;
    this.store.set(key, entry);
    return 1;
  }

  async ttl(key: string) {
    const entry = this.resolveEntry(key);
    if (!entry) {
      return -2;
    }
    if (!entry.expiresAt) {
      return -1;
    }
    return Math.max(1, Math.ceil((entry.expiresAt - Date.now()) / 1000));
  }

  async exists(key: string) {
    return (await this.get(key)) ? 1 : 0;
  }

  duplicate() {
    return this;
  }

  clear() {
    this.store.clear();
  }
}

class FakeRedisService {
  constructor(public readonly client: InMemoryRedisClient) {}
}

const fakeQueue = { add: vi.fn() } as unknown as Queue;

const createTablesSql = `
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL,
    teacher_id TEXT,
    student_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE refresh_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    jti TEXT NOT NULL UNIQUE,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_agent TEXT,
    ip_address TEXT
  );

  CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
`;

export async function setupE2EApp(
  envOverrides: Partial<Record<string, string>> = {}
): Promise<E2EAppContext> {
  const mergedEnv = { ...BASE_ENV, ...envOverrides };
  const envToApply: Record<string, string> = Object.fromEntries(
    Object.entries(mergedEnv).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string"
    )
  );
  const previousEnv = new Map<string, string | undefined>();

  for (const [key, value] of Object.entries(envToApply)) {
    previousEnv.set(key, process.env[key]);
    process.env[key] = value;
  }

  const { AppModule } = await import("../../src/app.module");
  const configService = new FakeConfigService(envToApply);

  const dbInstance = newDb({ autoCreateForeignKeyIndices: true });
  dbInstance.public.none(createTablesSql);

  const adapter = dbInstance.adapters.createPg();
  const pool = new adapter.Pool();

  const getPassthroughParser = () => (value: unknown) => value;
  const typeParser = { getTypeParser: () => getPassthroughParser() };

  const assignTypeParser = (target: Record<string, unknown>) => {
    Object.assign(target, {
      types: typeParser,
    });
  };

  assignTypeParser(((pool as unknown as { options?: Record<string, unknown> }).options ??= {}));
  assignTypeParser(((pool as unknown as { config?: Record<string, unknown> }).config ??= {}));

  const scrubQueryArgs = (args: unknown[]) => {
    if (args.length === 0) {
      return { args, rowMode: undefined as string | undefined };
    }

    const [config] = args;
    let rowMode: string | undefined;
    if (config && typeof config === "object") {
      const record = config as Record<string, unknown>;
      if ("types" in record) {
        delete record.types;
      }
      if ("rowMode" in record) {
        rowMode = String(record.rowMode);
        delete record.rowMode;
      }
    }

    return { args, rowMode };
  };

  const adaptRowModeResult = <T extends { rows: unknown[]; fields?: Array<{ name: string }> }>(
    result: T,
    rowMode?: string
  ): T => {
    if (
      !result ||
      rowMode !== "array" ||
      !Array.isArray(result.rows) ||
      !Array.isArray(result.fields)
    ) {
      return result;
    }

    let derivedFieldNames =
      result.fields!.length > 0 ? result.fields!.map((field) => field.name) : undefined;

    const rowsAsArrays = result.rows.map((row, index) => {
      if (Array.isArray(row)) {
        return row;
      }

      if (row && typeof row === "object") {
        const record = row as Record<string, unknown>;
        derivedFieldNames ??= Object.keys(record);

        const arrayRow = derivedFieldNames.map((field) => record[field]);
        if (process.env.NODE_ENV === "test" && index === 0) {
          // eslint-disable-next-line no-console
          console.error("Adapted rowMode result", { fields: derivedFieldNames, record, arrayRow });
        }
        return arrayRow;
      }

      return row;
    });

    const nextFields = derivedFieldNames?.map((name) => ({ name }));

    const nextResult = Object.assign(Object.create(Object.getPrototypeOf(result)), result, {
      rows: rowsAsArrays,
      ...(nextFields ? { fields: nextFields } : {}),
    });

    return nextResult;
  };

  const originalPoolQuery = pool.query.bind(pool);
  pool.query = (async (...args: Parameters<typeof originalPoolQuery>) => {
    const { args: scrubbedArgs, rowMode } = scrubQueryArgs(args);
    const result = await originalPoolQuery(
      ...(scrubbedArgs as Parameters<typeof originalPoolQuery>)
    );
    return adaptRowModeResult(result, rowMode);
  }) as typeof pool.query;

  const originalConnect = pool.connect.bind(pool);
  pool.connect = async (...args: Parameters<typeof originalConnect>) => {
    const client = await originalConnect(...args);
    assignTypeParser(((client as unknown as { types?: Record<string, unknown> }).types ??= {}));
    const originalClientQuery = client.query.bind(client);
    client.query = (async (...clientArgs: Parameters<typeof originalClientQuery>) => {
      const { args: scrubbedArgs, rowMode } = scrubQueryArgs(clientArgs);
      const result = await originalClientQuery(
        ...(scrubbedArgs as Parameters<typeof originalClientQuery>)
      );
      return adaptRowModeResult(result, rowMode);
    }) as typeof client.query;
    return client;
  };
  const db = createDbClient(pool);

  const redisClient = new InMemoryRedisClient();

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(ConfigService)
    .useValue(configService)
    .overrideProvider(Pool)
    .useValue(pool)
    .overrideProvider(DRIZZLE_CLIENT)
    .useValue(db)
    .overrideProvider(RedisService)
    .useValue(new FakeRedisService(redisClient))
    .overrideProvider(REDIS_CLIENT)
    .useValue(redisClient)
    .overrideProvider(REPORT_PDF_QUEUE)
    .useValue(fakeQueue)
    .overrideProvider(NOTIFY_EMAIL_QUEUE)
    .useValue(fakeQueue)
    .overrideProvider(StorageService)
    .useValue({
      presign: vi.fn(async () => ({
        driver: "supabase" as const,
        upload: {
          url: "https://example.com/upload",
          method: "PUT" as const,
          headers: {},
          expiresIn: 60,
        },
        asset: {
          path: "public/uploads/dummy.txt",
          publicUrl: "https://example.com/public/uploads/dummy.txt",
        },
      })),
    })
    .compile();

  const app = moduleRef.createNestApplication();

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
  const parsedOrigins = allowedOriginsRaw
    .split(",")
    .map((origin: string) => origin.trim())
    .filter((origin: string) => origin.length > 0);

  if (appBaseUrl) {
    parsedOrigins.push(String(appBaseUrl));
  }

  const corsOrigins: string[] =
    parsedOrigins.length > 0 ? Array.from(new Set(parsedOrigins)) : ["http://localhost:5173"];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type", "Accept", "X-Requested-With", "X-CSRF-Token"],
  });

  await app.init();

  const authController = app.get(AuthController);
  const storageController = app.get(StorageController);

  // eslint-disable-next-line no-console
  console.log("Throttle metadata", {
    login: {
      limit: Reflect.getMetadata("THROTTLER_LIMITdefault", authController.login),
      ttl: Reflect.getMetadata("THROTTLER_TTLdefault", authController.login),
    },
    refresh: {
      limit: Reflect.getMetadata("THROTTLER_LIMITdefault", authController.refresh),
      ttl: Reflect.getMetadata("THROTTLER_TTLdefault", authController.refresh),
    },
    storage: {
      limit: Reflect.getMetadata("THROTTLER_LIMITdefault", storageController.presign),
      ttl: Reflect.getMetadata("THROTTLER_TTLdefault", storageController.presign),
    },
  });

  const usersService = app.get(UsersService);
  const authService = app.get(AuthService);
  const httpServer = app.getHttpServer();

  const restoreEnv = () => {
    for (const [key, val] of previousEnv.entries()) {
      if (val === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = val;
      }
    }
  };

  return {
    app,
    db,
    pool,
    redis: redisClient,
    usersService,
    authService,
    request: request(httpServer) as unknown as SuperTest<SuperTestRequest>,
    restoreEnv,
  };
}

export async function teardownE2EApp(ctx?: E2EAppContext) {
  if (!ctx) {
    return;
  }
  await ctx.app.close();
  await ctx.pool.end();
  ctx.restoreEnv();
}

export async function resetAuthState(ctx: E2EAppContext) {
  ctx.redis.clear();
  await ctx.pool.query("TRUNCATE TABLE refresh_tokens RESTART IDENTITY CASCADE");
  await ctx.pool.query("TRUNCATE TABLE users RESTART IDENTITY CASCADE");
}

export function decodeJwt(token: string) {
  const [, payload] = token.split(".");
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
}

export function getEnvNumber(key: string, fallback: number) {
  const raw = process.env[key];
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}
