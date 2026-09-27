"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DoorOpen, Loader2, Lock, Plus, Search, Trash2, UserRound } from "lucide-react";
import type { StatusKrs } from "@prisma/client";
import { batalkanMataKuliah, tambahMataKuliah } from "@/app/actions/krs";
import { ConfirmDialog } from "./confirm-dialog";
import { Meter } from "./meter";
import { StatusBadge } from "./status-badge";
import { useToast } from "./toast";
import { LABEL_HARI } from "@/lib/format";
import { MAKS_SKS_SEMESTER } from "@/lib/config";

type Course = {
  id: number;
  kode: string;
  nama: string;
  sks: number;
  hari: keyof typeof LABEL_HARI;
  jamMulai: string;
  jamSelesai: string;
  ruang: string;
  dosen: string;
};
type KrsRow = { id: number; status: StatusKrs; course: Course };

const spring = { type: "spring", stiffness: 380, damping: 34 } as const;

function CourseMeta({ c }: { c: Course }) {
  return (
    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
      <span>
        {LABEL_HARI[c.hari]}, <span className="num">{c.jamMulai}–{c.jamSelesai}</span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <DoorOpen className="size-4" aria-hidden />
        {c.ruang}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <UserRound className="size-4" aria-hidden />
        {c.dosen}
      </span>
    </div>
  );
}

