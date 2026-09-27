import type { Metadata } from "next";
import { getCourseCatalog, getCurrentStudent, getKrs } from "@/lib/data";
import { SEMESTER_AKTIF } from "@/lib/config";
import { KrsManager } from "@/components/krs-manager";

export const metadata: Metadata = { title: "KRS" };

export default async function KrsPage() {
  const student = await getCurrentStudent();
  const [krs, katalog] = await Promise.all([getKrs(student.id), getCourseCatalog(student.id)]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Kartu Rencana Studi</h1>
        <p className="mt-1.5 max-w-prose text-muted">
          Atur Mata Kuliah semester {SEMESTER_AKTIF}. Dosen Pembimbing kamu: {student.dosenPembimbing.replace(/\.$/, "")}.
        </p>
      </header>
      <KrsManager krs={krs} katalog={katalog} semester={SEMESTER_AKTIF} />
    </div>
  );
}
