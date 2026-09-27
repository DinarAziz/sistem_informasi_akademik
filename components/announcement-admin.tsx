"use client";

import { useState, useTransition } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { hapusPengumuman, simpanPengumuman } from "@/app/actions/admin";
import { ConfirmDialog } from "./confirm-dialog";
import { Field, inputCls, Modal } from "./modal";
import { useToast } from "./toast";

type Item = { id: number; judul: string; isi: string; tanggal: string };

export function AnnouncementAdmin({ items }: { items: Item[] }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [form, setForm] = useState<{ item: Item | null } | null>(null);
  const [hapus, setHapus] = useState<Item | null>(null);

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
    jalankan(() => simpanPengumuman({ id: form?.item?.id, judul: String(f.get("judul")), isi: String(f.get("isi")) }), () => setForm(null));
  };

  const it = form?.item;

  return (
    <div className="space-y-5">
      <button type="button" onClick={() => setForm({ item: null })} className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition active:scale-[0.97] hover:bg-navy-deep">
        <Plus className="size-4" aria-hidden />
        Tulis pengumuman
      </button>

      <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
        {items.map((p) => (
          <li key={p.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-5 sm:px-5">
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold leading-snug">{p.judul}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{p.isi}</p>
              <p className="mt-1.5 text-xs text-muted">{p.tanggal}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setForm({ item: p })} aria-label={`Ubah ${p.judul}`} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:bg-paper">
                <Pencil className="size-3.5" aria-hidden /> Ubah
              </button>
              <button type="button" onClick={() => setHapus(p)} aria-label={`Hapus ${p.judul}`} className="grid size-9 place-items-center rounded-lg border border-line text-bad hover:border-bad/40 hover:bg-bad-soft">
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>
          </li>
        ))}
        {items.length === 0 && <li className="p-6 text-sm text-muted">Belum ada pengumuman. Tulis yang pertama.</li>}
      </ul>

      <Modal open={!!form} onClose={() => !pending && setForm(null)} title={it ? "Ubah pengumuman" : "Tulis pengumuman"} description="Pengumuman langsung tampil untuk mahasiswa dan dosen.">
        <form key={it?.id ?? "baru"} onSubmit={onSubmit} className="space-y-4">
          <Field label="Judul" htmlFor="judul"><input id="judul" name="judul" required maxLength={160} defaultValue={it?.judul} className={inputCls} /></Field>
          <Field label="Isi" htmlFor="isi"><textarea id="isi" name="isi" required rows={6} maxLength={5000} defaultValue={it?.isi} className={inputCls} /></Field>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setForm(null)} disabled={pending} className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium hover:bg-paper disabled:opacity-50">Batal</button>
            <button type="submit" disabled={pending} className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white active:scale-[0.97] hover:bg-navy-deep disabled:opacity-70">
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {pending ? "Menyimpan…" : it ? "Simpan" : "Terbitkan"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!hapus}
        title="Hapus pengumuman ini?"
        description={<>“{hapus?.judul}” tidak lagi tampil untuk siapa pun. Tindakan ini tidak bisa dibatalkan.</>}
        confirmLabel="Ya, hapus"
        loading={pending}
        onConfirm={() => hapus && jalankan(() => hapusPengumuman(hapus.id), () => {}, () => setHapus(null))}
        onCancel={() => setHapus(null)}
      />
    </div>
  );
}
