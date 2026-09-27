import type { Metadata } from "next";
import { getAnnouncements } from "@/lib/data";
import { requireRole } from "@/lib/auth";
import { formatTanggal } from "@/lib/format";
import { AnnouncementAdmin } from "@/components/announcement-admin";

export const metadata: Metadata = { title: "Kelola Pengumuman" };

export default async function AdminPengumumanPage() {
  await requireRole("ADMIN");
  const list = await getAnnouncements();
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Pengumuman</h1>
        <p className="mt-1.5 max-w-prose text-muted">Tulis dan kelola pengumuman untuk mahasiswa dan dosen.</p>
      </header>
      <AnnouncementAdmin items={list.map((p) => ({ id: p.id, judul: p.judul, isi: p.isi, tanggal: formatTanggal(p.tanggal) }))} />
    </div>
  );
}
