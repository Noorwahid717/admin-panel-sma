# MSW Mock API + Seed Data

Dokumen ini merangkum implementasi Mock Service Worker (MSW) yang digunakan oleh `apps/admin`
untuk mengembangkan React Admin tanpa bergantung pada backend NestJS. Handler dan seed data sudah
dikomit sehingga developer cukup menjalankan `pnpm dev` untuk mendapatkan pengalaman full-feature.

## Ringkasan

- MSW otomatis aktif saat `import.meta.env.DEV` melalui bootstrap di `apps/admin/src/main.tsx`.
- Semua request ke `${VITE_API_URL}/api/v1/*` dialihkan ke handler MSW dan mengembalikan format
  `{ data, total }` yang kompatibel dengan React Admin.
- Seed memuat skenario SMA Negeri Harapan Nusantara Semester Ganjil 2024/2025 dengan siswa, guru,
  kelas, jadwal, nilai, mutasi, arsip, dan dashboard kepala sekolah.
- Endpoint daftar mendukung `_page/_perPage`, `_start/_end`, `_sort/_order`, `limit`, dan `filter`
  (termasuk pencarian fuzzy via key `field~`) sehingga UX React Admin terasa natural.
- Flag `VITE_USE_MSW=true` (atau `VITE_ENABLE_MSW` untuk kompatibilitas lama) memungkinkan staging/preview (mis. Vercel) tetap menggunakan seed yang sama
  tanpa perlu backend aktif.
- Auth mock mendukung alur login/refresh/logout sekaligus menyediakan multi-role RBAC.
- Utilitas `mswTestUtils` dan `setSimulation` membantu percobaan manual maupun automated test.

## Struktur Berkas Penting

- `apps/admin/src/mocks/browser.ts` – dynamic import `setupWorker` dan helper `startWorker`.
- `apps/admin/src/mocks/handlers.ts` – in-memory datastore, auth mock, dan route handler utama.
- `apps/admin/public/mockServiceWorker.js` – worker hasil `msw init`, dikomit ke repo.
- `apps/admin/test/setupTests.ts` – Vitest server-side MSW (`msw/node`) untuk unit/integration test.
- `apps/admin/src/__tests__/msw-scenarios.test.ts` – contoh penggunaan `mswTestUtils`.

## Cara Menjalankan

1. Install dependency: `pnpm install`.
2. Jalankan seluruh layanan dev: `pnpm dev` (akan mem-boot API, worker, dan admin).
3. Buka http://localhost:5173 – aplikasi otomatis menyalakan MSW karena mode dev.
4. Login menggunakan salah satu akun mock (lihat tabel di bawah).

> Worker MSW tidak dijalankan pada build production, jadi deployment tetap mengakses API real.

## Akun Mock

| Email                                    | Password    | Role           | Catatan                                             |
| ---------------------------------------- | ----------- | -------------- | --------------------------------------------------- |
| `superadmin@harapannusantara.sch.id`     | `Admin123!` | SUPERADMIN     | Default setelah logout                              |
| `admin.tu@harapannusantara.sch.id`       | `Admin123!` | ADMIN_TU       | Akses modul tata usaha                              |
| `kepsek@harapannusantara.sch.id`         | `Admin123!` | KEPALA_SEKOLAH | Menggunakan profil guru senior (`principalTeacher`) |
| `wali.x.ipa.1@harapannusantara.sch.id`   | `Admin123!` | WALI_KELAS     | Wali kelas `class_x_ipa_1`                          |
| `guru.mat@harapannusantara.sch.id`       | `Admin123!` | GURU_MAPEL     | Guru Matematika pemegang `sub_mat`                  |
| `aditya.wijaya@harapannusantara.sch.id`  | `Admin123!` | SISWA          | Tertaut ke siswa `stu_aditya_wijaya`                |
| `bambang.wijaya@harapannusantara.sch.id` | `Admin123!` | ORTU           | Orang tua siswa `stu_aditya_wijaya`                 |

Setiap login menghasilkan token palsu `mock-access-token-<id>`; header `Authorization` dicek
longgar oleh handler `GET /auth/me`.

## Resource yang Disimulasikan

Semua resource tersedia melalui pola `/api/v1/<resource>` (GET/POST/PATCH/DELETE). Handler generik
melakukan normalisasi data (`sanitizePayload`) sehingga tanggal dan angka tetap konsisten.

