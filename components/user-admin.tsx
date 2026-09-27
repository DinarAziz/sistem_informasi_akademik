"use client";

import { useState, useTransition } from "react";
import { Check, Copy, KeyRound, Loader2, UserPlus } from "lucide-react";
import { buatPengguna, resetKataSandi } from "@/app/actions/admin";
import { LABEL_ROLE, type RoleName } from "@/lib/roles";
import { ConfirmDialog } from "./confirm-dialog";
import { Field, inputCls, Modal } from "./modal";
import { useToast } from "./toast";

type User = { id: number; username: string; nama: string; role: RoleName; pembimbing: string | null };
type Lecturer = { id: number; nama: string };

export function UserAdmin({ users, lecturers }: { users: User[]; lecturers: Lecturer[] }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [tambah, setTambah] = useState(false);
  const [peran, setPeran] = useState<"MAHASISWA" | "DOSEN">("MAHASISWA");
  const [reset, setReset] = useState<User | null>(null);
  const [sandi, setSandi] = useState<{ nama: string; sandi: string } | null>(null);
  const [tersalin, setTersalin] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    start(async () => {
      try {
        const r = await buatPengguna({
          peran,
          username: String(f.get("username")),
          nama: String(f.get("nama")),
          password: String(f.get("password")),
          dosenPembimbingId: peran === "MAHASISWA" ? Number(f.get("pembimbing")) || null : null,
        });
        toast.show(r.ok ? "success" : "error", r.message);
        if (r.ok) setTambah(false);
      } catch {
        toast.show("error", "Koneksi terputus. Periksa jaringan kamu lalu coba lagi.");
      }
    });
  };

  const doReset = () =>
    reset &&
    start(async () => {
      try {
        const r = await resetKataSandi(reset.id);
        if (r.ok && r.sandiBaru) {
          setSandi({ nama: reset.nama, sandi: r.sandiBaru });
          setTersalin(false);
        } else toast.show("error", r.message);
      } catch {
        toast.show("error", "Koneksi terputus. Periksa jaringan kamu lalu coba lagi.");
      } finally {
        setReset(null);
      }
    });

  return (
    <div className="space-y-5">
      <button type="button" onClick={() => setTambah(true)} className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition active:scale-[0.97] hover:bg-navy-deep">
        <UserPlus className="size-4" aria-hidden />
        Tambah akun
      </button>

      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full min-w-[38rem] text-left text-sm">
          <thead className="border-b border-line text-muted">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-medium">Nama</th>
              <th scope="col" className="px-2 py-2.5 font-medium">NIM, NIP, atau username</th>
              <th scope="col" className="px-2 py-2.5 font-medium">Peran</th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium"><span className="sr-only">Aksi</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">
                  <p className="font-semibold leading-snug">{u.nama}</p>
                  {u.pembimbing && <p className="text-xs text-muted">Dosen Pembimbing: {u.pembimbing}</p>}
                </td>
                <td className="num px-2 py-3">{u.username}</td>
                <td className="px-2 py-3">{LABEL_ROLE[u.role]}</td>
                <td className="px-4 py-3 text-right">
                  <button type="button" onClick={() => setReset(u)} aria-label={`Ganti kata sandi ${u.nama}`} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 font-medium hover:bg-paper">
                    <KeyRound className="size-3.5" aria-hidden /> Ganti kata sandi
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={tambah} onClose={() => !pending && setTambah(false)} title="Tambah akun" description="Sampaikan kata sandi awal langsung ke pemilik akun.">
        <form onSubmit={onSubmit} className="space-y-4">
          <fieldset>
            <legend className="text-sm font-medium">Peran</legend>
            <div className="mt-1.5 inline-flex rounded-lg border border-line p-1 text-sm">
              {(["MAHASISWA", "DOSEN"] as const).map((p) => (
                <button key={p} type="button" aria-pressed={peran === p} onClick={() => setPeran(p)} className={`rounded-md px-3.5 py-1.5 font-medium ${peran === p ? "bg-navy text-white" : "text-muted hover:text-ink"}`}>
                  {LABEL_ROLE[p]}
                </button>
              ))}
            </div>
          </fieldset>
          <Field label={peran === "DOSEN" ? "NIP" : "NIM"} htmlFor="username"><input id="username" name="username" required maxLength={20} autoComplete="off" className={`${inputCls} num`} /></Field>
          <Field label="Nama lengkap" htmlFor="nama"><input id="nama" name="nama" required maxLength={100} autoComplete="off" className={inputCls} /></Field>
          {peran === "MAHASISWA" && (
            <Field label="Dosen Pembimbing" htmlFor="pembimbing">
              <select id="pembimbing" name="pembimbing" defaultValue="" className={inputCls}>
                <option value="">Belum ditentukan</option>
                {lecturers.map((l) => <option key={l.id} value={l.id}>{l.nama}</option>)}
              </select>
            </Field>
          )}
          <Field label="Kata sandi awal" htmlFor="password" hint="Minimal 8 karakter."><input id="password" name="password" type="text" required minLength={8} maxLength={72} autoComplete="off" className={inputCls} /></Field>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setTambah(false)} disabled={pending} className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium hover:bg-paper disabled:opacity-50">Batal</button>
            <button type="submit" disabled={pending} className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white active:scale-[0.97] hover:bg-navy-deep disabled:opacity-70">
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {pending ? "Membuat akun…" : "Buat akun"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!reset}
        tone="neutral"
        icon={<KeyRound className="size-5" aria-hidden />}
        title={`Ganti kata sandi ${reset?.nama}?`}
        description="Kata sandi lama tidak berlaku lagi. Kata sandi baru tampil satu kali setelah ini."
        confirmLabel="Ya, ganti"
        loading={pending}
        onConfirm={doReset}
        onCancel={() => setReset(null)}
      />

      <Modal open={!!sandi} onClose={() => setSandi(null)} title="Kata sandi baru" description={`Untuk ${sandi?.nama}. Catat sekarang, kata sandi ini tidak akan tampil lagi.`}>
        <div className="flex items-center justify-between gap-3 rounded-lg bg-navy-soft px-4 py-3">
          <code className="num select-all text-lg font-semibold tracking-wide">{sandi?.sandi}</code>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(sandi!.sandi);
                setTersalin(true);
              } catch {
                toast.show("error", "Tidak bisa menyalin otomatis. Blok dan salin secara manual.");
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium hover:bg-paper"
          >
            {tersalin ? <Check className="size-4 text-ok" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {tersalin ? "Tersalin" : "Salin"}
          </button>
        </div>
        <div className="mt-5 flex justify-end">
          <button type="button" onClick={() => setSandi(null)} className="rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-deep">Selesai</button>
        </div>
      </Modal>
    </div>
  );
}
