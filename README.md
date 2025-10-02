# admin-panel-sma

Platform pengelolaan absensi dan nilai siswa berbasis NestJS + React Admin. Monorepo ini memuat API terpusat, worker BullMQ, dan aplikasi admin berbasis Vite.

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
2. Pilih root repo, lalu set **Install Command** `pnpm install` dan **Build Command** `pnpm --filter @apps/admin build`.
3. Set **Output Directory** ke `apps/admin/dist`.
4. Tambahkan env `VITE_API_URL` mengarah ke domain API produksi (mis. `https://api.example.sch.id/api/v1`).
5. Deploy; Vercel akan melayani aplikasi admin statis.

### API & Worker (Railway)

1. Buat dua service Railway dari repository yang sama (API dan worker) atau gunakan deploy manual dari artefak.
2. Pada service API:
   - Build command: `pnpm install --frozen-lockfile && pnpm --filter @apps/api build`
   - Start command: `pnpm --filter @apps/api start:prod`
   - Tambahkan semua variabel dari `apps/api/.env`.
3. Pada service worker:
   - Build command: `pnpm install --frozen-lockfile && pnpm --filter @apps/worker build`
   - Start command: `node apps/worker/dist/index.js`
   - Gunakan variabel environment yang sama (DB, Redis, storage).
4. Hubungkan Railway Postgres (atau Neon) dan Upstash Redis menggunakan variable `DATABASE_URL` & `REDIS_URL`.

### Database (Supabase atau Neon)

- **Supabase**: buat project, aktifkan storage bucket & dapatkan `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`. String koneksi Postgres tersedia di pengaturan database.
- **Neon**: buat branch produksi, ambil connection string Postgres, pastikan opsi `sslmode=require` untuk penggunaan produksi.
- Jalankan migrasi via `pnpm --filter @apps/api migrate:push` setelah kredensial siap.

### Redis (Upstash)

1. Buat database baru (mode REST atau TLS) di Upstash.
2. Catat URL `rediss://` beserta token.
3. Set `REDIS_URL` pada API dan worker.

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
		"nisn": "1234567890",
		"fullName": "Aisyah Pratama",
		"gender": "FEMALE",
		"classId": "cls_123",
		"guardian": {"name": "Rudi", "phone": "+628123456789"}
	}'
```

Untuk read/update/delete gunakan metode `GET /students/:id`, `PATCH /students/:id`, dan `DELETE /students/:id` dengan header yang sama.

### 3. Attendance bulk upsert

```bash
curl -X POST "$API_BASE/attendance/bulk" \
	-H "Content-Type: application/json" \
	-H "Authorization: Bearer $TOKEN" \
	-d '{
		"classId": "cls_123",
		"date": "2025-01-15",
		"records": [
			{"studentId": "stu_001", "status": "PRESENT"},
			{"studentId": "stu_002", "status": "SICK"}
		]
	}'
```

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
		"enrollmentId": "enr_456",
		"type": "SEMESTER",
		"format": "PDF"
	}'
```

Permintaan ini akan menambahkan job ke `REPORT_PDF_QUEUE`. Pantau log worker atau endpoint `GET /reports` untuk memeriksa statusnya.
