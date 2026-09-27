"use client";

import { useState, useTransition } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import type { Hari } from "@prisma/client";
import { hapusMataKuliah, simpanMataKuliah } from "@/app/actions/admin";
import { LABEL_HARI, URUTAN_HARI } from "@/lib/format";
import { ConfirmDialog } from "./confirm-dialog";
import { Field, inputCls, Modal } from "./modal";
import { useToast } from "./toast";

type Course = {
  id: number; kode: string; nama: string; sks: number; hari: Hari; jamMulai: string; jamSelesai: string;
  ruang: string; dosen: string; lecturerId: number; jumlahKrs: number;
};
type Lecturer = { id: number; nip: string; nama: string };

export function CourseAdmin({ courses, lecturers }: { courses: Course[]; lecturers: Lecturer[] }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [form, setForm] = useState<{ course: Course | null } | null>(null);
  const [hapus, setHapus] = useState<Course | null>(null);

  const jalankan = (task: () => Promise<{ ok: boolean; message: string }>, onOk: () => void, onDone?: () => void) =>
    start(async () => {
      try {
        const r = await task();
        toast.show(r.ok ? "success" : "error", r.message);
        if (r.ok) onOk();
      } catch {
        toast.show("error", "Koneksi terputus. Periksa jaringan kamu lalu coba lagi.");
      } finally {
        onDone?.();
      }
    });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    jalankan(
      () =>
        simpanMataKuliah({
          id: form?.course?.id,
          kode: String(f.get("kode")),
          nama: String(f.get("nama")),
          sks: Number(f.get("sks")),
          hari: f.get("hari") as Hari,
          jamMulai: String(f.get("jamMulai")),
          jamSelesai: String(f.get("jamSelesai")),
          ruang: String(f.get("ruang")),
          lecturerId: Number(f.get("lecturerId")),
        }),
      () => setForm(null),
    );
  };

  const c = form?.course;

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => setForm({ course: null })}
        className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition active:scale-[0.97] hover:bg-navy-deep"
      >
        <Plus className="size-4" aria-hidden />
        Tambah Mata Kuliah
      </button>

      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <thead className="border-b border-line text-muted">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-medium">Mata Kuliah</th>
              <th scope="col" className="px-2 py-2.5 font-medium">Jadwal</th>
              <th scope="col" className="px-2 py-2.5 font-medium">Dosen pengampu</th>
              <th scope="col" className="px-2 py-2.5 text-right font-medium">KRS</th>
              <th scope="col" className="w-40 px-4 py-2.5 text-right font-medium"><span className="sr-only">Aksi</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {courses.map((k) => (
              <tr key={k.id}>
                <td className="px-4 py-3">
                  <p className="font-semibold leading-snug">{k.nama}</p>
                  <p className="text-xs text-muted">{k.kode}, {k.sks} SKS</p>
                </td>
                <td className="num px-2 py-3">
                  {LABEL_HARI[k.hari]}, {k.jamMulai}–{k.jamSelesai}
                  <p className="text-xs text-muted">{k.ruang}</p>
                </td>
                <td className="px-2 py-3">{k.dosen}</td>
                <td className="num px-2 py-3 text-right">{k.jumlahKrs}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setForm({ course: k })} aria-label={`Ubah ${k.nama}`} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 font-medium hover:bg-paper">
                      <Pencil className="size-3.5" aria-hidden /> Ubah
                    </button>
                    <button
                      type="button"
                      onClick={() => setHapus(k)}
                      disabled={k.jumlahKrs > 0}
                      title={k.jumlahKrs > 0 ? `Dipakai ${k.jumlahKrs} KRS` : undefined}
                      aria-label={`Hapus ${k.nama}`}
                      className="grid size-8 place-items-center rounded-lg border border-line text-bad hover:border-bad/40 hover:bg-bad-soft disabled:cursor-not-allowed disabled:text-muted disabled:opacity-60 disabled:hover:border-line disabled:hover:bg-transparent"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">Mata Kuliah yang sudah dipakai di KRS tidak bisa dihapus.</p>

      <Modal open={!!form} onClose={() => !pending && setForm(null)} title={c ? "Ubah Mata Kuliah" : "Tambah Mata Kuliah"} description="Jadwal dicek agar Dosen dan ruang tidak bentrok.">
        <form key={c?.id ?? "baru"} onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_6rem]">
            <Field label="Kode" htmlFor="kode"><input id="kode" name="kode" required maxLength={12} defaultValue={c?.kode} className={`${inputCls} num uppercase`} /></Field>
            <Field label="SKS" htmlFor="sks"><input id="sks" name="sks" type="number" min={1} max={6} required defaultValue={c?.sks ?? 3} className={`${inputCls} num`} /></Field>
          </div>
          <Field label="Nama Mata Kuliah" htmlFor="nama"><input id="nama" name="nama" required maxLength={120} defaultValue={c?.nama} className={inputCls} /></Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Hari" htmlFor="hari">
              <select id="hari" name="hari" required defaultValue={c?.hari ?? "SENIN"} className={inputCls}>
                {URUTAN_HARI.map((h) => <option key={h} value={h}>{LABEL_HARI[h]}</option>)}
              </select>
            </Field>
            <Field label="Jam mulai" htmlFor="jamMulai"><input id="jamMulai" name="jamMulai" type="time" required defaultValue={c?.jamMulai ?? "08:00"} className={`${inputCls} num`} /></Field>
            <Field label="Jam selesai" htmlFor="jamSelesai"><input id="jamSelesai" name="jamSelesai" type="time" required defaultValue={c?.jamSelesai ?? "10:30"} className={`${inputCls} num`} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ruang" htmlFor="ruang"><input id="ruang" name="ruang" required maxLength={30} defaultValue={c?.ruang} className={inputCls} /></Field>
            <Field label="Dosen pengampu" htmlFor="lecturerId">
              <select id="lecturerId" name="lecturerId" required defaultValue={c?.lecturerId ?? ""} className={inputCls}>
                <option value="" disabled>Pilih Dosen</option>
                {lecturers.map((l) => <option key={l.id} value={l.id}>{l.nama}</option>)}
              </select>
            </Field>
          </div>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setForm(null)} disabled={pending} className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium hover:bg-paper disabled:opacity-50">Batal</button>
            <button type="submit" disabled={pending} className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white active:scale-[0.97] hover:bg-navy-deep disabled:opacity-70">
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {pending ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!hapus}
        title={`Hapus ${hapus?.nama}?`}
        description={`${hapus?.kode} dihapus dari daftar Mata Kuliah. Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Ya, hapus"
        loading={pending}
        onConfirm={() => hapus && jalankan(() => hapusMataKuliah(hapus.id), () => {}, () => setHapus(null))}
        onCancel={() => setHapus(null)}
      />
    </div>
  );
}
