# Penjelasan Aplikasi SIA Portal

Dokumen ini menjelaskan aplikasi Sistem Informasi Akademik (SIA) dari awal: apa yang dibuat, teknologi yang dipakai, cara menjalankan dari nol, struktur database, algoritma di balik fitur utama, dan cara memakainya untuk tiap peran.

## Daftar isi

1. [Gambaran umum](#1-gambaran-umum)
2. [Teknologi yang dipakai](#2-teknologi-yang-dipakai)
3. [Set up dari nol](#3-set-up-dari-nol)
4. [Struktur folder](#4-struktur-folder)
5. [Struktur database](#5-struktur-database)
6. [Algoritma dan logika utama](#6-algoritma-dan-logika-utama)
7. [Cara pakai per peran](#7-cara-pakai-per-peran)
8. [Prinsip desain antarmuka](#8-prinsip-desain-antarmuka)
9. [Keamanan dan keterbatasan](#9-keamanan-dan-keterbatasan)
10. [Pemecahan masalah](#10-pemecahan-masalah)

---

## 1. Gambaran umum

SIA Portal adalah aplikasi web untuk tiga jenis pengguna:

| Pengguna | Kebutuhan utama |
|---|---|
| **Mahasiswa** | Melihat jadwal, mengisi KRS, melihat nilai, membaca pengumuman |
| **Dosen** | Menyetujui KRS mahasiswa bimbingan (sebagai Dosen Pembimbing), menginput nilai Mata Kuliah yang diampu |
| **Administrator** | Mengelola Mata Kuliah, pengumuman, dan akun pengguna |

Studi kasus ini meminta desain yang menghindari tiga masalah: **menu membingungkan**, **istilah tidak konsisten**, dan **feedback tidak jelas**. Solusinya, dan tempatnya di aplikasi:

| Solusi desain | Di aplikasi |
|---|---|
| Dashboard ringkas | Tiap peran punya dashboard sendiri: jadwal hari ini, IPK, SKS, KRS, dan pengumuman untuk mahasiswa |
| Navigasi terstruktur | Sidebar di desktop, menu hamburger di ponsel. Isi menu mengikuti peran, maksimal lima item |
| Status proses terlihat | Lencana status KRS (Disetujui, Menunggu, Ditolak), penanda jadwal (Selesai, Berlangsung, Berikutnya), spinner di tombol, dan toast hasil |
| Konfirmasi tindakan penting | Modal konfirmasi sebelum membatalkan Mata Kuliah, menolak KRS, menghapus data, mengganti kata sandi, dan keluar |

---

## 2. Teknologi yang dipakai

| Lapisan | Teknologi | Versi | Dipakai untuk |
|---|---|---|---|
| Framework | **Next.js** (App Router) | 16.3.5 | Halaman, routing, Server Components, Server Actions, `proxy.ts` |
| UI | **React** | 19.2.8 | Komponen antarmuka, `useActionState`, `useTransition` |
| Bahasa | **TypeScript** | 5 | Tipe data di seluruh kode |
| Styling | **Tailwind CSS** | 4 | Gaya berbasis utilitas dengan token warna sendiri di `app/globals.css` |
| Animasi | **Framer Motion** | 13 | Micro-interaction: drawer, modal, toast, daftar KRS, bar progres |
| Ikon | **Lucide React** | 1.x | Ikon menu dan tombol |
| Database | **MySQL** | 8.4 | Penyimpanan data |
| ORM | **Prisma** | 6.19 | Skema, query yang aman dari SQL injection, `db push`, seed |
| Autentikasi | **jose** (JWT) dan **bcryptjs** | 6.x dan 3.x | Tanda tangan sesi dan hash kata sandi |
| Runtime seed | **tsx** | 4.x | Menjalankan `prisma/seed.ts` |
| Kontainer | **OrbStack** atau Docker | | Menjalankan MySQL lewat `docker-compose.yml` |
| Font | Bricolage Grotesque dan Public Sans | | Judul dan teks isi, dimuat lewat `next/font` |

**Mengapa Server Actions dan bukan REST API?** Semua operasi data (tambah KRS, simpan nilai, dan sebagainya) ditulis sebagai fungsi server yang dipanggil langsung dari komponen. Tidak ada endpoint yang harus dibuat manual, tipe datanya ikut terbawa, dan halaman otomatis diperbarui lewat `revalidatePath`.

**Mengapa JWT di cookie dan bukan tabel sesi?** Sesi berupa token bertanda tangan yang disimpan di cookie `httpOnly`, jadi tidak butuh tabel tambahan. Untuk menutup kelemahan token stateless, tiap permintaan tetap membaca ulang pengguna dari database, sehingga akun yang dihapus langsung kehilangan akses.

---

## 3. Set up dari nol

### 3.1 Prasyarat

- **Node.js** 20.9 atau lebih baru (aplikasi ini dijalankan di Node 26). Cek dengan `node -v`.
- **npm** (ikut bersama Node).
- **OrbStack** atau **Docker Desktop** untuk menjalankan MySQL. Alternatifnya, MySQL 8 yang sudah terpasang di komputer.

### 3.2 Langkah instalasi

```bash
# 1. Masuk ke folder proyek
cd sistem_informasi_akademik

# 2. Pasang dependensi (otomatis menjalankan `prisma generate`)
npm install

# 3. Siapkan file lingkungan
cp .env.example .env
```

Buka `.env`, lalu **ganti `AUTH_SECRET`** dengan string acak minimal 32 karakter:

```bash
openssl rand -base64 32
```

Isi `.env`:

| Variabel | Fungsi |
|---|---|
| `DATABASE_URL` | Alamat MySQL, contoh `mysql://root:sia_root@localhost:3306/sia` |
| `AUTH_SECRET` | Kunci penanda tangan sesi login. Wajib, minimal 32 karakter |
| `SHOW_DEMO_ACCOUNTS` | `"true"` menampilkan tombol akun demo di halaman login. Ubah ke `"false"` untuk penggunaan sungguhan |

```bash
# 4. Nyalakan MySQL (buka OrbStack atau Docker Desktop dulu)
docker compose up -d

# 5. Buat tabel dan isi data awal
npm run db:reset

# 6. Jalankan aplikasi
npm run dev
```

Buka <http://localhost:3000>. Aplikasi mengarahkan ke halaman login.

### 3.3 Yang dilakukan `docker-compose.yml`

Menjalankan satu kontainer `sia-mysql` dari image `mysql:8.4` dengan database `sia`, kata sandi root `sia_root`, port `3306`, dan volume `sia-mysql-data` agar data tetap ada setelah kontainer dimatikan. Ada `healthcheck`, jadi `docker inspect` menunjukkan `healthy` saat MySQL siap.

### 3.4 Perintah npm

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server pengembangan (hot reload) |
| `npm run build` lalu `npm start` | Build dan jalankan versi produksi |
| `npm run lint` | Periksa kode dengan ESLint |
| `npm run db:push` | Sinkronkan skema Prisma ke database |
| `npm run db:seed` | Isi data awal (**menghapus semua data lama**) |
| `npm run db:reset` | `db:push` lalu `db:seed` |

### 3.5 Membuka database di DBeaver

Pilih **Database, New Database Connection, MySQL**, lalu isi host `localhost`, port `3306`, database `sia`, username `root`, password `sia_root`. Jika muncul error *Public Key Retrieval is not allowed*, buka tab **Driver properties** dan set `allowPublicKeyRetrieval` ke `true`, serta `useSSL` ke `false`.

---

## 4. Struktur folder

```
sistem_informasi_akademik/
├── proxy.ts                  Lapisan pertama: arahkan tamu ke /login dan tiap peran ke halamannya
├── docker-compose.yml        MySQL 8.4
├── .env / .env.example       DATABASE_URL, AUTH_SECRET, SHOW_DEMO_ACCOUNTS
├── prisma/
│   ├── schema.prisma         Definisi tabel
│   └── seed.ts               Data awal
├── lib/
│   ├── db.ts                 Satu instance PrismaClient
│   ├── auth.ts               Hash, sesi JWT, requireRole (server only)
│   ├── roles.ts              Peran, menu per peran, aturan akses path (aman di edge)
│   ├── data.ts               Semua query baca database (server only)
│   ├── nilai.ts              Konversi nilai, IPK, IPS
│   ├── format.ts             Tanggal, hari, jam WIB, deteksi bentrok jadwal
│   ├── config.ts             Semester aktif, batas SKS
│   └── demo-accounts.ts      Akun demo
├── app/
│   ├── layout.tsx            Font dan penyedia toast
│   ├── login/                Halaman login
│   ├── actions/              Server Actions: auth, krs, dosen, admin
│   └── (portal)/             Semua halaman setelah login (memakai shell sidebar)
│       ├── page.tsx          Dashboard mahasiswa
│       ├── krs, jadwal, nilai, pengumuman
│       ├── dosen/            Dashboard, persetujuan, nilai
│       └── admin/            Dashboard, mata-kuliah, pengumuman, pengguna
└── components/               Shell, modal, toast, KRS manager, dan lainnya
```

Grup rute `(portal)` tidak muncul di URL. Fungsinya membagi layout: halaman login tanpa sidebar, halaman lain dengan sidebar.

---

## 5. Struktur database

### 5.1 Diagram relasi

```mermaid
erDiagram
    users ||--o| students : "akun mahasiswa"
    users |o--o| lecturers : "akun dosen"
    lecturers ||--o{ students : "Dosen Pembimbing"
    lecturers ||--o{ courses : "Dosen pengampu"
    students ||--o{ krs : "mengambil"
    courses ||--o{ krs : "diambil"

    users {
        int id PK
        varchar username UK
        varchar password_hash
        varchar nama
        enum role
    }
    lecturers {
        int id PK
        varchar nip UK
        varchar nama
        int user_id UK
    }
    students {
        int id PK
        varchar nim UK
        varchar nama
        varchar prodi
        tinyint semester
        decimal ipk
        int total_sks
        int user_id UK
        int dosen_pembimbing_id FK
    }
    courses {
        int id PK
        varchar kode UK
        varchar nama
        tinyint sks
        enum hari
        char jam_mulai
        char jam_selesai
        varchar ruang
        varchar semester
        int lecturer_id FK
    }
    krs {
        int id PK
        int student_id FK
        int course_id FK
        enum status
        varchar semester
        decimal nilai_angka
        varchar nilai_huruf
    }
    announcements {
        int id PK
        varchar judul
        text isi
        datetime tanggal
    }
```

### 5.2 Tabel

**`users`**: akun login untuk semua peran.

| Kolom | Keterangan |
|---|---|
| `username` | Unik. Berisi NIM (mahasiswa), NIP (dosen), atau nama (admin) |
| `password_hash` | Hash bcrypt, kata sandi asli tidak pernah disimpan |
| `role` | `MAHASISWA`, `DOSEN`, atau `ADMIN` |

**`lecturers`**: data dosen. `user_id` boleh kosong, karena dosen yang belum punya akun tetap bisa jadi pengampu Mata Kuliah.

**`students`**: data mahasiswa.
- `ipk` (`DECIMAL(3,2)`) dan `total_sks` adalah nilai **turunan** yang dihitung ulang setiap Dosen menyimpan nilai. Angkanya tersimpan supaya dashboard cepat.
- `dosen_pembimbing_id` menunjuk ke `lecturers`. Inilah dasar hak Dosen menyetujui KRS mahasiswa tertentu.

**`courses`**: Mata Kuliah yang ditawarkan.
- `jam_mulai` dan `jam_selesai` berbentuk teks `HH:MM` (`CHAR(5)`) sehingga bisa dibandingkan langsung sebagai teks.
- `semester` berisi label seperti `2026/2027 Ganjil`. Mata Kuliah semester lalu tetap tersimpan untuk riwayat nilai.

**`krs`**: satu baris untuk satu mahasiswa mengambil satu Mata Kuliah di satu semester. Tabel ini juga menyimpan nilai (`nilai_angka`, `nilai_huruf`), yang kosong sebelum Dosen menginput.

**`announcements`**: pengumuman (judul, isi, tanggal).

### 5.3 Enum

| Enum | Nilai |
|---|---|
| `Role` | `MAHASISWA`, `DOSEN`, `ADMIN` |
| `StatusKrs` | `DISETUJUI`, `MENUNGGU`, `DITOLAK` |
| `Hari` | `SENIN` sampai `SABTU` |

### 5.4 Aturan integritas dan index

| Aturan | Tujuan |
|---|---|
| `krs` punya `UNIQUE(student_id, course_id)` | Mahasiswa tidak bisa mengambil Mata Kuliah yang sama dua kali, bahkan saat klik ganda atau dua tab |
| `krs.course_id` memakai `ON DELETE RESTRICT` | Mata Kuliah yang sudah dipakai KRS tidak bisa terhapus |
| `courses.lecturer_id` memakai `ON DELETE RESTRICT` | Dosen pengampu tidak bisa terhapus selama masih punya Mata Kuliah |
| `students.user_id` memakai `ON DELETE CASCADE` | Menghapus akun ikut menghapus data mahasiswanya |
| `students.dosen_pembimbing_id` memakai `ON DELETE SET NULL` | Jika Dosen dihapus, mahasiswa jadi "belum ditentukan" |
| Index `courses(semester, hari, jam_mulai)` | Mempercepat katalog dan jadwal semester berjalan |
| Index `krs(student_id, status)`, `krs(course_id)`, `students(dosen_pembimbing_id)` | Mempercepat query per mahasiswa, per Mata Kuliah, dan per Dosen Pembimbing |

### 5.5 Data awal (seed)

`npm run db:seed` menghapus semua tabel lalu mengisi:

- 1 administrator, 3 mahasiswa, 8 dosen (2 di antaranya punya akun login), 5 pengumuman.
- 38 Mata Kuliah: 24 dari empat semester lalu untuk riwayat nilai, dan 14 untuk semester berjalan.
- Riwayat nilai empat semester untuk tiap mahasiswa (nilai dibuat dengan pengacak deterministik, jadi hasil seed selalu sama). IPK dan total SKS dihitung dari riwayat itu.
- KRS semester berjalan dengan campuran status Disetujui, Menunggu, dan Ditolak, supaya tiap fitur langsung bisa dicoba.

---

## 6. Algoritma dan logika utama

### 6.1 Login, sesi, dan logout

**Login** (`app/actions/auth.ts`, `lib/auth.ts`):

1. Ambil `username` dan `password` dari formulir. Kosong berarti tolak.
2. **Pembatas percobaan**: setelah 5 kali gagal untuk satu username, login ditunda 10 menit. Penghitung ada di memori proses server.
3. Cari user berdasarkan `username`, lalu bandingkan kata sandi dengan `bcrypt.compare`. Jika username tidak ada, tetap membandingkan dengan hash tiruan supaya waktu respons sama. Ini mencegah orang menebak username mana yang terdaftar.
4. Pesan gagal selalu sama: "NIM, NIP, atau kata sandi salah".
5. Jika cocok, buat JWT (HS256, masa berlaku 8 jam) berisi id dan peran, lalu simpan di cookie `sia_session` dengan `httpOnly`, `sameSite=lax`, dan `secure` di produksi.
6. Arahkan ke beranda peran: `/` (mahasiswa), `/dosen`, atau `/admin`.

**Logout** menghapus cookie lalu mengarahkan ke `/login`. Tombolnya meminta konfirmasi dulu.

### 6.2 Otorisasi tiga lapis

Pembatasan akses tidak bergantung pada satu tempat saja:

| Lapis | Tempat | Yang dicek |
|---|---|---|
| 1 | `proxy.ts` | Ada token valid? Path ini boleh untuk peran ini? Jika tidak, redirect. Cepat, tanpa akses database |
| 2 | Halaman dan layout (`requireRole`) | Baca ulang pengguna dari database dan cocokkan peran |
| 3 | Setiap Server Action | Periksa sesi dan peran lagi, lalu periksa **kepemilikan data** |

Lapis ketiga yang paling penting. Server Action bisa dipanggil langsung tanpa membuka halaman, jadi contohnya Dosen hanya boleh mengubah KRS mahasiswa yang `dosen_pembimbing_id`-nya adalah dirinya, dan mahasiswa hanya bisa mengubah KRS miliknya sendiri.

### 6.3 Menambah Mata Kuliah ke KRS

`tambahMataKuliah` menjalankan pemeriksaan berurutan. Berhenti di pemeriksaan pertama yang gagal dan mengembalikan pesan yang menjelaskan sebabnya:

1. Sesi valid dan berperan mahasiswa.
2. Mata Kuliah ada dan ditawarkan di semester aktif.
3. Belum ada di KRS mahasiswa.
4. **Batas SKS**: jumlah SKS KRS aktif ditambah SKS Mata Kuliah baru tidak boleh lebih dari 24. KRS berstatus Ditolak tidak dihitung.
5. **Bentrok jadwal**: tidak boleh ada KRS aktif di hari yang sama dengan jam beririsan.
6. Simpan dengan status `MENUNGGU`, lalu segarkan halaman terkait.

Jika dua permintaan tiba bersamaan, aturan `UNIQUE(student_id, course_id)` di database menolak yang kedua. Kode menangkap error `P2002` dan menampilkan pesan yang ramah.

### 6.4 Deteksi bentrok jadwal

Dua rentang waktu di hari yang sama bentrok bila:

```
mulaiA < selesaiB   DAN   mulaiB < selesaiA
```

Karena jam disimpan sebagai `HH:MM` dengan angka nol di depan, perbandingan teks (`"08:00" < "10:30"`) sudah setara dengan perbandingan waktu. Rentang yang hanya bersinggungan, misalnya 08:00 sampai 10:00 dan 10:00 sampai 12:00, **tidak** dianggap bentrok.

### 6.5 Membatalkan KRS

Mahasiswa hanya bisa membatalkan KRS berstatus Menunggu atau Ditolak. KRS Disetujui terkunci, dan pesan menyuruh menghubungi Dosen Pembimbing. Sebelum dihapus, modal konfirmasi selalu muncul.

### 6.6 Persetujuan KRS oleh Dosen Pembimbing

`ubahStatusKrs`:

1. KRS harus milik mahasiswa yang dibimbing Dosen yang sedang login, di semester aktif.
2. Jika KRS sudah bernilai, status **tidak bisa diubah lagi**.
3. Status baru tidak boleh sama dengan status sekarang.
4. Perubahan yang tersedia: Menunggu ke Disetujui atau Ditolak, Disetujui kembali ke Menunggu, Ditolak ke Disetujui.

`setujuiSemuaMenunggu` menyetujui semua KRS Menunggu milik satu mahasiswa dengan satu `UPDATE` massal. Tolak dan Kembalikan meminta konfirmasi karena berdampak ke mahasiswa.

### 6.7 Konversi nilai, IPS, dan IPK

Nilai angka (0 sampai 100) diubah ke huruf dan bobot dengan mencari baris pertama yang batas minimumnya terpenuhi (`lib/nilai.ts`):

| Nilai angka | Huruf | Bobot |
|---|---|---|
| 85 atau lebih | A | 4,00 |
| 80 sampai kurang dari 85 | A- | 3,75 |
| 75 sampai kurang dari 80 | B+ | 3,50 |
| 70 sampai kurang dari 75 | B | 3,00 |
| 65 sampai kurang dari 70 | B- | 2,75 |
| 60 sampai kurang dari 65 | C+ | 2,50 |
| 55 sampai kurang dari 60 | C | 2,00 |
| 40 sampai kurang dari 55 | D | 1,00 |
| kurang dari 40 | E | 0,00 |

**Rumus IP (IPS per semester dan IPK keseluruhan):**

```
IP = jumlah(bobot x SKS) / jumlah(SKS)
```

Hanya Mata Kuliah yang sudah bernilai yang dihitung. **SKS lulus** adalah jumlah SKS dari Mata Kuliah dengan bobot 1,00 atau lebih (D ke atas). Nilai ini yang ditampilkan sebagai "SKS ditempuh" dan dibandingkan dengan target 144 SKS.

### 6.8 Input nilai oleh Dosen

`simpanNilai` menerima daftar `{krsId, angka}` untuk satu Mata Kuliah:

1. Validasi tiap angka: harus 0 sampai 100 atau kosong (kosong berarti menghapus nilai).
2. Pastikan Dosen memang pengampu Mata Kuliah itu di semester aktif.
3. Pastikan semua `krsId` adalah peserta Mata Kuliah itu dengan KRS Disetujui.
4. Dalam **satu transaksi database**: simpan angka dan huruf tiap peserta, lalu hitung ulang `ipk` dan `total_sks` tiap mahasiswa yang terdampak dari seluruh nilainya.

Transaksi memastikan hasilnya semua-atau-tidak-sama-sekali, sehingga IPK tidak pernah tertinggal dari nilainya. Di layar, huruf muncul langsung saat Dosen mengetik, dan hanya baris yang berubah yang dikirim.

### 6.9 Jadwal hari ini

Server menentukan hari dan jam di zona **Asia/Jakarta (WIB)**, lalu menyaring KRS Disetujui pada hari itu. Di browser, `TodaySchedule` menghitung fase tiap Mata Kuliah dari jam WIB sekarang (diperbarui tiap 30 detik):

| Kondisi | Fase |
|---|---|
| jam sekarang sama dengan atau setelah jam selesai | Selesai |
| jam sekarang di antara jam mulai dan selesai | Berlangsung (dengan bar progres) |
| Mata Kuliah pertama yang belum mulai | Berikutnya |

Fase baru dihitung setelah komponen tampil di browser, sehingga HTML dari server dan browser sama dan tidak terjadi hydration mismatch. Hari Minggu menampilkan pesan libur.

### 6.10 Admin: Mata Kuliah dan akun

- **Simpan Mata Kuliah** memvalidasi format kode, SKS 1 sampai 6, jam selesai setelah jam mulai, lalu mengecek bentrok memakai rumus 6.4 terhadap Mata Kuliah lain di hari yang sama. Bentrok **Dosen** (satu Dosen mengajar dua kelas bersamaan) dan bentrok **ruang** (satu ruang dipakai dua kelas) sama-sama ditolak, lengkap dengan nama kelas yang bentrok.
- **Hapus Mata Kuliah** ditolak jika sudah dipakai KRS.
- **Tambah akun** membuat baris `users` dan `students` atau `lecturers` dalam satu transaksi. NIM atau NIP yang sudah terdaftar ditolak.
- **Ganti kata sandi** membuat sandi acak 10 karakter dengan `crypto.randomInt` (tanpa karakter yang mudah tertukar seperti `0`, `O`, `l`, `1`), menyimpan hash-nya, dan menampilkan sandi baru **satu kali saja**.

### 6.11 Feedback ke pengguna

Semua Server Action mengembalikan `{ ok, message }`. Komponen memakai `useTransition` untuk status loading (tombol menampilkan spinner dan dinonaktifkan), lalu menampilkan toast hijau atau merah. Pesan galat menjelaskan apa yang salah dan apa yang bisa dilakukan, misalnya "Batas 24 SKS terlampaui. Kamu punya 23 SKS, Kewirausahaan Digital menambah 2 SKS."

---

## 7. Cara pakai per peran

Login di `/login`. Klik salah satu **Akun demo** untuk mengisi formulir otomatis, lalu **Masuk**.

| Peran | Username | Kata sandi |
|---|---|---|
| Mahasiswa | `2410512001` | `mahasiswa123` |
| Dosen (Dosen Pembimbing) | `198203102008011005` | `dosen123` |
| Administrator | `admin` | `admin123` |

Mahasiswa demo lain: `2410512002` dan `2410512003` (kata sandi `mahasiswa123`), keduanya dibimbing Dosen di atas. Dosen kedua yang bisa login: `197906222005012003` (`dosen123`), pengampu Basis Data Lanjut.

### 7.1 Mahasiswa

1. **Dashboard**: lihat jadwal hari ini, IPK, SKS, ringkasan KRS, Dosen Pembimbing, dan pengumuman terbaru.
2. **KRS**:
   - Cari Mata Kuliah di bagian *Mata Kuliah Tersedia* (nama, kode, atau hari), lalu klik **Tambah**. Statusnya jadi Menunggu.
   - Untuk membatalkan, klik **Batalkan** lalu konfirmasi di modal.
   - KRS Disetujui punya ikon gembok: batalkan lewat Dosen Pembimbing.
   - Coba menambah Data Mining (bentrok dengan Basis Data Lanjut) untuk melihat pesan bentrok.
3. **Jadwal Kuliah**: jadwal seminggu, dikelompokkan per hari.
4. **Nilai**: riwayat per semester dengan IPS, ditambah IPK dan SKS lulus di bagian atas.
5. **Pengumuman**: seluruh pengumuman.

### 7.2 Dosen

1. **Dashboard**: jadwal mengajar hari ini, jumlah KRS yang menunggu, dan jumlah mahasiswa yang belum bernilai.
2. **Persetujuan KRS**: pilih filter *Perlu tindakan* atau *Semua mahasiswa*. Per Mata Kuliah: **Setujui**, **Tolak**, atau **Kembalikan ke Menunggu**. Tombol **Setujui semua** menyetujui semua KRS Menunggu satu mahasiswa.
3. **Input Nilai**: pilih Mata Kuliah yang diampu, isi nilai 0 sampai 100 (huruf muncul otomatis), lalu **Simpan nilai** dan konfirmasi. Mahasiswa langsung melihat nilainya dan IPK dihitung ulang.

### 7.3 Administrator

1. **Dashboard**: jumlah mahasiswa, dosen, Mata Kuliah, KRS menunggu, dan pengumuman.
2. **Mata Kuliah**: **Tambah Mata Kuliah**, **Ubah**, atau hapus (ikon tempat sampah, nonaktif bila sudah dipakai KRS).
3. **Pengumuman**: tulis, ubah, atau hapus. Pengumuman langsung tampil ke mahasiswa dan dosen.
4. **Pengguna**: **Tambah akun** (mahasiswa atau dosen) atau **Ganti kata sandi**.

---

## 8. Prinsip desain antarmuka

- **Istilah konsisten.** Satu konsep memakai satu kata di seluruh aplikasi:
  - *Mata Kuliah* (tidak berganti-ganti dengan "matkul" atau "course"), *SKS*, *KRS*, *Nilai*.
  - *Dosen Pembimbing* untuk dosen wali mahasiswa, *Dosen pengampu* untuk pengajar suatu Mata Kuliah.
  - Kata kerja tetap: **Tambah** dan **Batalkan** untuk KRS, **Setujui** dan **Tolak** untuk Dosen, **Simpan** untuk formulir, **Hapus** untuk data admin.
- **Navigasi terstruktur.** Menu berbeda per peran dan berisi paling banyak lima item. Halaman aktif ditandai garis kuning di sidebar.
- **Mobile-first.** Di layar kecil sidebar berubah menjadi drawer dari tombol hamburger, tabel bisa digulir ke samping, dan modal muncul dari bawah.
- **Warna berarti sesuatu.** Biru almamater untuk struktur, kuning untuk penanda "sekarang" dan halaman aktif, hijau, kuning tua, dan merah hanya untuk status.
- **Aksesibilitas dasar.** Fokus keyboard terlihat, modal menjebak fokus dan bisa ditutup dengan Esc, ada tautan "Lewati ke konten", elemen dinamis memakai `aria-live`, dan animasi mengikuti pengaturan "reduce motion" sistem.

---

## 9. Keamanan dan keterbatasan

**Yang sudah diterapkan:**

- Kata sandi disimpan sebagai hash bcrypt, tidak pernah sebagai teks.
- Cookie sesi `httpOnly` (tidak terbaca JavaScript), bertanda tangan, dan `secure` di produksi.
- Pembatasan akses berlapis (6.2) dan pemeriksaan kepemilikan data di setiap Server Action.
- Query lewat Prisma memakai parameter, sehingga aman dari SQL injection.
- Input divalidasi di server (rentang nilai, format kode, panjang teks), bukan hanya di formulir.

**Keterbatasan yang perlu diketahui:**

- Pembatas percobaan login tersimpan di memori satu proses. Bila server dijalankan lebih dari satu instans, perlu penyimpanan bersama seperti Redis.
- Sesi tidak bisa dicabut individual sebelum 8 jam kecuali akunnya dihapus.
- Belum ada fitur "lupa kata sandi" mandiri. Administrator yang menggantinya.
- Belum ada perlindungan CSRF tambahan selain `sameSite=lax` dan pemeriksaan origin bawaan Server Actions Next.js.
- Akun demo dan kata sandinya hanya untuk pengembangan. Sebelum dipakai sungguhan, ganti `AUTH_SECRET`, set `SHOW_DEMO_ACCOUNTS="false"`, dan hapus data seed.
- Semester aktif (`2026/2027 Ganjil`), batas 24 SKS, dan target 144 SKS diatur di `lib/config.ts` dan belum bisa diubah dari antarmuka.
- `npm run db:reset` menghapus semua data. Jangan dijalankan di database yang berisi data asli.

---

## 10. Pemecahan masalah

| Gejala | Penyebab dan solusi |
|---|---|
| Halaman "Data belum bisa dimuat" | MySQL belum menyala atau tabel kosong. Jalankan `docker compose up -d` lalu `npm run db:reset` |
| `P1001: Can't reach database server at localhost:3306` | Kontainer mati atau port belum diteruskan. Pastikan OrbStack terbuka, lalu `docker compose down && docker compose up -d`, tunggu sampai `healthy`, dan jalankan `npm run db:reset` |
| `failed to connect to the docker API` | Aplikasi Docker atau OrbStack belum berjalan. Buka aplikasinya. Untuk OrbStack, pastikan konteks aktif dengan `docker context use orbstack` |
| Setelah OrbStack dimulai ulang, halaman error lagi | Ulangi `docker compose up -d && npm run db:reset` |
| `AUTH_SECRET belum diatur atau kurang dari 32 karakter` | Isi `AUTH_SECRET` di `.env` dengan hasil `openssl rand -base64 32`, lalu restart server |
| `prisma db push` menolak karena akan menghapus data | Skema berubah dan tabel berisi data. Jika datanya hanya seed, kosongkan tabel lalu ulangi. Jika data asli, buat migrasi manual |
| Tidak bisa login padahal sandi benar | Setelah 5 kali salah, login ditunda 10 menit. Tunggu, atau restart server untuk mengosongkan penghitung |
| Perubahan skema tidak terbaca | Jalankan `npx prisma generate` lalu restart `npm run dev` |
