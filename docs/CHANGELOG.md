# Changelog - Build & Runtime Fixes

## [2025-10-20] - Kalender Akademik & Absensi Terintegrasi ✅

### 🎯 Objective

Memperkenalkan kalender akademik hybrid dan pengalaman input absensi harian yang
menyatu dengan jadwal MSW sehingga guru dapat menandai kehadiran dalam hitungan detik.

### ✏️ Changes

1. Menambahkan halaman `CalendarPage` baru lengkap dengan filter tahun ajar, kategori,
   tooltip event, modal detail, dan mode legend responsif.
2. Menggabungkan data event manual, jadwal ujian, dan pengumuman melalui hook `useEvents`
   serta memperkaya seed MSW dengan kategori/warna sesuai panduan desain.
3. Memperluas `mswTestUtils` dan skenario Vitest agar memverifikasi event kalender,
   termasuk CRUD dasar pada resource `calendar-events`.
4. Membuat hook `useAttendanceSession` yang memetakan jadwal, mapping kelas-mapel,
   dan absensi `sessionType: "Mapel"` ke baris siswa siap-input.
5. Menulis ulang `AttendanceDailyPage` dengan status badge besar, auto-save 3 detik,
   validasi alasan izin/sakit, toggle “tandai semua hadir”, dan dukungan mobile layout.
6. Menambah metadata `slot`, `recordedAt`, dan `updatedAt` pada seed MSW sehingga
   UI dapat menampilkan jam pelajaran dan indikator sinkronisasi.
7. Menyajikan halaman Rekap Kehadiran lengkap dengan tabel analitik, grafik mingguan,
   ekspor CSV, dan highlight Top 3 siswa paling disiplin.
8. Merilis Generator Jadwal Otomatis dengan drag-and-drop, highlight preferensi guru,
   dan panel fairness distribusi.
9. Menyediakan halaman Preferensi Mengajar agar guru/admin dapat mengatur hari & jam preferensi.

### 🔍 Verification

- `pnpm --filter @apps/admin test` _(gagal di sandbox CI dengan `write EPIPE`; jalankan lokal
  untuk memastikan seluruh skenario Vitest lulus)._
- Manual smoke test: `/calendar`, `/attendance/daily`, `/attendance`, dan `/schedules/generator` pada dev server dengan MSW aktif.

### 📚 Related Documentation

- `docs/checklist.md` (update status kalender & absensi terpadu)
- `apps/admin/src/pages/calendar.tsx`, `apps/admin/src/pages/attendance-daily.tsx`,
  `apps/admin/src/pages/attendance-analytics.tsx`, `apps/admin/src/pages/schedule-generator.tsx`
- `apps/admin/src/mocks/seed.ts`, `apps/admin/src/hooks/use-events.ts`,
  `apps/admin/src/hooks/use-attendance-session.ts`, `apps/admin/src/hooks/use-attendance-analytics.ts`,
  `apps/admin/src/hooks/use-schedule-generator.ts`

## [2025-10-15] - MSW Mock API Revamp + Documentation ✅

### 🎯 Objective

Menjadikan lapisan MSW siap pakai untuk pengembangan frontend dengan seed data realistis sekaligus
menyediakan dokumentasi resmi bagi tim.

### ✏️ Changes

1. Membuat generator `apps/admin/src/mocks/seed.ts` untuk memproduksi dataset ±300 siswa,
   32 guru, jadwal, nilai, absensi, mutasi, dan arsip yang konsisten.
2. Memigrasikan `handlers.ts` ke seed baru, menambahkan dukungan filter/sort/pagination ala
   React Admin, serta menyesuaikan akun mock dinamis.
3. Menyegarkan `mswTestUtils` dan skenario Vitest agar tidak bergantung pada ID hard-coded.
4. Menulis ulang `docs/MSW-with-seed-data.md` serta menandai checklist
   `Dokumentasi MSW + seed data (frontend dev)` sebagai selesai.
5. Menambahkan flag `VITE_ENABLE_MSW` (aktif di Vercel preview) sehingga staging dapat memakai MSW
   tanpa backend.

### 🔍 Verification

- `pnpm --filter @apps/admin test -- --run`
- `pnpm --filter @apps/admin build`
- `pnpm dev` menampilkan admin panel dengan MSW aktif menggunakan seed terbaru.
- Login sebagai `superadmin@harapannusantara.sch.id` menampilkan data siswa/guru lengkap.

### 📚 Related Documentation

- `docs/MSW-with-seed-data.md`
- `docs/checklist.md`

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
