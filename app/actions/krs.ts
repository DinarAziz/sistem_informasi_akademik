"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { MAKS_SKS_SEMESTER, SEMESTER_AKTIF } from "@/lib/config";
import { bentrok, LABEL_HARI } from "@/lib/format";

export type ActionResult = { ok: true; message: string } | { ok: false; message: string };

const refresh = () => {
  for (const path of ["/", "/krs", "/jadwal", "/dosen", "/dosen/persetujuan"]) revalidatePath(path);
};

const gagal = (message: string): ActionResult => ({ ok: false, message });

/** Mahasiswa dari sesi login; null jika belum masuk atau bukan mahasiswa. */
async function getStudent() {
  const user = await getUser();
  if (!user || user.role !== "MAHASISWA") return null;
  return db.student.findUnique({ where: { userId: user.id } });
}

export async function tambahMataKuliah(courseId: number): Promise<ActionResult> {
  if (!Number.isInteger(courseId)) return gagal("Mata Kuliah tidak valid.");

  try {
    const student = await getStudent();
    if (!student) return gagal("Sesi berakhir. Masuk lagi untuk melanjutkan.");
    const course = await db.course.findFirst({ where: { id: courseId, semester: SEMESTER_AKTIF } });
    if (!course) return gagal("Mata Kuliah tidak ditemukan. Muat ulang halaman lalu coba lagi.");

    const aktif = await db.krs.findMany({
      where: { studentId: student.id, semester: SEMESTER_AKTIF, status: { not: "DITOLAK" } },
      include: { course: true },
    });

    if (aktif.some((k) => k.courseId === course.id)) {
      return gagal(`${course.nama} sudah ada di KRS kamu.`);
    }

    const totalSks = aktif.reduce((sum, k) => sum + k.course.sks, 0);
    if (totalSks + course.sks > MAKS_SKS_SEMESTER) {
      return gagal(`Batas ${MAKS_SKS_SEMESTER} SKS terlampaui. Kamu punya ${totalSks} SKS, ${course.nama} menambah ${course.sks} SKS.`);
    }

    const tabrakan = aktif.find(
      (k) => k.course.hari === course.hari && bentrok(k.course.jamMulai, k.course.jamSelesai, course.jamMulai, course.jamSelesai),
    );
    if (tabrakan) {
      return gagal(`Jadwal bentrok dengan ${tabrakan.course.nama} (${LABEL_HARI[course.hari]}, ${tabrakan.course.jamMulai}–${tabrakan.course.jamSelesai}).`);
    }

    await db.krs.create({
      data: { studentId: student.id, courseId: course.id, status: "MENUNGGU", semester: SEMESTER_AKTIF },
    });
    refresh();
    return { ok: true, message: `${course.nama} ditambahkan. Menunggu persetujuan Dosen Pembimbing.` };
  } catch (e) {
    // P2002 = unique constraint (klik ganda / dua tab)
    if (typeof e === "object" && e && "code" in e && e.code === "P2002") {
      return gagal("Mata Kuliah ini sudah ada di KRS kamu.");
    }
    console.error("tambahMataKuliah", e);
    return gagal("Server tidak bisa menyimpan KRS. Coba lagi sebentar lagi.");
  }
}

export async function batalkanMataKuliah(krsId: number): Promise<ActionResult> {
  if (!Number.isInteger(krsId)) return gagal("KRS tidak valid.");

  try {
    const student = await getStudent();
    if (!student) return gagal("Sesi berakhir. Masuk lagi untuk melanjutkan.");
    const row = await db.krs.findFirst({
      where: { id: krsId, studentId: student.id, semester: SEMESTER_AKTIF },
      include: { course: true },
    });
    if (!row) return gagal("KRS tidak ditemukan. Mungkin sudah dibatalkan.");
    if (row.status === "DISETUJUI") {
      return gagal(`${row.course.nama} sudah disetujui. Hubungi Dosen Pembimbing untuk membatalkannya.`);
    }

    await db.krs.delete({ where: { id: row.id } });
    refresh();
    return { ok: true, message: `${row.course.nama} dibatalkan.` };
  } catch (e) {
    console.error("batalkanMataKuliah", e);
    return gagal("Server tidak bisa membatalkan Mata Kuliah. Coba lagi sebentar lagi.");
  }
}