export function KrsManager({ krs, katalog, semester }: { krs: KrsRow[]; katalog: Course[]; semester: string }) {
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null); // "add-<id>" | "del-<id>"
  const [target, setTarget] = useState<KrsRow | null>(null);
  const [query, setQuery] = useState("");

  const sksAktif = krs.filter((k) => k.status !== "DITOLAK").reduce((n, k) => n + k.course.sks, 0);
  const penuh = sksAktif >= MAKS_SKS_SEMESTER;

  const hasilKatalog = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return katalog;
    return katalog.filter((c) => [c.nama, c.kode, c.dosen, LABEL_HARI[c.hari]].some((f) => f.toLowerCase().includes(q)));
  }, [katalog, query]);

  const jalankan = (key: string, task: () => Promise<{ ok: boolean; message: string }>, after?: () => void) => {
    setBusyId(key);
    startTransition(async () => {
      try {
        const res = await task();
        toast.show(res.ok ? "success" : "error", res.message);
      } catch {
        toast.show("error", "Koneksi terputus. Periksa jaringan kamu lalu coba lagi.");
      } finally {
        setBusyId(null);
        after?.();
      }
    });
  };

  const tambah = (c: Course) => jalankan(`add-${c.id}`, () => tambahMataKuliah(c.id));
  const batalkan = () => target && jalankan(`del-${target.id}`, () => batalkanMataKuliah(target.id), () => setTarget(null));

  return (
    <div className="space-y-10">
      {/* Ringkasan SKS */}
      <div className="rounded-lg border border-line bg-white p-5">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-sm font-medium text-muted">SKS diambil semester ini</p>
          <p className="num text-sm">
            <span className="font-display text-2xl font-bold">{sksAktif}</span> dari {MAKS_SKS_SEMESTER} SKS
          </p>
        </div>
        <div className="mt-3">
          <Meter value={sksAktif / MAKS_SKS_SEMESTER} label={`${sksAktif} dari ${MAKS_SKS_SEMESTER} SKS`} tone={penuh ? "bad" : "navy"} />
        </div>
        <p className="mt-2 text-xs text-muted">
          {penuh ? "Batas SKS tercapai. Batalkan Mata Kuliah untuk menambah yang lain." : `Sisa ${MAKS_SKS_SEMESTER - sksAktif} SKS. Mata Kuliah yang ditolak tidak dihitung.`}
        </p>
      </div>

      {/* KRS */}
      <section aria-labelledby="krs-saya">
        <h2 id="krs-saya" className="font-display text-xl font-semibold">
          KRS {semester}
        </h2>
        <ul className="mt-3 divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
          <AnimatePresence initial={false} mode="popLayout">
            {krs.map((k) => {
              const terkunci = k.status === "DISETUJUI";
              const sibuk = busyId === `del-${k.id}`;
              return (
                <motion.li
                  key={k.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={spring}
                  className="bg-white"
                >
                  <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-5 sm:px-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <h3 className="font-display text-base font-semibold sm:text-lg">{k.course.nama}</h3>
                        <StatusBadge status={k.status} />
                      </div>
                      <p className="mt-0.5 text-sm text-muted">
                        {k.course.kode}, {k.course.sks} SKS
                      </p>
                      <CourseMeta c={k.course} />
                    </div>
                    {terkunci ? (
                      <p className="inline-flex items-center gap-1.5 text-xs text-muted sm:w-56 sm:justify-end">
                        <Lock className="size-3.5" aria-hidden />
                        Hubungi Dosen Pembimbing untuk membatalkan
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setTarget(k)}
                        disabled={isPending}
                        aria-label={`Batalkan ${k.course.nama}`}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-line px-3.5 py-2 text-sm font-medium text-bad transition active:scale-[0.97] hover:border-bad/40 hover:bg-bad-soft disabled:opacity-50"
                      >
                        {sibuk ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Trash2 className="size-4" aria-hidden />}
                        Batalkan
                      </button>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
          {krs.length === 0 && (
            <li className="p-6 text-sm text-muted">KRS masih kosong. Pilih Mata Kuliah dari daftar di bawah untuk memulai.</li>
          )}
        </ul>
      </section>

      {/* Katalog */}
      <section aria-labelledby="katalog">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="katalog" className="font-display text-xl font-semibold">
              Mata Kuliah Tersedia
            </h2>
            <p className="mt-0.5 text-sm text-muted">Setelah ditambahkan, Mata Kuliah menunggu persetujuan Dosen Pembimbing.</p>
          </div>
          <label className="relative block sm:w-72">
            <span className="sr-only">Cari Mata Kuliah</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama, kode, atau hari"
              className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm placeholder:text-muted"
            />
          </label>
        </div>

        <ul className="mt-3 divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
          <AnimatePresence initial={false} mode="popLayout">
            {hasilKatalog.map((c) => {
              const sibuk = busyId === `add-${c.id}`;
              const melebihi = sksAktif + c.sks > MAKS_SKS_SEMESTER;
              return (
                <motion.li
                  key={c.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: 24 }}
                  transition={spring}
                  className="grid items-center gap-x-6 gap-y-2 bg-white p-4 sm:px-5 md:grid-cols-[minmax(0,1fr)_14rem_auto]"
                >
                  <div className="min-w-0">
                    <h3 className="font-display text-base font-semibold leading-snug">{c.nama}</h3>
                    <p className="mt-0.5 text-sm text-muted">
                      {c.kode}, {c.sks} SKS, {c.dosen}
                    </p>
                  </div>
                  <p className="text-sm text-muted">
                    <span className="num block font-medium text-ink">
                      {LABEL_HARI[c.hari]}, {c.jamMulai}–{c.jamSelesai}
                    </span>
                    {c.ruang}
                  </p>
                  <div className="flex items-center gap-3 md:justify-end">
                    {melebihi && <p className="text-xs text-muted">Melebihi batas {MAKS_SKS_SEMESTER} SKS</p>}
                    <button
                      type="button"
                      onClick={() => tambah(c)}
                      disabled={isPending || melebihi}
                      aria-label={`Tambah ${c.nama}`}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-3.5 py-2 text-sm font-semibold text-white transition active:scale-[0.97] hover:bg-navy-deep disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {sibuk ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Plus className="size-4" aria-hidden />}
                      {sibuk ? "Menambahkan…" : "Tambah"}
                    </button>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
        {hasilKatalog.length === 0 && (
          <p className="mt-3 rounded-lg border border-dashed border-line p-6 text-sm text-muted">
            {katalog.length === 0 ? "Semua Mata Kuliah yang ditawarkan sudah ada di KRS kamu." : `Tidak ada Mata Kuliah yang cocok dengan “${query}”. Coba nama, kode, atau hari lain.`}
          </p>
        )}
      </section>

      <ConfirmDialog
        open={!!target}
        title={target ? `Batalkan ${target.course.nama}?` : ""}
        description={
          target && (
            <>
              {target.course.kode} ({target.course.sks} SKS) dihapus dari KRS kamu.{" "}
              {target.status === "MENUNGGU" ? "Permintaan persetujuan ke Dosen Pembimbing juga dibatalkan." : "Kamu bisa menambahkannya lagi selama masa pengisian KRS."}
            </>
          )
        }
        confirmLabel="Ya, batalkan"
        cancelLabel="Tidak, simpan"
        loading={target ? busyId === `del-${target.id}` : false}
        onConfirm={batalkan}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}
