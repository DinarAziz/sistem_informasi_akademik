import type { Metadata } from "next";
import { getCurrentStudent, getKrs } from "@/lib/data";
import { LABEL_HARI, sekarangWib, URUTAN_HARI } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";

export const metadata: Metadata = { title: "Jadwal Kuliah" };

export default async function JadwalPage() {
  const student = await getCurrentStudent();
  const krs = (await getKrs(student.id)).filter((k) => k.status !== "DITOLAK");
  const { hari: hariIni } = sekarangWib();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Jadwal Kuliah</h1>
        <p className="mt-1.5 max-w-prose text-muted">Mata Kuliah dengan status Disetujui atau Menunggu. Yang masih menunggu bisa berubah.</p>
      </header>

      <div className="space-y-6">
        {URUTAN_HARI.map((hari) => {
          const items = krs.filter((k) => k.course.hari === hari);
          const sekarang = hari === hariIni;
          return (
            <section key={hari} aria-labelledby={`hari-${hari}`} className="grid gap-3 md:grid-cols-[8rem_1fr] md:gap-8">
              <h2 id={`hari-${hari}`} className="flex items-center gap-2 font-display text-xl font-semibold md:block md:pt-4">
                {LABEL_HARI[hari]}
                {sekarang && <span className="border-b-2 border-gold text-sm font-medium text-muted md:mt-1 md:block md:w-fit">Hari ini</span>}
              </h2>
              {items.length === 0 ? (
                <p className="rounded-lg border border-dashed border-line p-4 text-sm text-muted">Tidak ada kuliah.</p>
              ) : (
                <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
                  {items.map(({ id, status, course: c }) => (
                    <li key={id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-6">
                      <p className="num w-28 shrink-0 font-display font-semibold">
                        {c.jamMulai}–{c.jamSelesai}
                      </p>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold leading-snug">{c.nama}</h3>
                        <p className="mt-0.5 text-sm text-muted">
                          {c.kode}, {c.sks} SKS. {c.ruang}. {c.dosen}
                        </p>
                      </div>
                      <StatusBadge status={status} />
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