| Resource           | Jumlah Seed (≈) | Highlight                                                                 |
| ------------------ | --------------- | ------------------------------------------------------------------------- |
| `students`         | 300             | 30 siswa per kelas (X–XII, IPA & IPS) lengkap dengan wali & status        |
| `teachers`         | 32              | Guru lintas mapel dengan NIP 18 digit dan email sekolah                   |
| `classes`          | 10              | Kombinasi IPA/IPS, setiap kelas punya wali dan term aktif                 |
| `subjects`         | 16              | Core + peminatan (Mat, Fis, Kim, Bio, Sos, Geo, Eko, TIK, Seni, dll.)     |
| `terms`            | 2               | Semester ganjil aktif + semester genap mendatang                          |
| `enrollments`      | 300             | Satu entri per siswa per kelas/term                                       |
| `grade-components` | 360             | Tugas, UH, dan PAS untuk setiap `class-subject`                           |
| `grade-configs`    | 120             | Skema weighted/average sesuai mapel                                       |
| `grades`           | 10.800          | Nilai tiap siswa × mapel × komponen (angka bulat, 0–100)                  |
| `attendance`       | 6.600           | Absensi harian + mapel (10 hari kerja + 4 pertemuan mapel prioritas)      |
| `class-subjects`   | 120             | Relasi kelas ↔ mapel ↔ guru + term                                      |
| `schedules`        | 120             | Jadwal mingguan tanpa konflik awal                                        |
| `announcements`    | 5               | Pengumuman umum, guru, siswa, serta target kelas spesifik                 |
| `behavior-notes`   | 24              | Catatan kedisiplinan, prestasi, intervensi, dan kesehatan                 |
| `mutations`        | 8               | Mutasi IN/OUT/INTERNAL dengan audit trail 3 tahap                         |
| `archives`         | 3               | Rapor ZIP, absensi CSV, dan rekap nilai XLSX                              |
| `dashboard`        | 1               | Ringkasan nilai, outlier, remedial, dan alert absensi yang dihitung ulang |

Dataset di atas cukup untuk menjalankan alur pra-semester dan monitoring. Anda tetap bisa
memanfaatkan `mswTestUtils.create("students", { ... })` atau menambah generator baru bila perlu
skenario ekstra (mis. kelas eksperimen, siswa pindahan tambahan).

## Mode Staging / Preview

- Set environment `VITE_USE_MSW=true` pada build (contoh: `vercel.json` → `preview.env`).
- Saat flag aktif, `dataProvider` dan `authProvider` otomatis mengganti base URL ke origin aplikasi
  (`https://preview.app/api`) sehingga request ditangani MSW walaupun variabel `VITE_API_URL`
  menunjuk ke host lain.
- Login tetap melalui endpoint `/auth/login` yang dimock MSW, dan seluruh resource berfungsi identik
  dengan mode development.

## Utilitas Pengembangan

- `mswTestUtils.list(resource)` – mengembalikan snapshot array untuk resource tertentu.
- `mswTestUtils.create/remove(resource, payload)` – CRUD langsung pada in-memory store.
- `mswTestUtils.setCurrentUser({ email|role })` – ubah user aktif tanpa login ulang (dipakai di tes).
- `mswTestUtils.getDashboard/setDashboard(updater)` – membaca atau mengubah payload dashboard.
- `setSimulation({ refreshFailure, sessionExpiry })` – memaksa response `401/403` pada `/auth/refresh`.

Selama dev, helper di atas dapat di-import dari `apps/admin/src/mocks/handlers`. Untuk production
build, modul mock tidak dibundel karena kode dibungkus `if (import.meta.env.DEV)`.

## Testing

- Vitest otomatis memanggil `setupServer` (`apps/admin/test/setupTests.ts`) dan memuat handler yang
  sama dengan aplikasi. Hal ini memastikan assertion terhadap seed atau response identik antara UI
  dan test.
- Sample `apps/admin/src/__tests__/msw-scenarios.test.ts` menguji jadwal bentrok, distribusi nilai,
  dan akses dashboard kepala sekolah menggunakan `mswTestUtils`.

## Debug & Ekstensi

- Gunakan query `?fail=1` atau `?expire=1` pada `/auth/refresh` untuk mensimulasikan token invalid.
- `generateId(prefix)` di handler menyediakan fallback random ID jika payload baru tidak memiliki `id`.
- Normalizer untuk `students`, `terms`, `attendance`, dll. memaksa format tanggal `YYYY-MM-DD` dan
  memastikan angka dikonversi ke `number`.
- Pola fallback `http.all(/\/api\/v1\/.*/)` membantu mendeteksi request yang belum dimock (return 404).

## Keterbatasan Saat Ini

- Import CSV, generator jadwal otomatis, dan job simulasi belum diimplementasikan di MSW.
- Penyusunan filter masih single-field; kombinasikan manual jika membutuhkan logika kompleks.
- Seed menutupi 30 siswa per kelas. Tambahkan data baru jika butuh skenario >10 kelas atau role khusus.

Kontribusi baru dapat langsung menambah resource/store di `handlers.ts` atau mengekstrak ke modul
terpisah jika volume data tumbuh. Pastikan menjaga format response `{ data, total }` untuk kompatibilitas
dengan React Admin.
