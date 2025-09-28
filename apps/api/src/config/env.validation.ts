import { z } from "zod";

export const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  TZ: z.string().default("Asia/Jakarta"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_TTL: z.coerce.number().int().positive().default(2592000),
  STORAGE_DRIVER: z.enum(["supabase", "r2"]),
  SUPABASE_URL: z.string().url().optional().or(z.literal("")),
  SUPABASE_ANON_KEY: z.string().optional().or(z.literal("")),
  SUPABASE_SERVICE_KEY: z.string().optional().or(z.literal("")),
  SUPABASE_BUCKET: z.string().optional().or(z.literal("")),
  R2_ACCOUNT_ID: z.string().optional().or(z.literal("")),
  R2_ACCESS_KEY_ID: z.string().optional().or(z.literal("")),
  R2_SECRET_ACCESS_KEY: z.string().optional().or(z.literal("")),
  R2_BUCKET: z.string().optional().or(z.literal("")),
  R2_PUBLIC_BASE_URL: z.string().optional().or(z.literal("")),
  APP_BASE_URL: z.string().url(),
  EMAIL_FROM: z.string().email().optional().or(z.literal("")),
});

export type EnvironmentVariables = z.infer<typeof environmentSchema>;

export const validateEnvironment = (config: Record<string, unknown>) => {
  const result = environmentSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Invalid environment variables: ${result.error.toString()}`);
  }
  return result.data;
};
