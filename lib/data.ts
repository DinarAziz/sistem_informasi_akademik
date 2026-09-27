import "server-only";
import { cache } from "react";
import type { Hari, StatusKrs } from "@prisma/client";
import { db } from "./db";
import { requireRole } from "./auth";
import { SEMESTER_AKTIF } from "./config";
import { URUTAN_HARI } from "./format";

export type CourseDto = {
  id: number;
  kode: string;
  nama: string;
  sks: number;
  hari: Hari;
  jamMulai: string;
  jamSelesai: string;
  ruang: string;
  dosen: string;
};

export type KrsDto = { id: number; status: StatusKrs; course: CourseDto };

const courseSelect = {
  id: true, kode: true, nama: true, sks: true, hari: true,
  jamMulai: true, jamSelesai: true, ruang: true,
  lecturer: { select: { nama: true } },
} as const;

type CourseRow = { lecturer: { nama: string } } & Omit<CourseDto, "dosen">;

export const toCourseDto = ({ lecturer, ...c }: CourseRow): CourseDto => ({ ...c, dosen: lecturer.nama });

const urutJadwal = (a: CourseDto, b: CourseDto) =>
  URUTAN_HARI.indexOf(a.hari) - URUTAN_HARI.indexOf(b.hari) || a.jamMulai.localeCompare(b.jamMulai);

/* ---------- Mahasiswa ---------- */

export const getCurrentStudent = cache(async () => {
  const user = await requireRole("MAHASISWA");
  const s = await db.student.findUnique({ where: { userId: user.id }, include: { dosenPembimbing: true } });
  if (!s) throw new Error(`Data mahasiswa untuk akun ${user.username} tidak ditemukan. Jalankan "npm run db:reset".`);
  return { ...s, ipk: Number(s.ipk), dosenPembimbing: s.dosenPembimbing?.nama ?? "Belum ditentukan" };
});

export const getKrs = cache(async (studentId: number): Promise<KrsDto[]> => {
  const rows = await db.krs.findMany({
    where: { studentId, semester: SEMESTER_AKTIF },
    select: { id: true, status: true, course: { select: courseSelect } },
  });
  return rows.map((r) => ({ id: r.id, status: r.status, course: toCourseDto(r.course) })).sort((a, b) => urutJadwal(a.course, b.course));
});

export async function getCourseCatalog(studentId: number): Promise<CourseDto[]> {
  const rows = await db.course.findMany({
    where: { semester: SEMESTER_AKTIF, krs: { none: { studentId } } },
    select: courseSelect,
    orderBy: { kode: "asc" },
  });
  return rows.map(toCourseDto);
}

export type NilaiSemester = {
  semester: string;
  rows: { id: number; kode: string; nama: string; sks: number; angka: number | null; huruf: string | null }[];
};

export async function getRiwayatNilai(studentId: number): Promise<NilaiSemester[]> {
  const rows = await db.krs.findMany({
    where: { studentId, status: "DISETUJUI" },
    select: { id: true, semester: true, nilaiAngka: true, nilaiHuruf: true, course: { select: { kode: true, nama: true, sks: true } } },
    orderBy: [{ semester: "desc" }, { course: { kode: "asc" } }],
  });
  const map = new Map<string, NilaiSemester>();
  for (const r of rows) {
    const group = map.get(r.semester) ?? { semester: r.semester, rows: [] };
    group.rows.push({ id: r.id, ...r.course, angka: r.nilaiAngka === null ? null : Number(r.nilaiAngka), huruf: r.nilaiHuruf });
    map.set(r.semester, group);
  }
  return [...map.values()];
}

export async function getAnnouncements(limit?: number) {
  return db.announcement.findMany({ orderBy: { tanggal: "desc" }, take: limit });
}

/* ---------- Dosen ---------- */

