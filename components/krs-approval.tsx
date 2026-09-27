"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, CheckCheck, Loader2, RotateCcw, X } from "lucide-react";
import type { StatusKrs } from "@prisma/client";
import { setujuiSemuaMenunggu, ubahStatusKrs } from "@/app/actions/dosen";
import type { BimbinganDto } from "@/lib/data";
import { LABEL_HARI, formatIpk } from "@/lib/format";
import { MAKS_SKS_SEMESTER } from "@/lib/config";
import { ConfirmDialog } from "./confirm-dialog";
import { StatusBadge } from "./status-badge";
import { useToast } from "./toast";

type Konfirmasi =
  | { jenis: "tolak" | "kembalikan"; krsId: number; mahasiswa: string; matkul: string }
  | { jenis: "semua"; studentId: number; mahasiswa: string; jumlah: number };

export function KrsApproval({ bimbingan }: { bimbingan: BimbinganDto[] }) {
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [konfirmasi, setKonfirmasi] = useState<Konfirmasi | null>(null);
  const totalMenunggu = bimbingan.reduce((n, b) => n + b.krs.filter((k) => k.status === "MENUNGGU").length, 0);
  const [filter, setFilter] = useState<"perlu" | "semua">(totalMenunggu > 0 ? "perlu" : "semua");

  const jalankan = (key: string, task: () => Promise<{ ok: boolean; message: string }>) => {
    setBusy(key);
    startTransition(async () => {
      try {
        const res = await task();
        toast.show(res.ok ? "success" : "error", res.message);
      } catch {
        toast.show("error", "Koneksi terputus. Periksa jaringan kamu lalu coba lagi.");
      } finally {
        setBusy(null);
        setKonfirmasi(null);
      }
    });
  };

  const ubah = (krsId: number, status: StatusKrs) => jalankan(`krs-${krsId}-${status}`, () => ubahStatusKrs(krsId, status));

  const konfirmasiCopy = () => {
    if (!konfirmasi) return null;
    if (konfirmasi.jenis === "semua")
      return {
        title: `Setujui ${konfirmasi.jumlah} Mata Kuliah ${konfirmasi.mahasiswa}?`,
        description: "Semua KRS yang berstatus Menunggu untuk mahasiswa ini menjadi Disetujui.",
        confirmLabel: "Ya, setujui semua",
        tone: "neutral" as const,
        run: () => jalankan(`semua-${konfirmasi.studentId}`, () => setujuiSemuaMenunggu(konfirmasi.studentId)),
      };
    if (konfirmasi.jenis === "tolak")
      return {
        title: `Tolak ${konfirmasi.matkul}?`,
        description: `${konfirmasi.mahasiswa} akan melihat status Ditolak dan bisa memilih Mata Kuliah lain.`,
        confirmLabel: "Ya, tolak",
        tone: "danger" as const,
        run: () => ubah(konfirmasi.krsId, "DITOLAK"),
      };
    return {
      title: `Kembalikan ${konfirmasi.matkul} ke Menunggu?`,
      description: `Persetujuan untuk ${konfirmasi.mahasiswa} dicabut. Mata Kuliah ini bisa dibatalkan mahasiswa atau disetujui lagi.`,
      confirmLabel: "Ya, kembalikan",
      tone: "danger" as const,
      run: () => ubah(konfirmasi.krsId, "MENUNGGU"),
    };
  };
  const copy = konfirmasiCopy();

  const daftar = bimbingan.filter((b) => filter === "semua" || b.krs.some((k) => k.status === "MENUNGGU"));

  return (
    <div className="space-y-6">
      <div role="group" aria-label="Filter mahasiswa" className="inline-flex rounded-lg border border-line bg-white p-1 text-sm">
        {(
          [
            ["perlu", `Perlu tindakan (${totalMenunggu})`],
            ["semua", `Semua mahasiswa (${bimbingan.length})`],
          ] as const
        ).map(([nilai, label]) => (
          <button
            key={nilai}
            type="button"
            aria-pressed={filter === nilai}
            onClick={() => setFilter(nilai)}
            className={`rounded-md px-3.5 py-1.5 font-medium transition ${filter === nilai ? "bg-navy text-white" : "text-muted hover:text-ink"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {daftar.length === 0 && (
        <p className="rounded-lg border border-dashed border-line p-6 text-sm text-muted">
          Tidak ada KRS yang menunggu persetujuan. Pilih “Semua mahasiswa” untuk melihat seluruh bimbingan kamu.
        </p>
      )}

      {daftar.map((b) => {
        const menunggu = b.krs.filter((k) => k.status === "MENUNGGU").length;
        const sks = b.krs.filter((k) => k.status !== "DITOLAK").reduce((n, k) => n + k.course.sks, 0);
        return (
          <section key={b.studentId} aria-label={`KRS ${b.nama}`} className="overflow-hidden rounded-lg border border-line bg-white">
            <header className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <h2 className="font-display text-lg font-semibold">{b.nama}</h2>
                <p className="num text-sm text-muted">
                  {b.nim}, IPK {formatIpk(b.ipk)}, {sks} dari {MAKS_SKS_SEMESTER} SKS
                </p>
              </div>
              {menunggu > 0 && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setKonfirmasi({ jenis: "semua", studentId: b.studentId, mahasiswa: b.nama, jumlah: menunggu })}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-3.5 py-2 text-sm font-semibold text-white transition active:scale-[0.97] hover:bg-navy-deep disabled:opacity-50"
                >
                  {busy === `semua-${b.studentId}` ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <CheckCheck className="size-4" aria-hidden />}
                  Setujui semua ({menunggu})
                </button>
              )}
            </header>
            <ul className="divide-y divide-line">
              <AnimatePresence initial={false}>
                {b.krs.map((k) => {
                  const sibuk = busy?.startsWith(`krs-${k.id}-`);
                  return (
                    <motion.li key={k.id} layout transition={{ type: "spring", stiffness: 380, damping: 34 }} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-5 sm:px-5">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                          <h3 className="font-semibold">{k.course.nama}</h3>
                          <StatusBadge status={k.status} />
                        </div>
                        <p className="mt-0.5 text-sm text-muted">
                          {k.course.kode}, {k.course.sks} SKS. {LABEL_HARI[k.course.hari]}, <span className="num">{k.course.jamMulai}–{k.course.jamSelesai}</span>. {k.course.ruang}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {sibuk && <Loader2 className="size-4 animate-spin text-muted" aria-label="Memproses" />}
                        {k.status !== "DISETUJUI" && (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => ubah(k.id, "DISETUJUI")}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-ok px-3 py-2 text-sm font-semibold text-white transition active:scale-[0.97] hover:brightness-110 disabled:opacity-50"
                          >
                            <Check className="size-4" aria-hidden />
                            Setujui
                          </button>
                        )}
                        {k.status === "MENUNGGU" && (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => setKonfirmasi({ jenis: "tolak", krsId: k.id, mahasiswa: b.nama, matkul: k.course.nama })}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-medium text-bad transition active:scale-[0.97] hover:border-bad/40 hover:bg-bad-soft disabled:opacity-50"
                          >
                            <X className="size-4" aria-hidden />
                            Tolak
                          </button>
                        )}
                        {k.status === "DISETUJUI" &&
                          (k.sudahDinilai ? (
                            <p className="text-xs text-muted">Sudah bernilai, status terkunci</p>
                          ) : (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => setKonfirmasi({ jenis: "kembalikan", krsId: k.id, mahasiswa: b.nama, matkul: k.course.nama })}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-medium transition active:scale-[0.97] hover:bg-paper disabled:opacity-50"
                            >
                              <RotateCcw className="size-4" aria-hidden />
                              Kembalikan ke Menunggu
                            </button>
                          ))}
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
              {b.krs.length === 0 && <li className="p-4 text-sm text-muted sm:px-5">Belum mengisi KRS semester ini.</li>}
            </ul>
          </section>
        );
      })}

      <ConfirmDialog
        open={!!konfirmasi}
        title={copy?.title ?? ""}
        description={copy?.description}
        confirmLabel={copy?.confirmLabel ?? ""}
        tone={copy?.tone}
        cancelLabel="Kembali"
        loading={isPending && !!konfirmasi}
        onConfirm={() => copy?.run()}
        onCancel={() => setKonfirmasi(null)}
      />
    </div>
  );
}
