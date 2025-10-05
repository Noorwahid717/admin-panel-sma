# Worker Deployment Fix - Complete Guide# Worker Deployment Fix - Output Path Resolution

## Problems Overview## Problem

### Problem 1: Wrong Output Path ❌Worker deployment failed di Railway dengan error:

````

Error: Cannot find module '/app/apps/worker/dist/index.js'```

```Error: Cannot find module '/app/apps/worker/dist/index.js'

````

### Problem 2: Runtime Module Resolution ❌

````## Root Cause

Error: Cannot find module '@shared/constants'

Require stack:Sama seperti issue API sebelumnya - `baseUrl: "../../"` di `tsconfig.json` menyebabkan TypeScript output dengan nested directory structure:

- /app/apps/worker/dist/worker/src/index.js'

```- **Expected**: `dist/index.js`

- **Actual**: `dist/worker/src/index.js`

---

Ini terjadi karena TypeScript preserve struktur folder relative ke `baseUrl` (workspace root).

## Root Causes

## Solution

### Issue 1: Nested Output Structure

TypeScript dengan `baseUrl: "../../"` (workspace root) menyebabkan:### Update Start Scripts

- **Expected path**: `dist/index.js`

- **Actual path**: `dist/worker/src/index.js`Changed `apps/worker/package.json` untuk match actual output structure:



TypeScript preserves folder structure relative to `baseUrl`.**Before:**



### Issue 2: Path Aliases Don't Work at Runtime```json

1. **Compile Time**: TypeScript resolves `import { X } from "@shared/constants"` → finds correct source file{

2. **Compiled Output**: Contains `require("@shared/constants")` → path alias tetap di code  "scripts": {

3. **Runtime**: Node.js doesn't understand `@shared/*` → MODULE_NOT_FOUND error    "dev": "tsx --tsconfig tsconfig.json --env-file ../../.env src/index.ts",

    "build": "tsc -p tsconfig.json"

**Why TypeScript keeps path aliases:**  }

- TypeScript doesn't rewrite imports by default}

- Path aliases are for IDE/compile-time resolution only```

- Runtime needs separate module resolver

**After:**

---

```json

## Solutions{

  "scripts": {

### ✅ Solution 1: Fix Output Path    "dev": "tsx --tsconfig tsconfig.json --env-file ../../.env src/index.ts",

    "build": "tsc -p tsconfig.json",

Update `apps/worker/package.json` start scripts:    "start": "node dist/worker/src/index.js",

    "start:prod": "NODE_ENV=production node dist/worker/src/index.js"

```json  }

{}

  "scripts": {```

    "start": "node dist/worker/src/index.js",

    "start:prod": "NODE_ENV=production node dist/worker/src/index.js"## Why This Happens

  }

}TypeScript dengan `baseUrl: "../../"` (workspace root) akan:

````

1. Resolve imports relative to workspace root

### ✅ Solution 2: Add Runtime Path Resolution2. Output files dengan structure relative to baseUrl

3. Karena source di `apps/worker/src/`, output jadi `dist/worker/src/`

**Install dependencies:**

```````bash## Verification

pnpm --filter @apps/worker add tsconfig-paths dotenv

``````bash

# Build worker

**Update start scripts to use tsconfig-paths:**pnpm --filter @apps/worker build

```json

{# Check output location

  "scripts": {ls -la apps/worker/dist/worker/src/index.js

    "start": "node -r tsconfig-paths/register dist/worker/src/index.js",

    "start:prod": "NODE_ENV=production node -r tsconfig-paths/register dist/worker/src/index.js"# Test start (will fail with "Missing REDIS_URL" but should load @shared modules)

  }pnpm --filter @apps/worker start

}

```# Expected error (this is GOOD - means modules loaded):

# Error: Missing REDIS_URL environment variable

**Final `apps/worker/package.json`:**

```json# If you see this error, fix is needed:

{# Error: Cannot find module '@shared/constants'

  "name": "@apps/worker",```

  "version": "0.1.0",

  "scripts": {### Success Indicators

    "dev": "tsx --tsconfig tsconfig.json --env-file ../../.env src/index.ts",✅ No "Cannot find module '@shared/constants'" error

    "build": "tsc -p tsconfig.json",✅ Code reaches runtime (Redis connection attempt)

    "start": "node -r tsconfig-paths/register dist/worker/src/index.js",✅ Error is about missing environment variable, not missing module

    "start:prod": "NODE_ENV=production node -r tsconfig-paths/register dist/worker/src/index.js"

  },## Railway Configuration

  "dependencies": {

    "@apps/shared": "workspace:*",Pastikan Railway start command untuk worker menggunakan:

    "dotenv": "^16.4.7",

    "tsconfig-paths": "4.2.0"```bash

  }pnpm --filter @apps/worker start:prod

}```

```````

