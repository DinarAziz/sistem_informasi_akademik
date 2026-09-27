import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getBimbingan, getCurrentLecturer, getKelasDosen } from "@/lib/data";
import { formatTanggalPanjang, LABEL_HARI, sapaan, sekarangWib } from "@/lib/format";
import { SEMESTER_AKTIF } from "@/lib/config";
import { requireRole } from "@/lib/auth";
import { TodaySchedule } from "@/components/today-schedule";

export default async function DosenDashboard() {
  await requireRole("DOSEN");
  const dosen = await getCurrentLecturer();
  const [bimbingan, kelas] = await Promise.all([getBimbingan(dosen.id), getKelasDosen(dosen.id)]);
  const { hari, jam } = sekarangWib();

  const menunggu = bimbingan.reduce((n, b) => n + b.krs.filter((k) => k.status === "MENUNGGU").length, 0);
  const mahasiswaMenunggu = bimbingan.filter((b) => b.krs.some((k) => k.status === "MENUNGGU"));
  const belumDinilai = kelas.reduce((n, c) => n + c.peserta.filter((p) => p.angka === null).length, 0);
  const hariIni = hari ? kelas.filter((c) => c.course.hari === hari) : [];

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {sapaan(jam)}, {dosen.nama.split(",")[0]}
        </h1>
        <p className="mt-1.5 text-muted">
          Dosen Pembimbing untuk {bimbingan.length} mahasiswa, semester {SEMESTER_AKTIF}. {formatTanggalPanjang(new Date())}.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <section aria-labelledby="mengajar-hari-ini" className="self-start rounded-lg border border-line bg-white p-4 sm:p-6">
          <h2 id="mengajar-hari-ini" className="mb-3 font-display text-xl font-semibold">
            Jadwal Mengajar Hari Ini
          </h2>
          <TodaySchedule
            hariLabel={hari ? LABEL_HARI[hari] : null}
            jadwalHref="/dosen/jadwal"
            jadwalLabel="Jadwal Mengajar"
            catatan="Hanya Mata Kuliah yang kamu ampu yang tampil di sini."
            kosong="Tidak ada jadwal mengajar hari ini"
            items={hariIni.map(({ course: c, peserta }) => ({
              id: c.id, kode: c.kode, nama: c.nama, sks: c.sks, jamMulai: c.jamMulai, jamSelesai: c.jamSelesai, ruang: c.ruang,
              dosen: `${peserta.length} mahasiswa`,
            }))}
          />
        </section>

        <aside aria-label="Perlu tindakan" className="divide-y divide-line self-start rounded-lg border border-line bg-white">
          <div className="p-5">
            <p className="text-sm font-medium text-muted">KRS menunggu persetujuan</p>
            <p className="num mt-1 font-display text-5xl font-bold leading-none">{menunggu}</p>
            {mahasiswaMenunggu.length > 0 && (
              <p className="mt-2 text-sm text-muted">Dari {mahasiswaMenunggu.map((b) => b.nama.split(" ")[0]).join(", ")}</p>
            )}
            <Link href="/dosen/persetujuan" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-navy hover:underline">
              Buka Persetujuan KRS <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="p-5">
            <p className="text-sm font-medium text-muted">Mahasiswa belum bernilai</p>
            <p className="num mt-1 font-display text-5xl font-bold leading-none">{belumDinilai}</p>
            <p className="mt-2 text-sm text-muted">Di {kelas.length} Mata Kuliah yang kamu ampu</p>
            <Link href="/dosen/nilai" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-navy hover:underline">
              Buka Input Nilai <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
