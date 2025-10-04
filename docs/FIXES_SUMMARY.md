# ✅ Ringkasan Perbaikan Error Build & Runtime - SELESAI

## Status Akhir

- ✅ API berhasil compile dan berjalan
- ✅ Worker berhasil berjalan tanpa error module
- ✅ Admin (Vite) berjalan normal
- ⚠️ Redis perlu dijalankan untuk worker (normal untuk development)

## Masalah Yang Ditemukan & Diperbaiki

### 1. **API Error**: File `dist/main.js` Tidak Ditemukan

**Penyebab**:

- Konfigurasi `tsconfig.json` dengan `baseUrl` yang mengarah ke root workspace menyebabkan output file dikompilasi ke struktur `dist/api/src/main.js` bukannya `dist/main.js`
- Script `start` dan `start:prod` masih mencari di `dist/main.js`

**Solusi yang Diterapkan**:

- Update script di `apps/api/package.json`:
  ```json
  "start": "node dist/api/src/main.js",
  "start:prod": "NODE_ENV=production node dist/api/src/main.js"
  ```

### 2. **Worker Error**: ES Module / CommonJS Interop Issue

**Penyebab**:

- Worker menggunakan `"type": "module"` (ES Modules)
- Worker mencoba mengimport schema database dari API yang dikompilasi sebagai CommonJS
- File TypeScript dengan decorator tidak bisa langsung di-import oleh ESM tanpa kompilasi yang tepat

**Solusi yang Diterapkan**:

- Menambahkan `@apps/shared` sebagai workspace dependency di worker
- Membuat file re-export wrapper (`schema.ts` dan `db-client.ts`) di `apps/worker/src/lib/`
- Update `tsconfig.json` worker untuk include source files dari API

**Catatan**: Solusi ini masih belum sempurna karena tsx tidak bisa menghandle import langsung dari TypeScript files dengan decorator yang kompleks.

## Perbaikan Yang Diterapkan

### 1. Memindahkan Database Schema ke Shared Package ✅

**Masalah:** Worker tidak bisa mengimpor schema dari API karena conflict ESM/CommonJS

**Solusi:**

- Memindahkan `apps/api/src/db/schema.ts` → `apps/shared/src/db/schema.ts`
- Memindahkan `apps/api/src/db/client.ts` → `apps/shared/src/db/client.ts`
- Menambahkan dependencies `drizzle-orm` dan `pg` ke shared package
- Update semua import di API dan Worker untuk menggunakan `@shared/db/schema`

### 2. Memperbaiki TypeScript Configuration API ✅

**Masalah:** Build output berada di `dist/api/src/main.js` bukan `dist/main.js`

**Solusi:**

- Update `apps/api/tsconfig.json`:
  - `baseUrl: "./"` (sebelumnya `"../../"`)
  - `rootDir: "./src"` untuk normalize output
  - Tambah path alias untuk `@api/*` dan `@shared/*`
- Update script di `package.json`:
  - `"start": "node dist/main.js"`
  - `"start:prod": "NODE_ENV=production node dist/main.js"`

### 3. Mengubah Worker dari ESM ke CommonJS ✅

**Masalah:** Worker menggunakan ESM tapi shared package compile sebagai CommonJS

**Solusi:**

- Hapus `"type": "module"` dari `apps/worker/package.json`
- Update `apps/worker/tsconfig.json`:
  - `"module": "CommonJS"` (sebelumnya `"ESNext"`)
  - `"moduleResolution": "Node"` (sebelumnya `"Bundler"`)

### 4. Update Shared Package Exports ✅

**Solusi:**

- Tambah exports mapping di `apps/shared/package.json` untuk support ESM/CJS:
  ```json
  "exports": {
    "./db/schema": "./dist/db/schema.js",
    "./db/client": "./dist/db/client.js"
  }
  ```

### 5. Update Environment Variables ✅

**Solusi:**

- Update `.env` dengan konfigurasi localhost untuk development:
  ```
  DATABASE_URL=postgres://postgres:postgres@localhost:5432/admin_panel_sma
  REDIS_URL=redis://localhost:6379
  ```

## Solusi Alternatif (TIDAK DIGUNAKAN)

### Opsi 1: Build API Terlebih Dahulu

Worker mengimpor dari compiled output API:

1. Build API dulu sebelum menjalankan worker
2. Update import di worker untuk menggunakan compiled output:
   ```typescript
   // Di apps/worker/src/lib/schema.ts
   export * from "../../../api/dist/api/src/db/schema.js";
   ```

### Opsi 2: Pindahkan Schema ke Package Shared

Pindahkan definisi Drizzle schema ke `apps/shared/src/db/`:

1. Copy `apps/api/src/db/schema.ts` → `apps/shared/src/db/schema.ts`
2. Copy `apps/api/src/db/client.ts` → `apps/shared/src/db/client.ts`
3. Update import di API dan Worker untuk menggunakan `@shared/db/schema`

### Opsi 3: Ubah Worker Menjadi CommonJS

Ubah worker untuk menggunakan CommonJS seperti API:

1. Remove `"type": "module"` dari `apps/worker/package.json`
2. Update `tsconfig.json` worker untuk menggunakan `"module": "CommonJS"`
3. Update semua import untuk tidak menggunakan extension `.js`

## Command untuk Development

```bash
# Build API terlebih dahulu
pnpm --filter @apps/api build

# Jalankan semua services
pnpm dev

# Atau jalankan satu per satu
pnpm --filter @apps/api dev
pnpm --filter @apps/worker dev
pnpm --filter @apps/admin dev
```

## Cara Menjalankan Aplikasi

### Development Mode

```bash
# Install dependencies
pnpm install

# Build shared package terlebih dahulu
pnpm --filter @apps/shared build

# Jalankan semua services
pnpm dev

# Atau jalankan individual
pnpm --filter @apps/api dev
pnpm --filter @apps/worker dev
pnpm --filter @apps/admin dev
```

### Production Mode

```bash
# Build semua packages
pnpm --filter @apps/shared build
pnpm --filter @apps/api build
pnpm --filter @apps/worker build
pnpm --filter @apps/admin build

# Start production
pnpm --filter @apps/api start:prod
```

## Catatan Penting

1. **Shared package harus di-build terlebih dahulu** sebelum build/dev API dan Worker
2. **Redis harus running** untuk worker berfungsi (Redis digunakan untuk BullMQ queue)
3. **PostgreSQL harus running** dan database sudah dibuat
4. Struktur build output API: `dist/main.js` (langsung di root dist)
5. Semua database schema sekarang berada di `apps/shared/src/db/`

## File-File yang Diubah

- `apps/shared/src/db/schema.ts` (baru)
- `apps/shared/src/db/client.ts` (baru)
- `apps/shared/src/index.ts` (+ export db)
- `apps/shared/package.json` (+ drizzle-orm, pg, exports)
- `apps/api/tsconfig.json` (baseUrl, rootDir, paths)
- `apps/api/package.json` (script start/start:prod)
- `apps/api/src/db/client.ts` (import dari @shared)
- `apps/worker/package.json` (- type: module)
- `apps/worker/tsconfig.json` (module: CommonJS)
- `apps/worker/src/lib/*` (import dari @shared)
- `.env` (update DATABASE_URL, REDIS_URL)

## Dependency Tree Baru

```
apps/shared (CommonJS)
  ├── drizzle-orm
  ├── pg
  └── zod

apps/api (CommonJS)
  ├── @apps/shared (workspace:*)
  └── ...existing deps

apps/worker (CommonJS)
  ├── @apps/shared (workspace:*)
  └── ...existing deps
```
