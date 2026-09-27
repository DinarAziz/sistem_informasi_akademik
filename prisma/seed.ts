import { PrismaClient, Hari, StatusKrs, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { hitungIp, konversiNilai } from "../lib/nilai";
import { AKUN_DEMO } from "../lib/demo-accounts";

const prisma = new PrismaClient();
const SEMESTER = "2026/2027 Ganjil";

const daysAgo = (n: number, hour = 9) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
};

// Generator acak deterministik supaya seed selalu menghasilkan nilai yang sama
const rng = (seed: number) => () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;

const lecturers = {
  maya: { nip: "197906222005012003", nama: "Dr. Maya Kusuma, M.T.", login: true },
  bambang: { nip: "196811152000031002", nama: "Ir. Bambang Sutrisno, M.Kom." },
  rina: { nip: "198507302010122004", nama: "Rina Anggraini, S.Kom., M.Cs." },
  hendra: { nip: "198203102008011005", nama: "Dr. Hendra Wijaya, M.Kom.", login: true },
  sari: { nip: "197404052001122001", nama: "Prof. Sari Wulandari, Ph.D." },
  agus: { nip: "198811212015041003", nama: "Agus Prasetyo, S.T., M.Sc." },
  faisal: { nip: "198009182006041001", nama: "Dr. Faisal Ramadhan, M.Kom." },
  wahyu: { nip: "196503122000031001", nama: "Drs. Wahyu Nugroho, M.M." },
} as const;
type Dosen = keyof typeof lecturers;
const DOSEN_KEYS = Object.keys(lecturers) as Dosen[];

// Riwayat: 4 semester x 6 Mata Kuliah
const riwayat: { semester: string; rows: [string, string, number][] }[] = [
  { semester: "2024/2025 Ganjil", rows: [["SI101", "Pengantar Sistem Informasi", 3], ["SI102", "Algoritma dan Pemrograman", 4], ["SI103", "Matematika Diskrit", 3], ["SI104", "Bahasa Inggris Teknis", 2], ["SI105", "Pancasila dan Kewarganegaraan", 2], ["SI106", "Pengantar Manajemen", 3]] },
  { semester: "2024/2025 Genap", rows: [["SI201", "Struktur Data", 3], ["SI202", "Basis Data", 3], ["SI203", "Organisasi dan Arsitektur Komputer", 3], ["SI204", "Kalkulus", 3], ["SI205", "Sistem Operasi", 3], ["SI206", "Akuntansi Dasar", 2]] },
  { semester: "2025/2026 Ganjil", rows: [["SI301", "Pemrograman Berorientasi Objek", 3], ["SI302", "Jaringan Komputer", 3], ["SI303", "Rekayasa Perangkat Lunak", 3], ["SI304", "Sistem Informasi Manajemen", 3], ["SI305", "Aljabar Linear", 3], ["SI306", "Metodologi Penelitian", 2]] },
  { semester: "2025/2026 Genap", rows: [["SI401", "Pemrograman Web Dasar", 3], ["SI402", "Manajemen Basis Data", 3], ["SI403", "Sistem Pendukung Keputusan", 3], ["SI404", "Teori Probabilitas", 3], ["SI405", "Komputasi Awan", 3], ["SI406", "Ekonomi Teknik", 2]] },
];

const HARI_LIST = [Hari.SENIN, Hari.SELASA, Hari.RABU, Hari.KAMIS, Hari.JUMAT];

