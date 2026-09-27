import type { Metadata } from "next";
import { getCurrentLecturer, getKelasDosen } from "@/lib/data";
import { requireRole } from "@/lib/auth";
import { SEMESTER_AKTIF } from "@/lib/config";
import { LABEL_HARI, sekarangWib, URUTAN_HARI } from "@/lib/format";

export const metadata: Metadata = { title: "Jadwal Mengajar" };

export default async function JadwalMengajarPage() {
  await requireRole("DOSEN");
  const dosen = await getCurrentLecturer();
  const kelas = await getKelasDosen(dosen.id);
  const { hari: hariIni } = sekarangWib();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Jadwal Mengajar</h1>
        <p className="mt-1.5 max-w-prose text-muted">
          Mata Kuliah yang kamu ampu di semester {SEMESTER_AKTIF}. Jumlah mahasiswa dihitung dari KRS Disetujui.
        </p>
      </header>

      <div className="space-y-6">
        {URUTAN_HARI.map((hari) => {
          const items = kelas.filter((k) => k.course.hari === hari);
          const sekarang = hari === hariIni;
          return (
            <section key={hari} aria-labelledby={`hari-${hari}`} className="grid gap-3 md:grid-cols-[8rem_1fr] md:gap-8">
              <h2 id={`hari-${hari}`} className="flex items-center gap-2 font-display text-xl font-semibold md:block md:pt-4">
                {LABEL_HARI[hari]}
                {sekarang && <span className="border-b-2 border-gold text-sm font-medium text-muted md:mt-1 md:block md:w-fit">Hari ini</span>}
              </h2>
              {items.length === 0 ? (
                <p className="rounded-lg border border-dashed border-line p-4 text-sm text-muted">Tidak ada jadwal mengajar.</p>
              ) : (
                <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
                  {items.map(({ course: c, peserta }) => (
                    <li key={c.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-6">
                      <p className="num w-28 shrink-0 font-display font-semibold">
                        {c.jamMulai}–{c.jamSelesai}
                      </p>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold leading-snug">{c.nama}</h3>
                        <p className="mt-0.5 text-sm text-muted">
                          {c.kode}, {c.sks} SKS. {c.ruang}
                        </p>
                      </div>
                      <p className="num text-sm font-medium">{peserta.length} mahasiswa</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
