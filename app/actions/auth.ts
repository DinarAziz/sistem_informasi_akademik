"use server";

import { redirect } from "next/navigation";
import { buatSesi, hapusSesi, verifikasiKredensial } from "@/lib/auth";
import { homeFor } from "@/lib/roles";

export type LoginState = { error?: string };

// Pembatas percobaan per username (di memori proses; cukup untuk satu server, ganti dengan Redis bila diskalakan)
const MAKS_GAGAL = 5;
const JEDA_MS = 10 * 60 * 1000;
const percobaan = new Map<string, { jumlah: number; sampai: number }>();

export async function masuk(_prev: LoginState, form: FormData): Promise<LoginState> {
  const username = String(form.get("username") ?? "").trim().slice(0, 30);
  const password = String(form.get("password") ?? "").slice(0, 100);
  if (!username || !password) return { error: "Isi NIM, NIP, atau username dan kata sandi." };

  const kunci = username.toLowerCase();
  const catatan = percobaan.get(kunci);
  if (catatan && catatan.sampai > Date.now() && catatan.jumlah >= MAKS_GAGAL) {
    const menit = Math.ceil((catatan.sampai - Date.now()) / 60000);
    return { error: `Terlalu banyak percobaan gagal. Coba lagi dalam ${menit} menit.` };
  }

  let user;
  try {
    user = await verifikasiKredensial(username, password);
  } catch (e) {
    console.error("masuk", e);
    return { error: "Server tidak bisa memeriksa akun sekarang. Coba lagi sebentar lagi." };
  }

  if (!user) {
    const jumlah = catatan && catatan.sampai > Date.now() ? catatan.jumlah + 1 : 1;
    percobaan.set(kunci, { jumlah, sampai: Date.now() + JEDA_MS });
    return { error: "NIM, NIP, atau kata sandi salah. Periksa lagi lalu coba masuk." };
  }

  percobaan.delete(kunci);
  await buatSesi(user);
  redirect(homeFor(user.role));
}

export async function keluar() {
  await hapusSesi();
  redirect("/login");
}
