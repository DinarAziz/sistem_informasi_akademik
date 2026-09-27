// Konversi nilai angka (0-100) ke huruf dan bobot 4,00. Aman dipakai di server dan client.
const SKALA: { min: number; huruf: string; bobot: number }[] = [
  { min: 85, huruf: "A", bobot: 4 },
  { min: 80, huruf: "A-", bobot: 3.75 },
  { min: 75, huruf: "B+", bobot: 3.5 },
  { min: 70, huruf: "B", bobot: 3 },
  { min: 65, huruf: "B-", bobot: 2.75 },
  { min: 60, huruf: "C+", bobot: 2.5 },
  { min: 55, huruf: "C", bobot: 2 },
  { min: 40, huruf: "D", bobot: 1 },
  { min: 0, huruf: "E", bobot: 0 },
];

export function konversiNilai(angka: number) {
  const { huruf, bobot } = SKALA.find((s) => angka >= s.min) ?? SKALA[SKALA.length - 1];
  return { huruf, bobot };
}

export const bobotDariHuruf = (huruf: string) => SKALA.find((s) => s.huruf === huruf)?.bobot ?? 0;

/** IPK/IPS = jumlah(bobot x SKS) / jumlah SKS. Mata Kuliah tanpa nilai tidak dihitung. */
export function hitungIp(rows: { sks: number; huruf: string | null }[]) {
  const dinilai = rows.filter((r) => r.huruf);
  const sks = dinilai.reduce((n, r) => n + r.sks, 0);
  if (sks === 0) return { ip: 0, sksDinilai: 0, sksLulus: 0 };
  const mutu = dinilai.reduce((n, r) => n + bobotDariHuruf(r.huruf!) * r.sks, 0);
  const sksLulus = dinilai.filter((r) => bobotDariHuruf(r.huruf!) >= 1).reduce((n, r) => n + r.sks, 0);
  return { ip: mutu / sks, sksDinilai: sks, sksLulus };
}
