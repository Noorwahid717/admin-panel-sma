# admin-panel-sma

Platform pengelolaan absensi dan nilai siswa berbasis NestJS + React Admin. Monorepo ini memuat API terpusat, worker BullMQ, aplikasi admin berbasis Vite, dan shared package untuk schemas/types yang digunakan bersama.

## Struktur Monorepo

```
admin-panel-sma/
├── apps/
│   ├── api/          # NestJS backend API
│   ├── admin/        # React Admin frontend (Vite)
│   ├── worker/       # BullMQ worker untuk background jobs
│   └── shared/       # Shared schemas, types, dan constants (ESM)
├── docs/             # Dokumentasi deployment dan fixes
├── vercel.json       # Konfigurasi deployment Vercel
└── pnpm-workspace.yaml
```

Package `@apps/shared` berisi:

- Zod schemas untuk validasi (auth, users, students, dll)
- TypeScript types dan interfaces
- Database schema definitions (Drizzle ORM)
- Shared constants (roles, queue names, dll)

Package ini di-build sebagai ES Modules (ESM) agar kompatibel dengan Vite dan bundler modern.

## Daftar isi

1. [Prasyarat](#prasyarat)
2. [Langkah setup](#langkah-setup)
3. [Konfigurasi environment](#konfigurasi-environment)
4. [Menjalankan secara lokal](#menjalankan-secara-lokal)
5. [Alur deploy](#alur-deploy)
6. [Contoh curl endpoint utama](#contoh-curl-endpoint-utama)

## Prasyarat

- Node.js 20+ dan [pnpm](https://pnpm.io/) 9+
- Docker Desktop (opsional tetapi direkomendasikan untuk Postgres & Redis)
- Akun layanan eksternal untuk produksi: Supabase atau Neon (Postgres), Upstash (Redis), Vercel, Railway

## Langkah setup

1. **Clone repo & install dependency**

   ```bash
   git clone https://github.com/Noorwahid717/admin-panel-sma.git
   cd admin-panel-sma
   pnpm install
   ```

2. **Siapkan environment file**

   - Salin `.env.example` menjadi `.env` di root.
   - (Opsional) Tambahkan override spesifik service di `apps/api/.env` dan `apps/admin/.env` jika perlu.

3. **Jalankan Postgres & Redis** (pilih salah satu)

   - Start menggunakan Docker Compose: `docker compose -f docker-compose.dev.yml up -d`
   - Atau gunakan layanan lokal yang sudah tersedia, kemudian perbarui `DATABASE_URL` & `REDIS_URL`.

4. **Migrasi & seed database (opsional)**

   ```bash
   pnpm --filter @apps/api migrate:push
   pnpm --filter @apps/api seed
   ```

5. **Mulai pengembangan** `pnpm dev`.

## Konfigurasi environment

### Root `.env`

| Variabel                  | Deskripsi                                            | Contoh                                       |
| ------------------------- | ---------------------------------------------------- | -------------------------------------------- |
| `NODE_ENV`                | Mode runtime (`development` / `production`)          | `development`                                |
| `TZ`                      | Zona waktu default                                   | `Asia/Jakarta`                               |
| `PORT`                    | Port API saat dev                                    | `3000`                                       |
| `DATABASE_URL`            | URL Postgres (Drizzle + API + worker)                | `postgres://sma:sma@localhost:5432/sma_dev`  |
| `REDIS_URL`               | URL Redis (BullMQ)                                   | `redis://default:password@localhost:6379`    |
| `JWT_ACCESS_SECRET`       | Secret JWT access token                              | `super-secret-access`                        |
| `JWT_REFRESH_SECRET`      | Secret JWT refresh token                             | `super-secret-refresh`                       |
| `JWT_ACCESS_TTL`          | Masa berlaku access token (detik)                    | `900`                                        |
| `JWT_REFRESH_TTL`         | Masa berlaku refresh token (detik)                   | `2592000`                                    |
| `CORS_ALLOWED_ORIGINS`    | Daftar origin yang diizinkan (pisahkan dengan koma)  | `http://localhost:5173,https://admin.sch.id` |
| `AUTH_MAX_LOGIN_ATTEMPTS` | Batas percobaan login per IP + email sebelum lockout | `5`                                          |
| `AUTH_LOCKOUT_DURATION`   | Durasi lockout (detik) setelah melampaui batas       | `900`                                        |
| `ARGON2_MEMORY_COST`      | Argon2 memory cost (KB)                              | `19456`                                      |
| `ARGON2_TIME_COST`        | Argon2 time cost (iterasi)                           | `2`                                          |
| `STORAGE_DRIVER`          | `supabase` atau `r2`                                 | `supabase`                                   |
| `SUPABASE_URL`            | URL project Supabase                                 | `https://xyzcompany.supabase.co`             |
| `SUPABASE_ANON_KEY`       | Public anon key                                      | `sb-anon-...`                                |
| `SUPABASE_SERVICE_KEY`    | Service role key untuk worker                        | `sb-service-...`                             |
| `SUPABASE_BUCKET`         | Bucket penyimpanan                                   | `public-assets`                              |
| `R2_*`                    | Kredensial Cloudflare R2 (jika `STORAGE_DRIVER=r2`)  | `...`                                        |
| `APP_BASE_URL`            | Origin aplikasi admin                                | `http://localhost:5173`                      |
| `EMAIL_FROM`              | Email pengirim default                               | `no-reply@example.local`                     |

> Worker membaca environment dari root `.env` melalui `tsx --env-file`, jadi pastikan kredensial DB & Redis tersedia.

### `apps/api/.env`

Gunakan saat build/deploy terpisah di platform seperti Railway.

| Variabel                  | Deskripsi                            | Contoh                                                 |
| ------------------------- | ------------------------------------ | ------------------------------------------------------ |
| `DATABASE_URL`            | URL Postgres produksi                | `postgres://user:pass@ep.example.aws.neon.tech/neondb` |
| `REDIS_URL`               | URL Upstash Redis                    | `rediss://default:pass@global.upstash.io:6379`         |
| `JWT_ACCESS_SECRET`       | Secret produksi                      | `prod-access-secret`                                   |
| `JWT_REFRESH_SECRET`      | Secret produksi                      | `prod-refresh-secret`                                  |
| `JWT_ACCESS_TTL`          | TTL access token                     | `900`                                                  |
| `JWT_REFRESH_TTL`         | TTL refresh token                    | `2592000`                                              |
| `CORS_ALLOWED_ORIGINS`    | Origin yang diizinkan untuk API      | `https://admin.example.sch.id`                         |
| `AUTH_MAX_LOGIN_ATTEMPTS` | Batas percobaan login per IP + email | `5`                                                    |
| `AUTH_LOCKOUT_DURATION`   | Durasi lockout (detik)               | `900`                                                  |
| `ARGON2_MEMORY_COST`      | Argon2 memory cost (KB)              | `19456`                                                |
| `ARGON2_TIME_COST`        | Argon2 time cost (iterasi)           | `2`                                                    |
| `STORAGE_DRIVER`          | `supabase` / `r2`                    | `supabase`                                             |
| `SUPABASE_*` / `R2_*`     | Kredensial storage sesuai driver     | —                                                      |
| `APP_BASE_URL`            | URL deploy admin                     | `https://admin.example.sch.id`                         |
| `EMAIL_FROM`              | Email notifikasi                     | `no-reply@example.sch.id`                              |

### `apps/worker/.env`

Worker juga membutuhkan `DATABASE_URL`, `REDIS_URL`, dan konfigurasi storage yang sama dengan API. Anda bisa menggunakan salinan `.env` root atau membuat file khusus dengan variabel identik.

### `apps/admin/.env`

| Variabel       | Deskripsi                                | Contoh                         |
| -------------- | ---------------------------------------- | ------------------------------ |
| `VITE_API_URL` | Base URL API (termasuk prefix `/api/v1`) | `http://localhost:3000/api/v1` |

### Catatan keamanan

- **Rotasi refresh token** – setiap permintaan refresh menerbitkan token dengan JTI baru dan otomatis menandai token lama sebagai revoked lengkap dengan catatan IP serta User-Agent.
- **Logout fleksibel** – endpoint `/auth/logout` dapat mencabut satu token (berdasarkan refresh token atau JTI) maupun seluruh sesi aktif pengguna.
- **Rate limiting ketat** – `/auth/login`, `/auth/refresh`, dan `/storage/presign` diberi throttle khusus untuk mengecilkan peluang brute-force/presign abuse.
- **Password policy kuat** – minimal 12 karakter dengan kombinasi huruf besar, huruf kecil, angka, dan simbol; admin default sudah mengikuti aturan ini.
- **Lockout login** – percobaan gagal berulang (per IP + email) memicu lockout sementara sesuai `AUTH_MAX_LOGIN_ATTEMPTS` dan `AUTH_LOCKOUT_DURATION`.
- **Argon2 parametrik** – `ARGON2_MEMORY_COST` dan `ARGON2_TIME_COST` bisa diatur agar hashing seimbang antara keamanan dan performa.

## Menjalankan secara lokal

### Mode pnpm dev (semua service)

Perintah berikut menyalakan API (NestJS), worker BullMQ, dan aplikasi admin Vite secara paralel:

```bash
pnpm dev
```

Endpoint default:

- API: http://localhost:3000/api/v1
- Admin: http://localhost:5173

### Docker Compose untuk dependency

File `docker-compose.dev.yml` menyiapkan Postgres dan Redis siap pakai. Jalankan:

```bash
docker compose -f docker-compose.dev.yml up -d
```

Gunakan `docker compose -f docker-compose.dev.yml down` untuk mematikannya. Data tersimpan di volume `postgres-data` dan `redis-data`.

## Alur deploy

### Admin (Vercel)

1. Hubungkan repository ke Vercel.
2. Di **Project Settings** → **General**, set:
   - **Root Directory**: `apps/admin` (penting untuk monorepo!)
   - **Framework Preset**: Other (atau Vite jika tersedia)
3. Vercel akan otomatis mendeteksi `vercel.json` di `apps/admin/`:
   - **Install Command**: `cd ../.. && pnpm install`
   - **Build Command**: `cd ../.. && pnpm --filter @apps/shared build && pnpm --filter @apps/admin build`
   - **Output Directory**: `dist`
4. Di **Environment Variables**, tambahkan:
   - `VITE_API_URL`: URL API produksi (mis. `https://api.example.sch.id/api/v1`)
5. Deploy; Vercel akan melayani aplikasi admin statis.

> **Catatan Penting**:
>
> - Root Directory harus di-set ke `apps/admin` karena ini monorepo
> - Build command perlu `cd ../..` untuk kembali ke root agar pnpm workspace bekerja
> - Shared package di-build terlebih dahulu sebelum admin

### API & Worker (Railway)

1. Buat dua service Railway dari repository yang sama (API dan worker) atau gunakan deploy manual dari artefak.
2. Pada service API:
   - Build command: `pnpm install --frozen-lockfile && pnpm --filter @apps/api build`
   - Start command: `pnpm --filter @apps/api start:prod`
   - Tambahkan semua variabel dari `apps/api/.env`.
3. Pada service worker:
   - Build command: `pnpm install --frozen-lockfile && pnpm --filter @apps/worker build:railway`
   - Start command: `pnpm --filter @apps/worker start:prod`
   - Gunakan variabel environment yang sama (DB, Redis, storage).
   - **Penting**: Script `build:railway` otomatis build shared package terlebih dahulu
4. Hubungkan Railway Postgres (atau Neon) dan Upstash Redis menggunakan variable `DATABASE_URL` & `REDIS_URL`.

### Database (Supabase atau Neon)

- **Supabase**: buat project, aktifkan storage bucket & dapatkan `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`. String koneksi Postgres tersedia di pengaturan database.
- **Neon**: buat branch produksi, ambil connection string Postgres, pastikan opsi `sslmode=require` untuk penggunaan produksi.
- Jalankan migrasi via `pnpm --filter @apps/api migrate:push` setelah kredensial siap.

### Redis (Upstash)

1. Buat database baru (mode REST atau TLS) di Upstash.
2. Catat URL `rediss://` beserta token.
3. Set `REDIS_URL` pada API dan worker.

## Troubleshooting

### Error: "No Output Directory named 'dist' found" di Vercel

**Masalah**: Vercel tidak menemukan output directory setelah build selesai.

**Solusi**:

1. Pastikan **Root Directory** di-set ke `apps/admin` di Project Settings → General di dashboard Vercel
2. Output Directory harus `dist` (relatif dari root directory yang sudah di-set, bukan `apps/admin/dist`)
3. Build command harus `cd ../.. && pnpm --filter @apps/shared build && pnpm --filter @apps/admin build`
4. Install command harus `cd ../.. && pnpm install`
5. Vercel akan membaca konfigurasi dari `apps/admin/vercel.json`

### Build Error: "is not exported by" saat deploy ke Vercel

**Masalah**: Rollup/Vite tidak dapat menemukan export dari `@shared/schemas` atau package shared lainnya.

**Solusi**:

1. Pastikan `@apps/shared` terdaftar sebagai dependency di `apps/admin/package.json`:
   ```json
   "dependencies": {
     "@apps/shared": "workspace:*"
   }
   ```
2. Shared package harus di-build terlebih dahulu menjadi ESM sebelum build admin
3. Vercel akan otomatis menjalankan build sequence yang benar via `vercel.json`

### Halaman Admin Kosong atau Cannot Connect to API

**Masalah**: Aplikasi admin berhasil deploy tapi halaman kosong atau tidak bisa koneksi ke API.

**Diagnosis**:

1. **Test API Health Check**:

   ```bash
   # Endpoint yang benar
   curl https://your-api.railway.app/api/v1/health

   # Should return: {"status":"ok","timestamp":"...","environment":"production"}
   ```

2. **Cek Console Browser** (F12 → Console):

   - ❌ **CORS Error**: API belum include domain Vercel di `CORS_ALLOWED_ORIGINS`
   - ❌ **404 Not Found**: `VITE_API_URL` salah atau API belum deploy
   - ❌ **Network Error**: API down atau URL tidak valid

3. **Verifikasi Environment Variables**:

   **Di Vercel** (Admin):

   ```bash
   VITE_API_URL=https://your-api.railway.app/api/v1
   ```

   ⚠️ Tanpa trailing slash! Setelah set, **REDEPLOY** aplikasi.

   **Di Railway** (API):

   ```bash
   CORS_ALLOWED_ORIGINS=https://your-admin.vercel.app
   APP_BASE_URL=https://your-admin.vercel.app
   ```

   Setelah set, **RESTART** service API.

4. **Test Login API**:

   ```bash
   curl -X POST https://your-api.railway.app/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"superadmin@example.com","password":"SuperSecure123!@#"}'
   ```

   Jika berhasil, Anda akan dapat `accessToken`. Jika gagal:

   - **401**: Password salah atau user tidak ada (perlu seed database)
   - **404**: Endpoint tidak ditemukan (API belum deploy dengan benar)
   - **500**: Database error (check Railway logs)

5. **Cek Database Seed**:

   ```bash
   # Via Railway CLI
   railway run pnpm --filter @apps/api seed

   # Atau via SQL query di Supabase/Neon
   SELECT email, role FROM users WHERE role = 'SUPERADMIN';
   ```

**Solusi**:

- Pastikan API deployed dan accessible
- Set environment variables dengan benar
- Redeploy Vercel setelah set `VITE_API_URL`
- Restart Railway API setelah set `CORS_ALLOWED_ORIGINS`
- Seed database jika belum ada user

### Development vs Production Build

- **Development**: Vite menggunakan source files langsung dari `apps/shared/src` untuk HMR (Hot Module Replacement) yang cepat
- **Production**: Vite menggunakan compiled files dari `apps/shared/dist` untuk module resolution yang proper

Konfigurasi ini diatur di `apps/admin/vite.config.ts` dengan conditional alias berdasarkan mode.

### Shared Package Changes

Jika Anda melakukan perubahan pada `apps/shared`, rebuild package tersebut:

```bash
pnpm --filter @apps/shared build
```

Atau gunakan watch mode saat development:

```bash
pnpm --filter @apps/shared dev
```

### Worker Error: "Cannot find module '@apps/shared/...' "

**Masalah**: TypeScript compilation gagal karena tidak menemukan module `@apps/shared`.

**Solusi**:

1. **Railway/Production**: Gunakan script `build:railway` yang otomatis build shared terlebih dahulu:

   ```bash
   pnpm install --frozen-lockfile && pnpm --filter @apps/worker build:railway
   ```

2. **Local Development**: Build shared terlebih dahulu atau gunakan script build biasa:

   ```bash
   pnpm --filter @apps/shared build
   pnpm --filter @apps/worker build
   ```

3. **Root cause**: Worker depends on `@apps/shared` package yang harus di-compile menjadi ESM modules di `apps/shared/dist/` sebelum worker bisa di-compile.

### Worker Error: "exports is not defined in ES module scope"

**Masalah**: Worker runtime gagal dengan error tentang `exports` tidak terdefinisi di ESM scope.

**Solusi**:

1. Pastikan semua packages (shared, worker) menggunakan `"type": "module"` di package.json
2. Semua relative imports harus include `.js` extension (ESM requirement)
3. Import dari shared package menggunakan `@apps/shared/*` bukan `@shared/*`
4. Semua barrel exports (index.ts) harus include `.js` di re-exports

**Catatan**: Monorepo ini sepenuhnya menggunakan ES Modules (ESM) untuk kompatibilitas dengan modern tooling (Vite, Node.js 22+).

### Worker Error: "Named export 'Pool' not found" dari pg module

**Masalah**: Error saat runtime `SyntaxError: Named export 'Pool' not found. The requested module 'pg' is a CommonJS module`.

**Solusi**:

`pg` adalah CommonJS module yang tidak support named exports di ESM. Gunakan default import:

```typescript
// ❌ Salah - tidak akan bekerja di ESM
import { Pool } from "pg";

// ✅ Benar - import default lalu destructure
import pkg from "pg";
const { Pool } = pkg;
```

Untuk types, gunakan `InstanceType<typeof Pool>` alih-alih `Pool` type langsung.

**Catatan**: Package CommonJS lain (seperti `ioredis`, `bullmq`) sudah support ESM named exports dengan baik.

## Contoh curl endpoint utama

Set variabel bantu:

```bash
API_BASE=http://localhost:3000/api/v1
TOKEN="$(curl -s -X POST "$API_BASE/auth/login" \
	-H "Content-Type: application/json" \
	-d '{"email":"superadmin@example.com","password":"password"}' | jq -r '.accessToken')"
```

> Ganti email/password sesuai data seed Anda. Semua permintaan terproteksi butuh header `Authorization: Bearer $TOKEN`.

### 1. Login

```bash
curl -X POST "$API_BASE/auth/login" \
	-H "Content-Type: application/json" \
	-d '{"email":"superadmin@example.com","password":"password"}'
```

### 2. CRUD siswa (contoh: create)

```bash
curl -X POST "$API_BASE/students" \
	-H "Content-Type: application/json" \
	-H "Authorization: Bearer $TOKEN" \
	-d '{
		"nis": "2025-0001",
		"fullName": "Aisyah Pratama",
		"birthDate": "2010-05-15",
		"gender": "F",
		"guardian": "Rudi (Ayah) - +628123456789"
	}'
```

> **Catatan**: `gender` menggunakan `"M"` (Male) atau `"F"` (Female). Field `guardian` adalah string opsional berisi informasi wali.

Untuk read/update/delete gunakan metode `GET /students/:id`, `PATCH /students/:id`, dan `DELETE /students/:id` dengan header yang sama.

### 3. Attendance bulk upsert

```bash
curl -X POST "$API_BASE/attendance/bulk" \
	-H "Content-Type: application/json" \
	-H "Authorization: Bearer $TOKEN" \
	-d '{
		"classId": "cls_123",
		"termId": "term_2024",
		"records": [
			{
				"enrollmentId": "enr_001",
				"date": "2025-01-15",
				"sessionType": "Harian",
				"status": "H"
			},
			{
				"enrollmentId": "enr_002",
				"date": "2025-01-15",
				"sessionType": "Harian",
				"status": "S"
			}
		]
	}'
```

> **Status Kehadiran**: `"H"` (Hadir), `"I"` (Izin), `"S"` (Sakit), `"A"` (Alpa/Tanpa Keterangan)  
> **Session Type**: `"Harian"` (absensi harian) atau `"Mapel"` (per mata pelajaran)

### 4. Query nilai

```bash
curl "$API_BASE/grades?classId=cls_123&termId=term_2024" \
	-H "Authorization: Bearer $TOKEN"
```

### 5. Request report rapor

```bash
curl -X POST "$API_BASE/reports" \
	-H "Content-Type: application/json" \
	-H "Authorization: Bearer $TOKEN" \
	-d '{
		"enrollmentId": "enr_456"
	}'
```

Permintaan ini akan menambahkan job ke `REPORT_PDF_QUEUE`. Pantau log worker atau endpoint `GET /reports/:id` untuk memeriksa statusnya. Worker akan generate PDF rapor berdasarkan data enrollment (siswa, kelas, term, nilai, dan kehadiran).
