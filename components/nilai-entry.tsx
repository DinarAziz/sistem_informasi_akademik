"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { simpanNilai } from "@/app/actions/dosen";
import type { KelasDto } from "@/lib/data";
import { LABEL_HARI } from "@/lib/format";
import { bobotDariHuruf, konversiNilai } from "@/lib/nilai";
import { ConfirmDialog } from "./confirm-dialog";
import { useToast } from "./toast";

const parse = (v: string): number | null | "salah" => {
  const t = v.trim().replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : "salah";
};

const warna = (h: string) => {
  const b = bobotDariHuruf(h);
  return b >= 3.5 ? "text-ok" : b >= 3 ? "text-navy" : b >= 2 ? "text-wait" : "text-bad";
};

export function NilaiEntry({ kelas }: { kelas: KelasDto[] }) {
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [aktif, setAktif] = useState(kelas[0]?.course.id ?? 0);
  // input mentah per KRS: hanya berisi yang sudah diubah
  const [draft, setDraft] = useState<Record<number, string>>({});
  const [konfirmasi, setKonfirmasi] = useState(false);

  const k = kelas.find((c) => c.course.id === aktif);

  const perubahan = useMemo(() => {
    if (!k) return { entries: [] as { krsId: number; angka: number | null }[], salah: 0 };
    const entries: { krsId: number; angka: number | null }[] = [];
    let salah = 0;
    for (const p of k.peserta) {
      if (!(p.krsId in draft)) continue;
      const v = parse(draft[p.krsId]);
      if (v === "salah") salah++;
      else if (v !== p.angka) entries.push({ krsId: p.krsId, angka: v });
    }
    return { entries, salah };
  }, [k, draft]);

  if (kelas.length === 0) {
    return <p className="rounded-lg border border-dashed border-line p-6 text-sm text-muted">Kamu belum mengampu Mata Kuliah semester ini.</p>;
  }

  const simpan = () => {
    if (!k) return;
    startTransition(async () => {
      try {
        const res = await simpanNilai(k.course.id, perubahan.entries);
        toast.show(res.ok ? "success" : "error", res.message);
        if (res.ok) setDraft({});
      } catch {
        toast.show("error", "Koneksi terputus. Periksa jaringan kamu lalu coba lagi.");
      } finally {
        setKonfirmasi(false);
      }
    });
  };

  return (
    <div className="space-y-5">
      <div role="tablist" aria-label="Mata Kuliah yang diampu" className="flex flex-wrap gap-2">
        {kelas.map(({ course: c, peserta }) => (
          <button
            key={c.id}
            role="tab"
            type="button"
            aria-selected={aktif === c.id}
            onClick={() => setAktif(c.id)}
            className={`rounded-lg border px-3.5 py-2 text-left text-sm transition ${aktif === c.id ? "border-navy bg-navy text-white" : "border-line bg-white hover:border-navy/40"}`}
          >
            <span className="block font-semibold">{c.nama}</span>
            <span className={`block text-xs ${aktif === c.id ? "text-white/85" : "text-muted"}`}>
              {c.kode}, {peserta.length} mahasiswa
            </span>
          </button>
        ))}
      </div>

      {k && (
        <section aria-label={`Nilai ${k.course.nama}`} className="overflow-hidden rounded-lg border border-line bg-white">
          <header className="border-b border-line p-4 sm:px-5">
            <h2 className="font-display text-lg font-semibold">{k.course.nama}</h2>
            <p className="text-sm text-muted">
              {k.course.kode}, {k.course.sks} SKS. {LABEL_HARI[k.course.hari]}, {k.course.jamMulai}–{k.course.jamSelesai}. {k.course.ruang}
            </p>
          </header>

          {k.peserta.length === 0 ? (
            <p className="p-5 text-sm text-muted">Belum ada mahasiswa dengan KRS Disetujui di Mata Kuliah ini.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-muted">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium sm:px-5">Mahasiswa</th>
                  <th scope="col" className="w-28 px-2 py-2.5 font-medium">Nilai (0–100)</th>
                  <th scope="col" className="w-20 px-4 py-2.5 text-right font-medium sm:px-5">Huruf</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {k.peserta.map((p) => {
                  const nilaiInput = p.krsId in draft ? draft[p.krsId] : p.angka === null ? "" : String(p.angka);
                  const v = parse(nilaiInput);
                  const berubah = p.krsId in draft && v !== "salah" && v !== p.angka;
                  const huruf = v === "salah" ? null : v === null ? null : konversiNilai(v).huruf;
                  return (
                    <tr key={p.krsId} className={berubah ? "bg-gold-soft/60" : ""}>
                      <td className="px-4 py-3 sm:px-5">
                        <p className="font-semibold leading-snug">{p.nama}</p>
                        <p className="num text-xs text-muted">{p.nim}</p>
                      </td>
                      <td className="px-2 py-2">
                        <label className="sr-only" htmlFor={`nilai-${p.krsId}`}>
                          Nilai {p.nama}
                        </label>
                        <input
                          id={`nilai-${p.krsId}`}
                          inputMode="decimal"
                          value={nilaiInput}
                          onChange={(e) => setDraft((d) => ({ ...d, [p.krsId]: e.target.value }))}
                          aria-invalid={v === "salah"}
                          className={`num w-full rounded-lg border bg-white px-3 py-2 text-base ${v === "salah" ? "border-bad" : "border-line"}`}
                        />
                        {v === "salah" && <p className="mt-1 text-xs text-bad">Isi angka 0 sampai 100</p>}
                      </td>
                      <td className="px-4 py-3 text-right sm:px-5">
                        {huruf ? <span className={`font-display text-lg font-bold ${warna(huruf)}`}>{huruf}</span> : <span className="text-muted">–</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {k.peserta.length > 0 && (
            <footer className="flex flex-col gap-3 border-t border-line p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-sm text-muted" aria-live="polite">
                {perubahan.salah > 0
                  ? `${perubahan.salah} nilai belum valid. Perbaiki sebelum menyimpan.`
                  : perubahan.entries.length > 0
                    ? `${perubahan.entries.length} perubahan belum disimpan.`
                    : "Belum ada perubahan."}
              </p>
              <button
                type="button"
                disabled={isPending || perubahan.entries.length === 0 || perubahan.salah > 0}
                onClick={() => setKonfirmasi(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition active:scale-[0.97] hover:bg-navy-deep disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}
                {isPending ? "Menyimpan…" : "Simpan nilai"}
              </button>
            </footer>
          )}
        </section>
      )}

      <ConfirmDialog
        open={konfirmasi}
        tone="neutral"
        title={`Simpan nilai ${perubahan.entries.length} mahasiswa?`}
        description="Mahasiswa langsung bisa melihat nilai ini, dan IPK mereka dihitung ulang."
        confirmLabel="Ya, simpan"
        loading={isPending}
        onConfirm={simpan}
        onCancel={() => setKonfirmasi(false)}
      />
    </div>
  );
}
