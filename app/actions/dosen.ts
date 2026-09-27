"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { SEMESTER_AKTIF } from "@/lib/config";
import { hitungIp, konversiNilai } from "@/lib/nilai";
import { LABEL_STATUS } from "@/lib/format";
import type { ActionResult } from "./krs";
import type { Prisma, StatusKrs } from "@prisma/client";

const gagal = (message: string): ActionResult => ({ ok: false, message });

async function getLecturer() {
  const user = await getUser();
  if (!user || user.role !== "DOSEN") return null;
  return db.lecturer.findUnique({ where: { userId: user.id } });
}

const refresh = () => {
  for (const p of ["/dosen", "/dosen/persetujuan", "/dosen/nilai", "/krs", "/jadwal", "/nilai", "/"]) revalidatePath(p);
};

export async function ubahStatusKrs(krsId: number, status: StatusKrs): Promise<ActionResult> {
  if (!Number.isInteger(krsId) || !["DISETUJUI", "DITOLAK", "MENUNGGU"].includes(status)) return gagal("Permintaan tidak valid.");
  try {
    const dosen = await getLecturer();
    if (!dosen) return gagal("Sesi berakhir. Masuk lagi untuk melanjutkan.");

    const krs = await db.krs.findFirst({
      where: { id: krsId, semester: SEMESTER_AKTIF, student: { dosenPembimbingId: dosen.id } },
      include: { course: true, student: true },
    });
    if (!krs) return gagal("KRS ini bukan milik mahasiswa bimbingan kamu.");
    if (krs.nilaiHuruf) return gagal(`${krs.course.nama} sudah bernilai untuk ${krs.student.nama}. Status KRS tidak bisa diubah lagi.`);
    if (krs.status === status) return gagal(`Status sudah ${LABEL_STATUS[status]}.`);

    await db.krs.update({ where: { id: krs.id }, data: { status } });
    refresh();
    const label = status === "DISETUJUI" ? "disetujui" : status === "DITOLAK" ? "ditolak" : "dikembalikan ke Menunggu";
    return { ok: true, message: `${krs.course.nama} untuk ${krs.student.nama} ${label}.` };
  } catch (e) {
    console.error("ubahStatusKrs", e);
    return gagal("Server tidak bisa menyimpan perubahan. Coba lagi sebentar lagi.");
  }
}

export async function setujuiSemuaMenunggu(studentId: number): Promise<ActionResult> {
  if (!Number.isInteger(studentId)) return gagal("Permintaan tidak valid.");
  try {
    const dosen = await getLecturer();
    if (!dosen) return gagal("Sesi berakhir. Masuk lagi untuk melanjutkan.");
    const student = await db.student.findFirst({ where: { id: studentId, dosenPembimbingId: dosen.id } });
    if (!student) return gagal("Mahasiswa ini bukan bimbingan kamu.");

    const { count } = await db.krs.updateMany({
      where: { studentId, semester: SEMESTER_AKTIF, status: "MENUNGGU" },
      data: { status: "DISETUJUI" },
    });
    refresh();
    return count === 0
      ? gagal(`Tidak ada Mata Kuliah yang menunggu untuk ${student.nama}.`)
      : { ok: true, message: `${count} Mata Kuliah ${student.nama} disetujui.` };
  } catch (e) {
    console.error("setujuiSemuaMenunggu", e);
    return gagal("Server tidak bisa menyimpan perubahan. Coba lagi sebentar lagi.");
  }
}

/** Hitung ulang IPK dan total SKS lulus dari seluruh nilai mahasiswa. */
async function hitungUlangIpk(tx: Prisma.TransactionClient, studentId: number) {
  const rows = await tx.krs.findMany({
    where: { studentId, status: "DISETUJUI", nilaiHuruf: { not: null } },
    select: { nilaiHuruf: true, course: { select: { sks: true } } },
  });
  const { ip, sksLulus } = hitungIp(rows.map((r) => ({ sks: r.course.sks, huruf: r.nilaiHuruf })));
  await tx.student.update({ where: { id: studentId }, data: { ipk: ip.toFixed(2), totalSks: sksLulus } });
}

export async function simpanNilai(courseId: number, entries: { krsId: number; angka: number | null }[]): Promise<ActionResult> {
  if (!Number.isInteger(courseId) || !Array.isArray(entries) || entries.length === 0 || entries.length > 500) return gagal("Permintaan tidak valid.");
  for (const e of entries) {
    if (!Number.isInteger(e.krsId)) return gagal("Permintaan tidak valid.");
    if (e.angka !== null && (typeof e.angka !== "number" || !Number.isFinite(e.angka) || e.angka < 0 || e.angka > 100)) {
      return gagal("Nilai harus berupa angka 0 sampai 100.");
    }
  }

  try {
    const dosen = await getLecturer();
    if (!dosen) return gagal("Sesi berakhir. Masuk lagi untuk melanjutkan.");
    const course = await db.course.findFirst({ where: { id: courseId, lecturerId: dosen.id, semester: SEMESTER_AKTIF } });
    if (!course) return gagal("Kamu bukan dosen pengampu Mata Kuliah ini.");

    const peserta = await db.krs.findMany({
      where: { courseId, semester: SEMESTER_AKTIF, status: "DISETUJUI", id: { in: entries.map((e) => e.krsId) } },
      select: { id: true, studentId: true },
    });
    if (peserta.length !== entries.length) return gagal("Ada mahasiswa yang bukan peserta Mata Kuliah ini. Muat ulang halaman lalu coba lagi.");
    const studentOf = new Map(peserta.map((p) => [p.id, p.studentId]));

    await db.$transaction(async (tx) => {
      for (const { krsId, angka } of entries) {
        const nilai = angka === null ? { nilaiAngka: null, nilaiHuruf: null } : { nilaiAngka: Math.round(angka * 100) / 100, nilaiHuruf: konversiNilai(angka).huruf };
        await tx.krs.update({ where: { id: krsId }, data: nilai });
      }
      for (const studentId of new Set(studentOf.values())) await hitungUlangIpk(tx, studentId);
    });

    refresh();
    return { ok: true, message: `Nilai ${entries.length} mahasiswa di ${course.nama} disimpan. IPK dihitung ulang.` };
  } catch (e) {
    console.error("simpanNilai", e);
    return gagal("Server tidak bisa menyimpan nilai. Coba lagi sebentar lagi.");
  }
}
