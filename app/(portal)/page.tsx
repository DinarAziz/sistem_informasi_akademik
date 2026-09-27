import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getAnnouncements, getCurrentStudent, getKrs } from "@/lib/data";
import { formatIpk, formatTanggal, formatTanggalPanjang, LABEL_HARI, sapaan, sekarangWib } from "@/lib/format";
import { MAKS_SKS_SEMESTER, SEMESTER_AKTIF, SKS_LULUS } from "@/lib/config";
import { TodaySchedule } from "@/components/today-schedule";
import { Meter } from "@/components/meter";

export default async function DashboardPage() {
  const student = await getCurrentStudent();
  const [krs, pengumuman] = await Promise.all([getKrs(student.id), getAnnouncements(3)]);
  const { hari, jam } = sekarangWib();

  const hariIni = hari
    ? krs.filter((k) => k.status === "DISETUJUI" && k.course.hari === hari).map((k) => k.course)
    : [];

  const aktif = krs.filter((k) => k.status !== "DITOLAK");
  const sksSemester = aktif.reduce((n, k) => n + k.course.sks, 0);
  const hitung = (s: string) => krs.filter((k) => k.status === s).length;
  const namaDepan = student.nama.split(" ")[0];

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {sapaan(jam)}, {namaDepan}
        </h1>
        <p className="mt-1.5 text-muted">
          Semester {student.semester}, {student.prodi}. {formatTanggalPanjang(new Date())}.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <section aria-labelledby="jadwal-hari-ini" className="self-start rounded-lg border border-line bg-white p-4 sm:p-6">
          <div className="mb-3 flex items-baseline justify-between gap-4 px-1 sm:px-0">
            <h2 id="jadwal-hari-ini" className="font-display text-xl font-semibold">
              Jadwal Hari Ini
            </h2>
            <Link href="/jadwal" className="text-sm font-medium text-navy hover:underline">
              Lihat seminggu
            </Link>
          </div>
          <TodaySchedule
            hariLabel={hari ? LABEL_HARI[hari] : null}
            items={hariIni.map(({ id, kode, nama, sks, jamMulai, jamSelesai, ruang, dosen }) => ({
              id, kode, nama, sks, jamMulai, jamSelesai, ruang, dosen,
            }))}
          />
        </section>

        <aside aria-label="Ringkasan akademik" className="divide-y divide-line self-start rounded-lg border border-line bg-white">
          <div className="p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-medium text-muted">IPK</h2>
              <p className="num font-display text-3xl font-bold leading-none">{formatIpk(student.ipk)}</p>
            </div>
            <div className="mt-3">
              <Meter value={student.ipk / 4} label={`IPK ${formatIpk(student.ipk)} dari 4,00`} tone="gold" />
            </div>
            <p className="mt-1.5 text-xs text-muted">Skala 4,00</p>
          </div>

          <div className="p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-medium text-muted">SKS ditempuh</h2>
              <p className="num font-display text-3xl font-bold leading-none">{student.totalSks}</p>
            </div>
            <div className="mt-3">
              <Meter value={student.totalSks / SKS_LULUS} label={`${student.totalSks} dari ${SKS_LULUS} SKS`} />
            </div>
            <p className="mt-1.5 text-xs text-muted">Dari {SKS_LULUS} SKS untuk lulus</p>
          </div>

          <div className="p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-medium text-muted">KRS {SEMESTER_AKTIF}</h2>
              <p className="num text-sm font-semibold">
                {sksSemester} dari {MAKS_SKS_SEMESTER} SKS
              </p>
            </div>
            <p className="mt-2 text-sm">
              {hitung("DISETUJUI")} disetujui, {hitung("MENUNGGU")} menunggu, {hitung("DITOLAK")} ditolak
            </p>
            <Link href="/krs" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-navy hover:underline">
              Kelola KRS <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          <div className="p-5">
            <p className="text-sm font-medium text-muted">Dosen Pembimbing</p>
            <p className="mt-1 font-semibold leading-snug">{student.dosenPembimbing}</p>
          </div>
        </aside>
      </div>

      <section aria-labelledby="pengumuman">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="pengumuman" className="font-display text-xl font-semibold">
            Pengumuman
          </h2>
          <Link href="/pengumuman" className="text-sm font-medium text-navy hover:underline">
            Semua pengumuman
          </Link>
        </div>
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {pengumuman.map((p) => (
            <li key={p.id} className="grid gap-1 py-4 sm:grid-cols-[9rem_1fr] sm:gap-6">
              <time dateTime={p.tanggal.toISOString()} className="text-sm text-muted">
                {formatTanggal(p.tanggal)}
              </time>
              <div>
                <h3 className="font-semibold leading-snug">{p.judul}</h3>
                <p className="mt-1 line-clamp-2 max-w-[70ch] text-sm text-muted">{p.isi}</p>
              </div>
            </li>
          ))}
          {pengumuman.length === 0 && <li className="py-6 text-sm text-muted">Belum ada pengumuman.</li>}
        </ul>
      </section>
    </div>
  );
}
