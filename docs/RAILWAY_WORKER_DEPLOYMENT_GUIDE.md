# Railway Worker Deployment Guide

## ✅ Status: WORKING

Worker deployment berhasil di-fix! Semua module resolution issues telah diselesaikan.

---

## Deployment Architecture

```
Railway Project: admin-panel-sma
├── Service: API
│   ├── Build: shared → api
│   └── Start: pnpm --filter @apps/api start:prod
│
├── Service: Worker
│   ├── Build: shared → worker
│   └── Start: pnpm --filter @apps/worker start:prod
│
└── Add-ons:
    ├── PostgreSQL (shared by API & Worker)
    └── Redis (shared by API & Worker)
```

---

## Prerequisites

### 1. Railway Project Setup

- Create new project in Railway
- Connect to GitHub repository: `Noorwahid717/admin-panel-sma`
- Branch: `main`

### 2. Required Add-ons

```
1. PostgreSQL Database
   - Shared by API and Worker
   - Auto-generates DATABASE_URL

2. Redis
   - Required for BullMQ queues
   - Auto-generates REDIS_URL
```

---

## Worker Service Configuration

### Step 1: Create Worker Service

**Railway Dashboard:**

1. Click "New Service"
2. Select "GitHub Repo"
3. Choose `admin-panel-sma` repository
4. Service Name: `worker`

### Step 2: Set Root Directory

**Settings → Service:**

```
Root Directory: /
```

⚠️ **Important**: Leave as root (`/`) for monorepo!

### Step 3: Configure Build Command

**Settings → Build:**

```bash
pnpm install --frozen-lockfile && \
pnpm --filter @apps/shared build && \
pnpm --filter @apps/worker build
```

**Why this order:**

1. Install all dependencies (including workspace dependencies)
2. Build `@apps/shared` FIRST (worker depends on it)
3. Build `@apps/worker`

### Step 4: Configure Start Command

**Settings → Deploy:**

```bash
pnpm --filter @apps/worker start:prod
```

**This runs:**

```bash
NODE_ENV=production node -r tsconfig-paths/register dist/worker/src/index.js
```

### Step 5: Environment Variables

**Settings → Variables:**

```bash
# Database (from PostgreSQL add-on)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (from Redis add-on)
REDIS_URL=${{Redis.REDIS_URL}}

# Storage - Supabase (choose one)
STORAGE_DRIVER=supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your-service-role-key
SUPABASE_BUCKET=your-bucket-name

# OR Storage - Cloudflare R2
STORAGE_DRIVER=r2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket
R2_PUBLIC_URL=https://your-r2-domain.com

# Node Environment
NODE_ENV=production
```

---

## Build Process Verification

### Successful Build Output

```
📦 Installing dependencies...
Lockfile is up to date, resolution step is skipped
Progress: resolved 1175, reused 1175, downloaded 0, added 0, done

🔨 Building @apps/shared...
> @apps/shared@0.1.0 build
> tsc -p tsconfig.build.json
✓ Shared package built

🔨 Building @apps/worker...
> @apps/worker@0.1.0 build
> tsc -p tsconfig.json
✓ Worker package built

✅ Build completed successfully
```

### Build Output Structure

```
apps/
├── shared/
│   └── dist/
│       ├── constants/
│       ├── schemas/
│       └── db/
│           ├── schema.js ✅
│           └── client.js ✅
│
└── worker/
    └── dist/
        └── worker/
            └── src/
                ├── index.js ✅
                ├── lib/
                └── queues/
```

---

## Runtime Module Resolution

### How It Works

```typescript
// Worker code uses path aliases
import { reportJobs } from "@shared/db/schema";
import { REPORT_PDF_QUEUE } from "@shared/constants";

// Compiled to:
const schema_1 = require("@shared/db/schema");
const constants_1 = require("@shared/constants");

// At runtime with tsconfig-paths:
// 1. Intercepts require("@shared/db/schema")
// 2. Reads tsconfig.json paths config
// 3. Tries: apps/shared/src/db/schema.ts (source)
// 4. Falls back: apps/shared/dist/db/schema.js (compiled) ✅
// 5. Successfully loads compiled JavaScript
```

### Key Configuration

**apps/worker/tsconfig.json:**

```jsonc
{
  "compilerOptions": {
    "baseUrl": "../../",
    "paths": {
      // Both src and dist for fallback
      "@shared/*": ["apps/shared/src/*", "apps/shared/dist/*"],
    },
  },
}
```

**apps/worker/package.json:**

```json
{
  "scripts": {
    "start:prod": "NODE_ENV=production node -r tsconfig-paths/register dist/worker/src/index.js"
  },
  "dependencies": {
    "tsconfig-paths": "4.2.0"
  }
}
```

---

## Deployment Verification

### Step 1: Check Build Logs

Railway → Worker Service → Deployments → Latest → Build Logs

**Look for:**

