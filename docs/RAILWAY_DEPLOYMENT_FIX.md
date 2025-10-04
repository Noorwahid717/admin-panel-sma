# Railway Deployment Fix - TypeScript Path Resolution

## Problem

Build gagal di Railway dengan error:

```
error TS2307: Cannot find module '@shared/constants' or its corresponding type declarations.
```

## Root Cause

Path alias `@shared/*` di `apps/api/tsconfig.json` mengarah ke `../shared/dist/*` yang mengharuskan:

1. Shared package sudah di-build terlebih dahulu
2. TypeScript dapat menemukan type declarations di folder dist

Namun saat compile, TypeScript perlu akses ke **source files** (`.ts`), bukan compiled output (`.js`), untuk:

- Type checking
- Import resolution
- Declaration generation

## Solution

### 1. Update Path Alias ke Source Files

Changed `apps/api/tsconfig.json`:

**Before:**

```json
{
  "compilerOptions": {
    "baseUrl": "./",
    "rootDir": "./src",
    "paths": {
      "@shared/*": ["../shared/dist/*"]
    }
  }
}
```

**After:**

```json
{
  "compilerOptions": {
    "baseUrl": "../../",
    "paths": {
      "@shared/*": ["apps/shared/src/*"],
      "@api/*": ["apps/api/src/*"]
    }
  }
}
```

**Key Changes:**

- ✅ Remove `rootDir: "./src"` - prevents TS6059 error about files not under rootDir
- ✅ Change `baseUrl` to workspace root (`../../`)
- ✅ Update paths to point to **source** (`src/*`) not dist
- ✅ This allows TypeScript to resolve imports during compilation

### 2. Update Start Scripts

Changed `apps/api/package.json` scripts to match actual output structure:

```json
{
  "scripts": {
    "start": "node dist/api/src/main.js",
    "start:prod": "NODE_ENV=production node dist/api/src/main.js"
  }
}
```

## Why This Works

1. **Compilation Time**: TypeScript reads from source files (`apps/shared/src/*`) to perform type checking
2. **Runtime**: Node.js loads compiled JavaScript from `node_modules` or workspace dependencies
3. **Path Resolution**: The `baseUrl` set to workspace root allows TypeScript to understand the monorepo structure

## Build Order

Railway atau local build harus mengikuti urutan:

```bash
# 1. Install dependencies
pnpm install --frozen-lockfile

# 2. Build shared package first
pnpm --filter @apps/shared build

# 3. Build API (will reference shared source files during compile)
pnpm --filter @apps/api build

# 4. Build worker
pnpm --filter @apps/worker build
```

## Railway Configuration

Pastikan `railway.json` atau build command mengikuti urutan di atas:

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pnpm install --frozen-lockfile && pnpm --filter @apps/shared build && pnpm --filter @apps/api build"
  },
  "deploy": {
    "startCommand": "pnpm --filter @apps/api start:prod",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## Verification

Test locally:

```bash
# Clean build
rm -rf apps/*/dist

# Build all
pnpm --filter @apps/shared build && \
pnpm --filter @apps/api build && \
pnpm --filter @apps/worker build

# Test API start
pnpm --filter @apps/api start
```

## Output Structure

Dengan konfigurasi ini, output akan di:

- Shared: `apps/shared/dist/`
- API: `apps/api/dist/api/src/main.js` (note nested structure due to baseUrl)
- Worker: `apps/worker/dist/`

## Alternative Solutions Considered

### Option 1: TypeScript Project References ❌

Lebih kompleks, memerlukan perubahan besar pada semua tsconfig files dan build process.

### Option 2: Copy Shared to API ❌

Duplikasi code, tidak maintainable.

### Option 3: Use dist/\* with pre-build ❌

Memerlukan orchestration yang kompleks, error-prone jika build order tidak benar.

### Option 4: Current Solution ✅

- Simple configuration change
- Works with existing build tools
- Clear build order
- Type-safe at compile time
