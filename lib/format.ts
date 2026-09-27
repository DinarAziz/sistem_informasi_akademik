import type { Hari, StatusKrs } from "@prisma/client";
import { ZONA_WAKTU } from "./config";

export const URUTAN_HARI: Hari[] = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];

export const LABEL_HARI: Record<Hari, string> = {
  SENIN: "Senin",
  SELASA: "Selasa",
  RABU: "Rabu",
  KAMIS: "Kamis",
  JUMAT: "Jumat",
  SABTU: "Sabtu",
};

export const LABEL_STATUS: Record<StatusKrs, string> = {
  DISETUJUI: "Disetujui",
  MENUNGGU: "Menunggu",
  DITOLAK: "Ditolak",
};

const HARI_DARI_INDEKS: (Hari | null)[] = [null, "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];

/** Hari (enum) dan jam saat ini di zona waktu kampus. Minggu = null. */
export function sekarangWib(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONA_WAKTU,
    weekday: "short",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const idx = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
  return { hari: HARI_DARI_INDEKS[idx], jam: hour };
}

export function sapaan(jam: number) {
  if (jam < 11) return "Selamat pagi";
  if (jam < 15) return "Selamat siang";
  if (jam < 18) return "Selamat sore";
  return "Selamat malam";
}

export const formatTanggal = (d: Date) =>
  new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: ZONA_WAKTU }).format(d);

export const formatTanggalPanjang = (d: Date) =>
  new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: ZONA_WAKTU }).format(d);

export const formatIpk = (n: number) => n.toFixed(2).replace(".", ",");

export const menitDariJam = (jam: string) => {
  const [h, m] = jam.split(":").map(Number);
  return h * 60 + m;
};

/** True jika dua rentang "HH:MM" saling tumpang tindih. */
export const bentrok = (aMulai: string, aSelesai: string, bMulai: string, bSelesai: string) =>
  aMulai < bSelesai && bMulai < aSelesai;

/** Menit sejak tengah malam di zona waktu kampus. */
export function menitSekarangWib(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: ZONA_WAKTU, hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return (get("hour") % 24) * 60 + get("minute");
}