```
✓ @apps/shared build completed
✓ @apps/worker build completed
✓ Build successful
```

### Step 2: Check Deploy Logs

Railway → Worker Service → Deployments → Latest → Deploy Logs

**Success indicators:**

```
[worker:report-pdf] ready
```

**Common errors:**

```
❌ Error: Cannot find module '@shared/db/schema'
   → Fix: Ensure shared is built BEFORE worker

❌ Error: Missing REDIS_URL environment variable
   → Fix: Add Redis add-on and set REDIS_URL variable

❌ Error: Missing DATABASE_URL
   → Fix: Add PostgreSQL add-on and set DATABASE_URL variable
```

### Step 3: Monitor Worker Activity

**Check logs for:**

```
[worker:report-pdf] ready
[queue:report-pdf] completed {jobId}
[worker:report-pdf] completed {jobId}
```

---

## Troubleshooting

### Issue 1: Cannot find module '@shared/\*'

**Symptoms:**

```
Error: Cannot find module '@shared/constants'
Error: Cannot find module '@shared/db/schema'
```

**Solution:**

1. Verify build command includes shared build:
   ```bash
   pnpm --filter @apps/shared build
   ```
2. Check `apps/shared/dist/` folder exists after build
3. Verify tsconfig.json has fallback path:
   ```json
   "@shared/*": ["apps/shared/src/*", "apps/shared/dist/*"]
   ```

### Issue 2: Wrong Module Path

**Symptoms:**

```
Error: Cannot find module '/app/apps/worker/dist/index.js'
```

**Solution:**
Update start command to correct nested path:

```bash
pnpm --filter @apps/worker start:prod
```

This runs: `node -r tsconfig-paths/register dist/worker/src/index.js`

### Issue 3: Redis Connection Failed

**Symptoms:**

```
Error: connect ECONNREFUSED
Error: Redis connection timeout
```

**Solution:**

1. Add Redis add-on in Railway
2. Set REDIS_URL variable: `${{Redis.REDIS_URL}}`
3. Verify Redis add-on is running

### Issue 4: Database Connection Failed

**Symptoms:**

```
Error: Connection terminated unexpectedly
Error: ENOTFOUND postgres
```

**Solution:**

1. Add PostgreSQL add-on in Railway
2. Set DATABASE_URL variable: `${{Postgres.DATABASE_URL}}`
3. Run migrations if needed

---

## Production Checklist

### Before Deploy

- [ ] All environment variables set
- [ ] PostgreSQL add-on added and connected
- [ ] Redis add-on added and connected
- [ ] Storage configuration complete (Supabase or R2)
- [ ] Build command includes shared build
- [ ] Start command uses correct path

### After Deploy

- [ ] Build logs show successful compilation
- [ ] Deploy logs show worker ready
- [ ] No module resolution errors
- [ ] Worker connects to Redis successfully
- [ ] Worker connects to database successfully
- [ ] Test job processing works

---

## Testing Deployment

### 1. Trigger Test Job from API

```bash
# Call API endpoint that creates report job
curl -X POST https://your-api.railway.app/api/reports \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enrollmentId": "test-enrollment-id"}'
```

### 2. Check Worker Logs

Railway → Worker Service → Logs

**Expected output:**

```
[queue:report-pdf] completed {jobId}
[worker:report-pdf] completed {jobId} {result}
```

### 3. Verify Report Generated

Check if report PDF URL is returned and accessible.

---

## Performance Monitoring

### Key Metrics

**Railway Dashboard:**

- CPU Usage: Should be low when idle, spike during job processing
- Memory: ~200-400MB typical usage
- Network: Spikes during Redis communication and file uploads

**Worker Logs:**

```
[worker:report-pdf] ready          ← Worker started
[worker:report-pdf] completed {id} ← Job processed successfully
[worker:report-pdf] failed {id}    ← Job failed (investigate)
```

---

## Scaling Considerations

### Horizontal Scaling

Worker can be scaled horizontally:

```
Railway Dashboard → Worker Service → Settings → Scale
```

Multiple worker instances will:

- Share same Redis queue
- Process jobs in parallel
- Increase throughput

### Vertical Scaling

If jobs are memory-intensive:

```
Railway Dashboard → Worker Service → Settings → Resources
```

Increase memory allocation if needed.

---

## Rollback Strategy

### Automatic Rollback

Railway keeps deployment history:

```
Railway → Worker Service → Deployments → Previous → Redeploy
```

### Manual Rollback

```bash
# Locally
git revert <commit-hash>
git push origin main

# Railway auto-deploys from main branch
```

---

## Summary

✅ **Worker is production-ready with:**

1. Correct build order (shared → worker)
2. Runtime module resolution (tsconfig-paths)
3. Compiled files fallback (src + dist paths)
4. Proper start command (nested output path)
5. Environment variables configured
6. Database and Redis connected

🚀 **Deploy worker to Railway and it will work!**
