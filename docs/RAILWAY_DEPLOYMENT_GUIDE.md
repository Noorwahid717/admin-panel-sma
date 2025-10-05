# Railway Deployment Guide

## Overview

This monorepo contains multiple services:

- **API**: NestJS backend API (`apps/api`)
- **Worker**: BullMQ worker for background jobs (`apps/worker`)
- **Shared**: Common code, schemas, DB models (`apps/shared`)

## Critical: Build Order

⚠️ **IMPORTANT**: Shared package MUST be built before API and Worker!

```bash
# Correct order:
1. pnpm --filter @apps/shared build
2. pnpm --filter @apps/api build
3. pnpm --filter @apps/worker build
```

## Railway Configuration

### Method 1: Using nixpacks.toml (Recommended)

The `nixpacks.toml` file at the root ensures correct build order automatically.

**For each service, set:**

#### API Service

- **Build Command**: (uses nixpacks.toml)
- **Start Command**: `pnpm --filter @apps/api start:prod`
- **Root Directory**: `/` (monorepo root)

#### Worker Service

- **Build Command**: (uses nixpacks.toml)
- **Start Command**: `pnpm --filter @apps/worker start:prod`
- **Root Directory**: `/` (monorepo root)

### Method 2: Manual Build Commands

If nixpacks.toml doesn't work, set custom build commands:

#### API Service

```bash
# Build Command
pnpm install --frozen-lockfile && \
pnpm --filter @apps/shared build && \
pnpm --filter @apps/api build

# Start Command
pnpm --filter @apps/api start:prod
```

#### Worker Service

```bash
# Build Command
pnpm install --frozen-lockfile && \
pnpm --filter @apps/shared build && \
pnpm --filter @apps/worker build

# Start Command
pnpm --filter @apps/worker start:prod
```

## Environment Variables

### API Service Required Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/dbname

# Redis
REDIS_URL=redis://host:port

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
REFRESH_SECRET=your-refresh-secret
REFRESH_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=https://your-frontend.com

# Storage (choose one)
STORAGE_DRIVER=supabase # or 'r2'

# If using Supabase:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_BUCKET=your-bucket-name

# If using Cloudflare R2:
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET=your-bucket-name
R2_PUBLIC_BASE_URL=https://your-bucket.r2.cloudflarestorage.com
```

### Worker Service Required Variables

```bash
# Database (same as API)
DATABASE_URL=postgresql://user:password@host:port/dbname

# Redis (same as API)
REDIS_URL=redis://host:port

# Storage (same as API - must match API configuration)
STORAGE_DRIVER=supabase # or 'r2'
# ... (same storage env vars as API)
```

## Verification Steps

### 1. Check Build Logs

Look for these lines in Railway build logs:

```
> @apps/shared@0.1.0 build
> tsc -p tsconfig.build.json

> @apps/api@0.1.0 build
> nest build

> @apps/worker@0.1.0 build
> tsc -p tsconfig.json
```

### 2. Check Startup Logs

**API should show:**

```
[Nest] INFO [NestFactory] Starting Nest application...
[Nest] INFO [InstanceLoader] AppModule dependencies initialized
```

**Worker should show:**

```
[worker:report-pdf] ready
```

**If you see these errors, shared package wasn't built:**

```
Error: Cannot find module '@shared/constants'
Error: Cannot find module '@shared/db/schema'
```

### 3. Test API Endpoint

```bash
curl https://your-api.railway.app/health
```

Should return:

```json
{
  "status": "ok",
  "timestamp": "2025-10-05T..."
}
```

## Troubleshooting

### Error: Cannot find module '@shared/...'

**Cause**: Shared package wasn't built before API/Worker

**Solution**:

1. Check Railway build logs
2. Ensure build command includes `pnpm --filter @apps/shared build` FIRST
3. Verify `apps/shared/dist/` folder exists after build

### Error: Cannot find module '/app/apps/worker/dist/index.js'

**Cause**: Wrong start command path

**Solution**: Use `pnpm --filter @apps/worker start:prod` which uses correct path

### Error: MODULE_NOT_FOUND for '@shared/db/schema'

**Cause**: tsconfig-paths can't find compiled files

**Solution**: Already fixed in tsconfig.json with fallback paths:

```jsonc
{
  "paths": {
    "@shared/*": ["apps/shared/src/*", "apps/shared/dist/*"],
  },
}
```

## Build Process Flow

```
1. Railway detects pnpm workspace
   ↓
2. Reads nixpacks.toml configuration
   ↓
3. Install phase:
   - pnpm install --frozen-lockfile
   ↓
4. Build phase:
   a. pnpm --filter @apps/shared build
      → Creates apps/shared/dist/
   b. pnpm --filter @apps/api build
      → Uses @shared/* imports (resolved to src/ at compile time)
      → Creates apps/api/dist/
   c. pnpm --filter @apps/worker build
      → Uses @shared/* imports (resolved to src/ at compile time)
      → Creates apps/worker/dist/
   ↓
5. Start phase:
   - API: node -r tsconfig-paths/register dist/api/src/main.js
     → tsconfig-paths resolves @shared/* to dist/ at runtime
   - Worker: node -r tsconfig-paths/register dist/worker/src/index.js
     → tsconfig-paths resolves @shared/* to dist/ at runtime
```

## Key Architectural Decisions

### Why tsconfig-paths?

- Node.js doesn't understand TypeScript path aliases
- `tsconfig-paths/register` hooks into Node's require() system
- Resolves `@shared/*` at runtime to actual file paths

### Why dist fallback in paths?

```jsonc
"@shared/*": ["apps/shared/src/*", "apps/shared/dist/*"]
```

- **Compile time**: Uses `src/*` for type checking
- **Runtime**: Falls back to `dist/*` for compiled JS files
- **Result**: Works in both development and production

### Why nested output structure?

```
apps/api/dist/api/src/main.js  (not dist/main.js)
apps/worker/dist/worker/src/index.js  (not dist/index.js)
```

- **Caused by**: `baseUrl: "../../"` in tsconfig
- **Benefit**: TypeScript can resolve cross-package imports
- **Solution**: Start scripts use correct nested path

## Success Checklist

Before deploying, ensure:

- ✅ `nixpacks.toml` exists at repo root
- ✅ All tsconfig.json files have correct paths with `dist/*` fallback
- ✅ package.json start scripts use `-r tsconfig-paths/register`
- ✅ Start scripts point to correct output paths
- ✅ All environment variables set in Railway
- ✅ Build command includes shared package build
- ✅ PostgreSQL and Redis databases provisioned

After deployment:

- ✅ No "Cannot find module" errors in logs
- ✅ API health endpoint responds
- ✅ Worker shows "ready" message
- ✅ Database connections successful

## Railway Project Structure

```
admin-panel-sma (Project)
├── api (Service)
│   ├── Build: Uses nixpacks.toml
│   ├── Start: pnpm --filter @apps/api start:prod
│   └── Env: DATABASE_URL, REDIS_URL, JWT_*, STORAGE_*
├── worker (Service)
│   ├── Build: Uses nixpacks.toml
│   ├── Start: pnpm --filter @apps/worker start:prod
│   └── Env: DATABASE_URL, REDIS_URL, STORAGE_*
├── postgres (Database)
└── redis (Database)
```

## Related Documentation

- [API Deployment Fix](./RAILWAY_DEPLOYMENT_FIX.md) - TypeScript path resolution
- [Worker Deployment Fix](./WORKER_DEPLOYMENT_FIX.md) - Complete worker setup
- [Project Architecture](../.github/copilot-instructions.md) - System overview
