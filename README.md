# SIA Portal Mahasiswa

Portal Sistem Informasi Akademik untuk tiga peran: mahasiswa, dosen, dan administrator.
Next.js 16 (App Router), Tailwind CSS 4, Framer Motion, Prisma 6, MySQL 8.

## Menjalankan

```bash
npm install
docker compose up -d      # MySQL 8.4 di localhost:3306
npm run db:reset          # buat tabel + isi data awal (menghapus data lama)
npm run dev               # http://localhost:3000
```

`.env` berisi `DATABASE_URL`, `AUTH_SECRET` (kunci sesi login, minimal 32 karakter), dan `SHOW_DEMO_ACCOUNTS`.

## Akun demo

| Peran | Username | Kata sandi |
|---|---|---|
| Mahasiswa | `2410512001` (NIM) | `mahasiswa123` |
| Dosen (Dosen Pembimbing) | `198203102008011005` (NIP) | `dosen123` |
| Administrator | `admin` | `admin123` |

Set `SHOW_DEMO_ACCOUNTS="false"` di `.env` untuk menyembunyikan tombol akun demo di halaman login.

## Peran

| Peran | Halaman | Bisa |
|---|---|---|
| Mahasiswa | Dashboard, KRS, Jadwal Kuliah, Nilai, Pengumuman | Tambah dan batalkan Mata Kuliah di KRS sendiri |
| Dosen | Dashboard, Persetujuan KRS, Input Nilai, Pengumuman | Setujui, tolak, atau kembalikan KRS mahasiswa bimbingan. Input nilai Mata Kuliah yang diampu |
| Administrator | Dashboard, Mata Kuliah, Pengumuman, Pengguna | Kelola Mata Kuliah (cek bentrok Dosen dan ruang), pengumuman, dan akun |

Login memakai cookie sesi `httpOnly` bertanda tangan (JWT HS256, 8 jam). `proxy.ts` mengarahkan tiap peran ke halamannya, dan setiap halaman serta Server Action memeriksa peran lagi di server.

## Struktur

| Path | Isi |
|---|---|
| `prisma/schema.prisma` | users, lecturers, students, courses, krs (termasuk nilai), announcements |
| `prisma/seed.ts` | data awal: 3 mahasiswa dengan riwayat 4 semester, 8 dosen, 38 Mata Kuliah |
| `proxy.ts`, `lib/auth.ts`, `lib/roles.ts` | login, sesi, dan pembatasan akses per peran |
| `app/actions/` | Server Actions: `auth`, `krs`, `dosen`, `admin` |
| `lib/data.ts` | query database (server only) |
| `lib/nilai.ts` | konversi nilai angka ke huruf, IPK, dan IPS |

## Aturan

- KRS baru berstatus Menunggu. Ditolak jika jadwal bentrok atau total SKS aktif melebihi 24 (KRS Ditolak tidak dihitung).
- KRS Disetujui hanya bisa dibatalkan lewat Dosen Pembimbing, dan terkunci setelah Mata Kuliah itu bernilai.
- Menyimpan nilai menghitung ulang IPK dan total SKS lulus mahasiswa.
- Mata Kuliah yang sudah dipakai di KRS tidak bisa dihapus.
