import Link from "next/link";
import { getAdminStats } from "@/lib/data";
import { requireRole } from "@/lib/auth";
import { SEMESTER_AKTIF } from "@/lib/config";
import { formatTanggalPanjang } from "@/lib/format";

export default async function AdminDashboard() {
  const user = await requireRole("ADMIN");
  const s = await getAdminStats();

  const baris = [
    { label: "Mahasiswa terdaftar", nilai: s.mahasiswa, href: "/admin/pengguna", aksi: "Kelola akun" },
    { label: "Dosen", nilai: s.dosen, href: "/admin/pengguna", aksi: "Kelola akun" },
    { label: `Mata Kuliah ${SEMESTER_AKTIF}`, nilai: s.mataKuliah, href: "/admin/mata-kuliah", aksi: "Kelola Mata Kuliah" },
    { label: "KRS menunggu persetujuan Dosen Pembimbing", nilai: s.krsMenunggu, href: null, aksi: null },
    { label: "Pengumuman terbit", nilai: s.pengumuman, href: "/admin/pengumuman", aksi: "Kelola pengumuman" },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Halo, {user.nama.split(" ")[0]}</h1>
        <p className="mt-1.5 text-muted">Ringkasan data akademik. {formatTanggalPanjang(new Date())}.</p>
      </header>

      <dl className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
        {baris.map((b) => (
          <div key={b.label} className="flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <dt className="text-sm text-muted">{b.label}</dt>
              {b.href && (
                <dd className="mt-0.5">
                  <Link href={b.href} className="text-sm font-semibold text-navy hover:underline">{b.aksi}</Link>
                </dd>
              )}
            </div>
            <p className="num font-display text-3xl font-bold leading-none">{b.nilai}</p>
          </div>
        ))}
      </dl>
    </div>
  );
}