export const getCurrentLecturer = cache(async () => {
  const user = await requireRole("DOSEN");
  const l = await db.lecturer.findUnique({ where: { userId: user.id } });
  if (!l) throw new Error(`Data dosen untuk akun ${user.username} tidak ditemukan. Jalankan "npm run db:reset".`);
  return l;
});

export type BimbinganDto = {
  studentId: number;
  nim: string;
  nama: string;
  ipk: number;
  krs: { id: number; status: StatusKrs; sudahDinilai: boolean; course: CourseDto }[];
};

/** Mahasiswa bimbingan beserta KRS semester aktif. */
export async function getBimbingan(lecturerId: number): Promise<BimbinganDto[]> {
  const students = await db.student.findMany({
    where: { dosenPembimbingId: lecturerId },
    orderBy: { nim: "asc" },
    select: {
      id: true, nim: true, nama: true, ipk: true,
      krs: {
        where: { semester: SEMESTER_AKTIF },
        select: { id: true, status: true, nilaiHuruf: true, course: { select: courseSelect } },
      },
    },
  });
  return students.map((s) => ({
    studentId: s.id,
    nim: s.nim,
    nama: s.nama,
    ipk: Number(s.ipk),
    krs: s.krs
      .map((k) => ({ id: k.id, status: k.status, sudahDinilai: k.nilaiHuruf !== null, course: toCourseDto(k.course) }))
      .sort((a, b) => urutJadwal(a.course, b.course)),
  }));
}

export type KelasDto = {
  course: CourseDto;
  peserta: { krsId: number; nim: string; nama: string; angka: number | null; huruf: string | null }[];
};

/** Mata Kuliah yang diampu dosen semester ini beserta peserta (KRS Disetujui). */
export async function getKelasDosen(lecturerId: number): Promise<KelasDto[]> {
  const courses = await db.course.findMany({
    where: { lecturerId, semester: SEMESTER_AKTIF },
    select: {
      ...courseSelect,
      krs: {
        where: { status: "DISETUJUI", semester: SEMESTER_AKTIF },
        select: { id: true, nilaiAngka: true, nilaiHuruf: true, student: { select: { nim: true, nama: true } } },
        orderBy: { student: { nim: "asc" } },
      },
    },
  });
  return courses
    .map(({ krs, ...c }) => ({
      course: toCourseDto(c),
      peserta: krs.map((k) => ({
        krsId: k.id,
        ...k.student,
        angka: k.nilaiAngka === null ? null : Number(k.nilaiAngka),
        huruf: k.nilaiHuruf,
      })),
    }))
    .sort((a, b) => urutJadwal(a.course, b.course));
}

/* ---------- Admin ---------- */

export async function getAdminCourses() {
  const rows = await db.course.findMany({
    where: { semester: SEMESTER_AKTIF },
    select: { ...courseSelect, lecturerId: true, _count: { select: { krs: true } } },
  });
  return rows
    .map(({ _count, lecturerId, ...c }) => ({ ...toCourseDto(c), lecturerId, jumlahKrs: _count.krs }))
    .sort(urutJadwal);
}

export const getLecturers = () =>
  db.lecturer.findMany({ select: { id: true, nip: true, nama: true }, orderBy: { nama: "asc" } });

export async function getUsers() {
  return db.user.findMany({
    orderBy: [{ role: "asc" }, { username: "asc" }],
    select: {
      id: true, username: true, nama: true, role: true,
      student: { select: { dosenPembimbing: { select: { nama: true } } } },
    },
  });
}

export async function getAdminStats() {
  const [mahasiswa, dosen, mataKuliah, krsMenunggu, pengumuman] = await Promise.all([
    db.student.count(),
    db.lecturer.count(),
    db.course.count({ where: { semester: SEMESTER_AKTIF } }),
    db.krs.count({ where: { semester: SEMESTER_AKTIF, status: "MENUNGGU" } }),
    db.announcement.count(),
  ]);
  return { mahasiswa, dosen, mataKuliah, krsMenunggu, pengumuman };
}