// Semester berjalan
const sekarang: [string, string, number, Hari, string, string, string, Dosen][] = [
  ["SI501", "Basis Data Lanjut", 3, "SENIN", "08:00", "10:30", "Lab Komputer 2", "maya"],
  ["SI502", "Analisis dan Perancangan Sistem", 3, "SENIN", "13:00", "15:30", "R. 3.04", "bambang"],
  ["SI503", "Pemrograman Web", 3, "SELASA", "08:00", "10:30", "Lab Komputer 1", "rina"],
  ["SI504", "Manajemen Proyek TI", 2, "SELASA", "10:45", "12:25", "R. 2.11", "hendra"],
  ["SI505", "Statistika untuk Sistem Informasi", 3, "RABU", "09:00", "11:30", "R. 3.02", "sari"],
  ["SI506", "Keamanan Informasi", 3, "RABU", "13:00", "15:30", "R. 3.06", "agus"],
  ["SI507", "Interaksi Manusia dan Komputer", 3, "KAMIS", "08:00", "10:30", "R. 2.09", "rina"],
  ["SI508", "Sistem Enterprise (ERP)", 3, "KAMIS", "13:00", "15:30", "Lab Komputer 3", "maya"],
  ["SI509", "Kecerdasan Buatan", 3, "JUMAT", "08:00", "10:30", "R. 3.01", "faisal"],
  ["SI510", "Etika Profesi", 2, "JUMAT", "13:30", "15:10", "R. 1.05", "wahyu"],
  ["SI511", "Data Mining", 3, "SENIN", "08:00", "10:30", "Lab Komputer 3", "faisal"],
  ["SI512", "Pemrograman Mobile", 3, "SELASA", "13:00", "15:30", "Lab Komputer 1", "agus"],
  ["SI513", "Kewirausahaan Digital", 2, "SABTU", "08:00", "09:40", "R. 1.02", "wahyu"],
  ["SI514", "Audit Sistem Informasi", 3, "SABTU", "10:00", "12:30", "R. 3.05", "bambang"],
];

const mahasiswa = [
  {
    nim: "2410512001", nama: "Alya Rahmawati", base: 86, seed: 11,
    krs: { SI501: "DISETUJUI", SI503: "DISETUJUI", SI505: "DISETUJUI", SI506: "DISETUJUI", SI507: "MENUNGGU", SI509: "MENUNGGU", SI510: "DITOLAK" },
  },
  {
    nim: "2410512002", nama: "Bima Saputra", base: 75, seed: 22,
    krs: { SI501: "DISETUJUI", SI503: "MENUNGGU", SI504: "MENUNGGU", SI508: "MENUNGGU" },
  },
  {
    nim: "2410512003", nama: "Citra Lestari", base: 80, seed: 33,
    krs: { SI501: "DISETUJUI", SI502: "MENUNGGU", SI505: "MENUNGGU", SI509: "DISETUJUI" },
  },
] as { nim: string; nama: string; base: number; seed: number; krs: Record<string, StatusKrs> }[];

const announcements = [
  { judul: "Batas akhir pengisian KRS diperpanjang", isi: "Pengisian dan perubahan KRS semester Ganjil 2026/2027 diperpanjang sampai Jumat pekan ini pukul 23.59 WIB. Setelah batas ini, perubahan hanya bisa dilakukan lewat Dosen Pembimbing.", tanggal: daysAgo(0, 8) },
  { judul: "Jadwal Ujian Tengah Semester", isi: "Ujian Tengah Semester berlangsung dua pekan lagi. Jadwal per Mata Kuliah dan ruang ujian akan diumumkan di halaman ini paling lambat tujuh hari sebelumnya.", tanggal: daysAgo(2, 10) },
  { judul: "Pengajuan beasiswa prestasi dibuka", isi: "Mahasiswa dengan IPK minimal 3,50 dapat mengajukan beasiswa prestasi. Unggah transkrip terbaru dan surat rekomendasi Dosen Pembimbing ke bagian kemahasiswaan.", tanggal: daysAgo(4, 13) },
  { judul: "Pemeliharaan Lab Komputer 2", isi: "Lab Komputer 2 ditutup Sabtu ini untuk pemeliharaan jaringan. Praktikum yang terdampak dipindah ke Lab Komputer 3.", tanggal: daysAgo(6, 15) },
  { judul: "Seminar Karier: Data Engineer di Industri", isi: "Seminar terbuka untuk semua mahasiswa Sistem Informasi, Aula Lantai 4. Pendaftaran gratis lewat formulir kemahasiswaan.", tanggal: daysAgo(9, 9) },
];