Atau di `railway.json`:

---

````json

## How tsconfig-paths Works{

  "services": {

### Execution Flow    "worker": {

      "build": {

1. **Node.js starts** with `-r tsconfig-paths/register` flag        "builder": "NIXPACKS",

2. **tsconfig-paths loads** before main script executes        "buildCommand": "pnpm install --frozen-lockfile && pnpm --filter @apps/shared build && pnpm --filter @apps/worker build"

3. **Reads `tsconfig.json`** and parses `baseUrl` + `paths` config      },

4. **Hooks into Node.js** module resolution system      "deploy": {

5. **Intercepts `require()`** calls        "startCommand": "pnpm --filter @apps/worker start:prod"

      }

### Performance Impact    }

- ⚡ **Minimal overhead** - only resolves on module load  }

- 📦 **Works with all module types** - require, import, dynamic imports}

- 🔄 **No build changes** - no code transformation```

- 🎯 **Production-ready** - used by NestJS and major projects

## Alternative Solutions

---

### Option 1: Flat Output Structure ❌

## Verification Steps

Change tsconfig to output flat structure:

```bash

# 1. Build worker```json

pnpm --filter @apps/worker build{

  "compilerOptions": {

# 2. Check output location    "baseUrl": "./",

ls -la apps/worker/dist/worker/src/index.js    "outDir": "dist",

    "paths": {

# 3. Test module loading (SUCCESS = REDIS_URL error)      "@shared/*": ["../shared/src/*"]

pnpm --filter @apps/worker start    }

```  }

}

**Expected Output (SUCCESS):**```

````

Error: Missing REDIS_URL environment variable**Problem**: Breaks cross-package imports during compilation (same issue as before).

````

✅ Module loaded successfully!### Option 2: Current Solution ✅



**Bad Output (FAILURE):**- Keep workspace-level baseUrl for proper module resolution

```- Update start scripts to match actual output path

Error: Cannot find module '@shared/constants'- Consistent with API package approach

```- Simple and maintainable

❌ Path resolution not working.

## Output Structure Comparison

---

**Shared Package** (`baseUrl: "./"`, `rootDir: "src"`):

## Railway Configuration

````

```bashdist/

# Build Command├── schemas/

pnpm install --frozen-lockfile && \│   ├── auth.js

pnpm --filter @apps/shared build && \│   └── ...

pnpm --filter @apps/worker build└── constants/

```

# Start Command

pnpm --filter @apps/worker start:prod**API Package** (`baseUrl: "../../"`, no rootDir):

```

```

---dist/

└── api/

## Summary └── src/

        └── main.js

1. **Output Path**: Fixed by updating start scripts```

2. **Runtime Resolution**: Fixed by adding `tsconfig-paths`

3. **Production Ready**: Worker can now run on Railway**Worker Package** (`baseUrl: "../../"`, no rootDir):

4. **Consistent**: Follows same pattern as API package

```

Both fixes required for worker to run successfully! 🚀dist/

└── worker/
    └── src/
        └── index.js
```

The nested structure is expected behavior when using workspace-level baseUrl for monorepo type resolution.

## How tsconfig-paths Works

1. **Preload via `-r` flag**: Node.js loads `tsconfig-paths/register` before running main script
2. **Read tsconfig.json**: Parses `baseUrl` and `paths` configuration
3. **Register custom resolver**: Hooks into Node.js module resolution system
4. **Resolve aliases**: When Node encounters `require("@shared/constants")`:
   - Check if it matches any path alias pattern
   - Resolve to actual file path: `../../apps/shared/src/constants`
   - Load the resolved module

### Performance Impact

- ⚡ Minimal overhead (only resolves when module is loaded)
- 📦 Works with any Node.js module loader (require, import)
- 🔄 No code transformation needed
- 🎯 Production-ready solution used by many projects

## Related Fixes

- **API Package**: Already using `tsconfig-paths` (see `apps/api/package.json`)
- **Shared Package**: Uses flat output structure, no runtime resolution needed
- **Worker Package**: Now aligned with API package approach
