import type { Metadata } from "next";
import { getCurrentStudent, getRiwayatNilai } from "@/lib/data";
import { bobotDariHuruf, hitungIp } from "@/lib/nilai";
import { SEMESTER_AKTIF, SKS_LULUS } from "@/lib/config";
import { formatIpk } from "@/lib/format";
import { Meter } from "@/components/meter";

export const metadata: Metadata = { title: "Nilai" };

const warnaHuruf = (h: string | null) => {
  if (!h) return "font-normal text-muted";
  const b = bobotDariHuruf(h);
  return b >= 3.5 ? "text-ok" : b >= 3 ? "text-navy" : b >= 2 ? "text-wait" : "text-bad";
};

export default async function NilaiPage() {
  const student = await getCurrentStudent();
  const riwayat = await getRiwayatNilai(student.id);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Nilai</h1>
        <p className="mt-1.5 max-w-prose text-muted">Hasil studi per semester. Nilai muncul setelah Dosen mengisinya.</p>
      </header>

      <div className="grid gap-6 rounded-lg border border-line bg-white p-5 sm:grid-cols-2 sm:gap-10">
        <div>
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-medium text-muted">IPK</p>
            <p className="num font-display text-5xl font-bold leading-none">{formatIpk(student.ipk)}</p>
          </div>
          <div className="mt-3">
            <Meter value={student.ipk / 4} label={`IPK ${formatIpk(student.ipk)} dari 4,00`} tone="gold" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-medium text-muted">SKS lulus</p>
            <p className="num font-display text-5xl font-bold leading-none">{student.totalSks}</p>
          </div>
          <div className="mt-3">
            <Meter value={student.totalSks / SKS_LULUS} label={`${student.totalSks} dari ${SKS_LULUS} SKS`} />
          </div>
          <p className="mt-1.5 text-xs text-muted">Dari {SKS_LULUS} SKS untuk lulus</p>
        </div>
      </div>

      {riwayat.length === 0 && <p className="rounded-lg border border-dashed border-line p-6 text-sm text-muted">Belum ada Mata Kuliah dengan KRS Disetujui.</p>}

      <div className="space-y-8">
        {riwayat.map(({ semester, rows }) => {
          const { ip, sksDinilai } = hitungIp(rows.map((r) => ({ sks: r.sks, huruf: r.huruf })));
          const berjalan = semester === SEMESTER_AKTIF;
          return (
            <section key={semester} aria-labelledby={`sem-${semester}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 id={`sem-${semester}`} className="font-display text-2xl font-semibold tracking-tight">
                  {semester}
                  {berjalan && <span className="ml-3 border-b-2 border-gold align-middle text-sm font-medium text-muted">Berjalan</span>}
                </h2>
                <p className="num text-sm text-muted">
                  {sksDinilai > 0 ? <>IPS <strong className="text-ink">{formatIpk(ip)}</strong>, {sksDinilai} SKS</> : "Belum ada nilai"}
                </p>
              </div>
              <div className="mt-3 overflow-x-auto rounded-lg border border-line bg-white">
                <table className="w-full min-w-[30rem] text-left text-sm">
                  <thead className="border-b border-line text-muted">
                    <tr>
                      <th scope="col" className="px-4 py-2.5 font-medium">Mata Kuliah</th>
                      <th scope="col" className="w-16 px-4 py-2.5 text-right font-medium">SKS</th>
                      <th scope="col" className="w-20 px-4 py-2.5 text-right font-medium">Angka</th>
                      <th scope="col" className="w-28 px-4 py-2.5 text-right font-medium">Huruf</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {rows.map((r) => (
                      <tr key={r.id}>
                        <td className="px-4 py-3">
                          <p className="font-semibold leading-snug">{r.nama}</p>
                          <p className="text-xs text-muted">{r.kode}</p>
                        </td>
                        <td className="num px-4 py-3 text-right">{r.sks}</td>
                        <td className="num px-4 py-3 text-right">{r.angka === null ? "–" : r.angka.toFixed(1).replace(".", ",")}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <span className={`font-display text-lg font-bold ${warnaHuruf(r.huruf)}`}>
                            {r.huruf ?? <span className="text-sm">Belum ada</span>}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