async function main() {
  await prisma.krs.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.course.deleteMany();
  await prisma.student.deleteMany();
  await prisma.lecturer.deleteMany();
  await prisma.user.deleteMany();

  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  await prisma.user.create({ data: { username: "admin", passwordHash: hash("admin123"), nama: "Administrator Akademik", role: Role.ADMIN } });

  // Dosen
  const dosenId = {} as Record<Dosen, number>;
  for (const key of DOSEN_KEYS) {
    const d = lecturers[key];
    const user = "login" in d
      ? await prisma.user.create({ data: { username: d.nip, passwordHash: hash("dosen123"), nama: d.nama, role: Role.DOSEN } })
      : null;
    dosenId[key] = (await prisma.lecturer.create({ data: { nip: d.nip, nama: d.nama, userId: user?.id } })).id;
  }

  // Mata Kuliah (riwayat + semester berjalan)
  const kursus = new Map<string, { id: number; sks: number }>();
  let n = 0;
  for (const { semester, rows } of riwayat) {
    for (const [kode, nama, sks] of rows) {
      const c = await prisma.course.create({
        data: {
          kode, nama, sks, semester,
          hari: HARI_LIST[n % 5], jamMulai: "08:00", jamSelesai: "10:30", ruang: `R. 1.0${(n % 6) + 1}`,
          lecturerId: dosenId[DOSEN_KEYS[n % DOSEN_KEYS.length]],
        },
      });
      kursus.set(kode, { id: c.id, sks });
      n++;
    }
  }
  for (const [kode, nama, sks, hari, jamMulai, jamSelesai, ruang, dosen] of sekarang) {
    const c = await prisma.course.create({ data: { kode, nama, sks, hari, jamMulai, jamSelesai, ruang, semester: SEMESTER, lecturerId: dosenId[dosen] } });
    kursus.set(kode, { id: c.id, sks });
  }

  // Mahasiswa: riwayat nilai + KRS semester berjalan
  for (const m of mahasiswa) {
    const rand = rng(m.seed);
    const user = await prisma.user.create({ data: { username: m.nim, passwordHash: hash("mahasiswa123"), nama: m.nama, role: Role.MAHASISWA } });
    const student = await prisma.student.create({
      data: { nim: m.nim, nama: m.nama, prodi: "Sistem Informasi", semester: 5, ipk: "0", totalSks: 0, userId: user.id, dosenPembimbingId: dosenId.hendra },
    });

    const nilai: { sks: number; huruf: string }[] = [];
    for (const { semester, rows } of riwayat) {
      for (const [kode, , sks] of rows) {
        const angka = Math.round(Math.min(98, Math.max(50, m.base + (rand() - 0.5) * 24)) * 100) / 100;
        const { huruf } = konversiNilai(angka);
        nilai.push({ sks, huruf });
        await prisma.krs.create({
          data: { studentId: student.id, courseId: kursus.get(kode)!.id, status: "DISETUJUI", semester, nilaiAngka: angka, nilaiHuruf: huruf },
        });
      }
    }
    const { ip, sksLulus } = hitungIp(nilai);
    await prisma.student.update({ where: { id: student.id }, data: { ipk: ip.toFixed(2), totalSks: sksLulus } });

    for (const [kode, status] of Object.entries(m.krs)) {
      await prisma.krs.create({ data: { studentId: student.id, courseId: kursus.get(kode)!.id, status, semester: SEMESTER } });
    }
  }

  await prisma.announcement.createMany({ data: announcements });

  console.log(`Seed selesai: ${mahasiswa.length} mahasiswa, ${DOSEN_KEYS.length} dosen, ${kursus.size} mata kuliah, ${announcements.length} pengumuman.`);
  console.log("Akun demo:");
  for (const a of AKUN_DEMO) console.log(`  ${a.peran.padEnd(14)} ${a.username.padEnd(20)} ${a.password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
