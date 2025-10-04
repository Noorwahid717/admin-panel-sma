# Changelog - Build & Runtime Fixes

## [2025-10-04] - Major Build System Refactoring ✅

### 🎯 Objective

Memperbaiki error build dan runtime yang mencegah aplikasi berjalan dengan baik.

### 🐛 Issues Fixed

1. **API Build Output Structure Issue**

   - **Problem**: File `dist/main.js` tidak ditemukan, output berada di `dist/api/src/main.js`
   - **Root Cause**: `baseUrl: "../../"` di tsconfig menyebabkan struktur folder mengikuti workspace root
   - **Solution**: Update tsconfig dengan `baseUrl: "./"` dan `rootDir: "./src"`

2. **Worker ESM/CommonJS Module Conflict**

   - **Problem**: Worker tidak bisa import schema dari API karena conflict module system
   - **Root Cause**: Worker menggunakan ESM (`type: "module"`) tapi API compile sebagai CommonJS
   - **Solution**: Ubah worker menjadi CommonJS untuk consistency

3. **Database Schema Accessibility**
   - **Problem**: Worker perlu akses ke database schema yang ada di API
   - **Root Cause**: Cross-package import dengan module system yang berbeda
   - **Solution**: Pindahkan schema ke shared package sebagai single source of truth

### 📦 Changes Made

#### 1. Shared Package Restructuring

**New Files:**

- `apps/shared/src/db/schema.ts` - Database schema definitions
- `apps/shared/src/db/client.ts` - Database client factory

**Modified:**

- `apps/shared/package.json`

  ```json
  {
    "dependencies": {
      "drizzle-orm": "0.44.5",
      "pg": "8.11.5",
      "zod": "3.23.8"
    },
    "devDependencies": {
      "@types/pg": "8.15.5"
    },
    "exports": {
      "./db/schema": "./dist/db/schema.js",
      "./db/client": "./dist/db/client.js"
    }
  }
  ```

- `apps/shared/src/index.ts`
  ```typescript
  export * from "./db/schema";
  export * from "./db/client";
  ```

#### 2. API Configuration Updates

**Modified:**

- `apps/api/tsconfig.json`

  ```json
  {
    "compilerOptions": {
      "baseUrl": "./",
      "outDir": "./dist",
      "rootDir": "./src",
      "paths": {
        "@shared/*": ["../shared/dist/*"],
        "@api/*": ["./src/*"]
      }
    }
  }
  ```

- `apps/api/package.json`

  ```json
  {
    "scripts": {
      "start": "node dist/main.js",
      "start:prod": "NODE_ENV=production node dist/main.js"
    }
  }
  ```

- `apps/api/src/db/client.ts`

  ```typescript
  // Changed from:
  import * as schema from "./schema";

  // To:
  import * as schema from "@shared/db/schema";
  ```

#### 3. Worker Configuration Updates

**Modified:**

- `apps/worker/package.json`

  ```json
  {
    // Removed: "type": "module"
    "dependencies": {
      "@apps/shared": "workspace:*"
    }
  }
  ```

- `apps/worker/tsconfig.json`

  ```json
  {
    "compilerOptions": {
      "module": "CommonJS", // Changed from "ESNext"
      "moduleResolution": "Node" // Changed from "Bundler"
    }
  }
  ```

- Worker import updates:

  ```typescript
  // Changed from:
  import { schema } from "../../../api/src/db/schema";

  // To:
  import { schema } from "@shared/db/schema";
  ```

#### 4. Environment Configuration

**Modified:**

- `.env`
  ```env
  DATABASE_URL=postgres://postgres:postgres@localhost:5432/admin_panel_sma
  REDIS_URL=redis://localhost:6379
  ```

### 🔄 Migration Guide

For existing installations:

```bash
# 1. Pull latest changes
git pull

# 2. Clean old builds
rm -rf apps/*/dist node_modules/.cache

# 3. Reinstall dependencies
pnpm install

# 4. Build shared package first
pnpm --filter @apps/shared build

# 5. Build other packages
pnpm --filter @apps/api build
pnpm --filter @apps/worker build

# 6. Run development
pnpm dev
```

### ✅ Verification

All services should now start successfully:

```bash
$ pnpm dev

[api]    ✓ API compiled successfully
[api]    API running on port 3000
[worker] [worker:report-pdf] ready
[admin]  VITE v5.4.8 ready in 289 ms
[admin]  ➜ Local: http://localhost:5173/
```

### ⚠️ Known Issues

1. **Redis Connection**: Worker will show `ECONNREFUSED` if Redis is not running

   - **Solution**: Start Redis with `redis-server`

2. **Database Connection**: API will fail if PostgreSQL is not running
   - **Solution**: Start PostgreSQL and ensure database exists

### 📚 Related Documentation

- [FIXES_SUMMARY.md](./FIXES_SUMMARY.md) - Detailed technical summary
- [README.md](./README.md) - Updated usage guide
- [.github/copilot-instructions.md](.github/copilot-instructions.md) - Architecture guidelines

### 👥 Contributors

- Fixed by: GitHub Copilot Agent
- Date: 4 Oktober 2025
- Affected Files: 15+ files across all packages
