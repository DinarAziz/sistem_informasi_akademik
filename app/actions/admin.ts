"use server";

import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import type { Hari } from "@prisma/client";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { SEMESTER_AKTIF } from "@/lib/config";
import { bentrok, LABEL_HARI, URUTAN_HARI } from "@/lib/format";
import type { ActionResult } from "./krs";

const gagal = (message: string): ActionResult => ({ ok: false, message });
const PESAN_SESI = "Sesi berakhir atau kamu bukan Administrator. Masuk lagi untuk melanjutkan.";
const PESAN_SERVER = "Server tidak bisa menyimpan perubahan. Coba lagi sebentar lagi.";

async function admin() {
  const user = await getUser();
  return user?.role === "ADMIN" ? user : null;
}

const isUnique = (e: unknown) => typeof e === "object" && !!e && "code" in e && e.code === "P2002";

/* ---------- Mata Kuliah ---------- */

export type MataKuliahInput = {
  id?: number;
  kode: string;
  nama: string;
  sks: number;
  hari: Hari;
  jamMulai: string;
  jamSelesai: string;
  ruang: string;
  lecturerId: number;
};

const JAM = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function simpanMataKuliah(input: MataKuliahInput): Promise<ActionResult> {
  if (!(await admin())) return gagal(PESAN_SESI);

  const kode = String(input.kode ?? "").trim().toUpperCase();
  const nama = String(input.nama ?? "").trim();
  const ruang = String(input.ruang ?? "").trim();
  if (!/^[A-Z0-9-]{3,12}$/.test(kode)) return gagal("Kode harus 3 sampai 12 karakter huruf besar atau angka, misalnya SI515.");
  if (nama.length < 3 || nama.length > 120) return gagal("Nama Mata Kuliah harus 3 sampai 120 karakter.");
  if (!Number.isInteger(input.sks) || input.sks < 1 || input.sks > 6) return gagal("SKS harus angka 1 sampai 6.");
  if (!URUTAN_HARI.includes(input.hari)) return gagal("Pilih hari kuliah.");
  if (!JAM.test(input.jamMulai) || !JAM.test(input.jamSelesai)) return gagal("Isi jam mulai dan jam selesai.");
  if (input.jamMulai >= input.jamSelesai) return gagal("Jam selesai harus setelah jam mulai.");
  if (!ruang || ruang.length > 30) return gagal("Isi ruang (maksimal 30 karakter).");

  try {
    if (!(await db.lecturer.findUnique({ where: { id: input.lecturerId } }))) return gagal("Pilih Dosen pengampu.");

    const lain = await db.course.findMany({
      where: { semester: SEMESTER_AKTIF, hari: input.hari, ...(input.id ? { id: { not: input.id } } : {}) },
      include: { lecturer: true },
    });
    const beririsan = lain.filter((c) => bentrok(c.jamMulai, c.jamSelesai, input.jamMulai, input.jamSelesai));
    const dosenBentrok = beririsan.find((c) => c.lecturerId === input.lecturerId);
    if (dosenBentrok) return gagal(`${dosenBentrok.lecturer.nama} sudah mengajar ${dosenBentrok.nama} pada ${LABEL_HARI[input.hari]} ${dosenBentrok.jamMulai}–${dosenBentrok.jamSelesai}.`);
    const ruangBentrok = beririsan.find((c) => c.ruang.toLowerCase() === ruang.toLowerCase());
    if (ruangBentrok) return gagal(`${ruang} sudah dipakai ${ruangBentrok.nama} pada ${LABEL_HARI[input.hari]} ${ruangBentrok.jamMulai}–${ruangBentrok.jamSelesai}.`);

    const data = { kode, nama, sks: input.sks, hari: input.hari, jamMulai: input.jamMulai, jamSelesai: input.jamSelesai, ruang, lecturerId: input.lecturerId };
    if (input.id) await db.course.update({ where: { id: input.id }, data });
    else await db.course.create({ data: { ...data, semester: SEMESTER_AKTIF } });

    for (const p of ["/admin", "/admin/mata-kuliah", "/krs", "/jadwal", "/dosen", "/dosen/nilai"]) revalidatePath(p);
    return { ok: true, message: `${nama} ${input.id ? "diperbarui" : "ditambahkan"}.` };
  } catch (e) {
    if (isUnique(e)) return gagal(`Kode ${kode} sudah dipakai Mata Kuliah lain.`);
    console.error("simpanMataKuliah", e);
    return gagal(PESAN_SERVER);
  }
}

