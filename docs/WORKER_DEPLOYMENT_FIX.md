# Worker Deployment Fix - Output Path Resolution

## Problem

Worker deployment failed di Railway dengan error:

```
Error: Cannot find module '/app/apps/worker/dist/index.js'
```

## Root Cause

Sama seperti issue API sebelumnya - `baseUrl: "../../"` di `tsconfig.json` menyebabkan TypeScript output dengan nested directory structure:

- **Expected**: `dist/index.js`
- **Actual**: `dist/worker/src/index.js`

Ini terjadi karena TypeScript preserve struktur folder relative ke `baseUrl` (workspace root).

## Solution

### Update Start Scripts

Changed `apps/worker/package.json` untuk match actual output structure:

**Before:**

```json
{
  "scripts": {
    "dev": "tsx --tsconfig tsconfig.json --env-file ../../.env src/index.ts",
    "build": "tsc -p tsconfig.json"
  }
}
```

**After:**

```json
{
  "scripts": {
    "dev": "tsx --tsconfig tsconfig.json --env-file ../../.env src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/worker/src/index.js",
    "start:prod": "NODE_ENV=production node dist/worker/src/index.js"
  }
}
```

## Why This Happens

TypeScript dengan `baseUrl: "../../"` (workspace root) akan:

1. Resolve imports relative to workspace root
2. Output files dengan structure relative to baseUrl
3. Karena source di `apps/worker/src/`, output jadi `dist/worker/src/`

## Verification

```bash
# Build worker
pnpm --filter @apps/worker build

# Check output location
ls -la apps/worker/dist/worker/src/index.js

# Test start (will fail if ENV vars not set, but should find module)
pnpm --filter @apps/worker start
```

## Railway Configuration

Pastikan Railway start command untuk worker menggunakan:

```bash
pnpm --filter @apps/worker start:prod
```

Atau di `railway.json`:

```json
{
  "services": {
    "worker": {
      "build": {
        "builder": "NIXPACKS",
        "buildCommand": "pnpm install --frozen-lockfile && pnpm --filter @apps/shared build && pnpm --filter @apps/worker build"
      },
      "deploy": {
        "startCommand": "pnpm --filter @apps/worker start:prod"
      }
    }
  }
}
```

## Alternative Solutions

### Option 1: Flat Output Structure ❌

Change tsconfig to output flat structure:

```json
{
  "compilerOptions": {
    "baseUrl": "./",
    "outDir": "dist",
    "paths": {
      "@shared/*": ["../shared/src/*"]
    }
  }
}
```

**Problem**: Breaks cross-package imports during compilation (same issue as before).

### Option 2: Current Solution ✅

- Keep workspace-level baseUrl for proper module resolution
- Update start scripts to match actual output path
- Consistent with API package approach
- Simple and maintainable

## Output Structure Comparison

**Shared Package** (`baseUrl: "./"`, `rootDir: "src"`):

```
dist/
├── schemas/
│   ├── auth.js
│   └── ...
└── constants/
```

**API Package** (`baseUrl: "../../"`, no rootDir):

```
dist/
└── api/
    └── src/
        └── main.js
```

**Worker Package** (`baseUrl: "../../"`, no rootDir):

```
dist/
└── worker/
    └── src/
        └── index.js
```

The nested structure is expected behavior when using workspace-level baseUrl for monorepo type resolution.
