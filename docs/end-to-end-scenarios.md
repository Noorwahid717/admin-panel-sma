# End-to-End Operasional SMA Panel

Dokumen ini merangkum skenario inti di panel admin SMA yang memanfaatkan matriks peran & akses (RBAC) yang baru. Gunakan sebagai acuan saat menyiapkan workflow lintas peran, integrasi layanan backend, dan otomatisasi worker.

## A. Tahun Ajaran Baru (Pra-Semester)

- **Setup Semester & Kelas**
  - Admin TU / Superadmin membuat `Term` (semester) baru lengkap dengan tahun ajaran.
  - Import massal data siswa dan guru via CSV.
    - Validasi back-end memastikan NIS (siswa) dan NIP (guru) unik sebelum commit.
  - Bentuk kelas, assign wali kelas masing-masing, dan tambahkan siswa lewat modul `Enrollments`.
- **Setup Mapel & Jadwal**
  - Admin TU mendefinisikan master `Subjects`, lalu map ke kelas terkait.
  - Generator jadwal (opsional): sistem menyusunkan jadwal per kelas & mapel, mengecek bentrok guru atau ruang. Simpan hasil di modul `schedule`.
- **Hak Akses Awal**
  - Superadmin/Admin TU membuat akun user RBAC (Guru Mapel, Wali Kelas, Admin TU, Kepala Sekolah, Superadmin).
  - Distribusikan kredensial perdana ke pengguna (email/WA) berikut SOP penggunaan aplikasi.

## B. Operasional Harian

- **Absensi**
  - Wali Kelas mencatat absensi pagi (status H/S/I/A). Saat memilih I atau S, wajib isi catatan/bukti pendukung.
  - Guru Mapel (opsional) melakukan absensi tiap jam pelajaran untuk mengidentifikasi keterlambatan atau ketidakhadiran spesifik mapel.
  - Worker (opsional) memantau absensi; bila status A lebih dari ambang X kali/minggu, kirim notifikasi ke orang tua/wali.
- **Pengelolaan Nilai**
  - Guru Mapel menginput penilaian (harian, ulangan, tugas, proyek) sesuai rubrik—rubrik dapat dikelola di `grade-components`.
  - Validasi range skor (misal 0–100) dan perhitungan otomatis (weighted average) berjalan di backend, hasil disimpan ke `grades`.
- **Komunikasi & Catatan**
  - Admin TU atau Kepala Sekolah membuat pengumuman; konten tampil di dashboard guru, siswa/ortu.
  - Kejadian khusus (disiplin, prestasi) dicatat lewat form catatan perilaku, bisa ditandai ke kelas/siswa tertentu dan terlihat bagi wali kelas & kepala sekolah sesuai permis.

## C. Penilaian Tengah/Akhir Semester

- Admin TU atau Superadmin menetapkan KKM dan bobot penilaian final untuk tiap mapel.
- Guru Mapel melakukan finalisasi nilai; Wali Kelas memverifikasi sebelum rapor dicetak.
- Worker batching men-generate PDF rapor per siswa (gunakan data `grades`, `subjects`, `behavior`, absensi).
- Dashboard Kepala Sekolah menampilkan distribusi nilai, deteksi outlier, dan daftar siswa remedial. Data siap untuk ekspor.

## D. Mutasi & Arsip

- Proses mutasi siswa (masuk/keluar) ataupun pindah kelas harus tercatat di log audit (Superadmin/Admin TU).
- Arsip rapor dan absensi disimpan ke object storage dalam bentuk PDF + CSV, disertai metadata (tahun ajaran, semester, kelas).

## Catatan Implementasi

- Pemetaan resource RBAC:
  - `students`, `teachers`, `classes`, `subjects`, `terms`, `enrollments`, `grade-components` → CRUD Admin TU, akses Superadmin.
  - `attendance`, `grades` → RW oleh Wali Kelas & Guru Mapel; R oleh Kepala Sekolah dan Orang Tua/Siswa.
  - `reports`, `dashboard`, `announcements`, `behavior` → R/A sesuai matriks (Kepala Sekolah approval, Wali Kelas catatan perilaku, dsb).
- Pastikan modul worker memiliki akses sesuai perannya (service account), walau tidak masuk RBAC UI.
- Sesuaikan API guard/permission enforcement agar konsisten dengan konfigurasi UI.