export async function hapusMataKuliah(id: number): Promise<ActionResult> {
  if (!(await admin())) return gagal(PESAN_SESI);
  try {
    const course = await db.course.findUnique({ where: { id }, include: { _count: { select: { krs: true } } } });
    if (!course) return gagal("Mata Kuliah tidak ditemukan. Mungkin sudah dihapus.");
    if (course._count.krs > 0) return gagal(`${course.nama} sudah dipakai di ${course._count.krs} KRS dan tidak bisa dihapus.`);
    await db.course.delete({ where: { id } });
    for (const p of ["/admin", "/admin/mata-kuliah", "/krs"]) revalidatePath(p);
    return { ok: true, message: `${course.nama} dihapus.` };
  } catch (e) {
    console.error("hapusMataKuliah", e);
    return gagal(PESAN_SERVER);
  }
}

/* ---------- Pengumuman ---------- */

export async function simpanPengumuman(input: { id?: number; judul: string; isi: string }): Promise<ActionResult> {
  if (!(await admin())) return gagal(PESAN_SESI);
  const judul = String(input.judul ?? "").trim();
  const isi = String(input.isi ?? "").trim();
  if (judul.length < 5 || judul.length > 160) return gagal("Judul harus 5 sampai 160 karakter.");
  if (isi.length < 10 || isi.length > 5000) return gagal("Isi pengumuman harus 10 sampai 5.000 karakter.");
  try {
    if (input.id) await db.announcement.update({ where: { id: input.id }, data: { judul, isi } });
    else await db.announcement.create({ data: { judul, isi, tanggal: new Date() } });
    for (const p of ["/", "/pengumuman", "/dosen", "/admin", "/admin/pengumuman"]) revalidatePath(p);
    return { ok: true, message: `Pengumuman ${input.id ? "diperbarui" : "diterbitkan"}.` };
  } catch (e) {
    console.error("simpanPengumuman", e);
    return gagal(PESAN_SERVER);
  }
}

export async function hapusPengumuman(id: number): Promise<ActionResult> {
  if (!(await admin())) return gagal(PESAN_SESI);
  try {
    await db.announcement.delete({ where: { id } });
    for (const p of ["/", "/pengumuman", "/admin", "/admin/pengumuman"]) revalidatePath(p);
    return { ok: true, message: "Pengumuman dihapus." };
  } catch {
    return gagal("Pengumuman tidak ditemukan. Mungkin sudah dihapus.");
  }
}

/* ---------- Pengguna ---------- */

export type PenggunaInput = {
  peran: "MAHASISWA" | "DOSEN";
  username: string;
  nama: string;
  password: string;
  dosenPembimbingId?: number | null;
};

export async function buatPengguna(input: PenggunaInput): Promise<ActionResult> {
  if (!(await admin())) return gagal(PESAN_SESI);
  const username = String(input.username ?? "").trim();
  const nama = String(input.nama ?? "").trim();
  if (!["MAHASISWA", "DOSEN"].includes(input.peran)) return gagal("Pilih peran akun.");
  if (!/^[A-Za-z0-9.]{5,20}$/.test(username)) return gagal(`${input.peran === "DOSEN" ? "NIP" : "NIM"} harus 5 sampai 20 karakter huruf atau angka.`);
  if (nama.length < 3 || nama.length > 100) return gagal("Nama harus 3 sampai 100 karakter.");
  if (typeof input.password !== "string" || input.password.length < 8 || input.password.length > 72) return gagal("Kata sandi harus 8 sampai 72 karakter.");

  try {
    const passwordHash = await bcrypt.hash(input.password, 10);
    await db.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { username, nama, passwordHash, role: input.peran } });
      if (input.peran === "DOSEN") {
        await tx.lecturer.create({ data: { nip: username, nama, userId: user.id } });
      } else {
        await tx.student.create({
          data: {
            nim: username, nama, prodi: "Sistem Informasi", semester: 1, ipk: "0", totalSks: 0, userId: user.id,
            dosenPembimbingId: input.dosenPembimbingId ?? null,
          },
        });
      }
    });
    for (const p of ["/admin", "/admin/pengguna"]) revalidatePath(p);
    return { ok: true, message: `Akun ${nama} dibuat. Sampaikan kata sandi awalnya secara langsung.` };
  } catch (e) {
    if (isUnique(e)) return gagal(`${username} sudah terdaftar.`);
    console.error("buatPengguna", e);
    return gagal(PESAN_SERVER);
  }
}

export async function resetKataSandi(userId: number): Promise<ActionResult & { sandiBaru?: string }> {
  const me = await admin();
  if (!me) return gagal(PESAN_SESI);
  try {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return gagal("Akun tidak ditemukan.");
    const huruf = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
    const sandiBaru = Array.from({ length: 10 }, () => huruf[randomInt(huruf.length)]).join("");
    await db.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(sandiBaru, 10) } });
    revalidatePath("/admin/pengguna");
    return { ok: true, message: `Kata sandi ${user.nama} diganti.`, sandiBaru };
  } catch (e) {
    console.error("resetKataSandi", e);
    return gagal(PESAN_SERVER);
  }
}
