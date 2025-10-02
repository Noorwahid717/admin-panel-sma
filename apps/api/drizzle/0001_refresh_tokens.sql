-- Refresh tokens audit table
DROP TABLE IF EXISTS "refresh_tokens";

CREATE TABLE "refresh_tokens" (
    "id" text PRIMARY KEY,
    "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "jti" text NOT NULL UNIQUE,
    "revoked_at" timestamptz,
    "created_at" timestamptz DEFAULT NOW(),
    "user_agent" text,
    "ip_address" text
);

CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_user" ON "refresh_tokens" ("user_id");
