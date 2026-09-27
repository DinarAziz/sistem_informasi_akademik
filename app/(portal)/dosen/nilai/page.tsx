import type { Metadata } from "next";
import { getCurrentLecturer, getKelasDosen } from "@/lib/data";
import { requireRole } from "@/lib/auth";
import { SEMESTER_AKTIF } from "@/lib/config";
import { NilaiEntry } from "@/components/nilai-entry";

export const metadata: Metadata = { title: "Input Nilai" };

export default async function InputNilaiPage() {
  await requireRole("DOSEN");
  const dosen = await getCurrentLecturer();
  const kelas = await getKelasDosen(dosen.id);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Input Nilai</h1>
        <p className="mt-1.5 max-w-prose text-muted">
          Mata Kuliah yang kamu ampu di semester {SEMESTER_AKTIF}. Hanya mahasiswa dengan KRS Disetujui yang tampil.
        </p>
      </header>
      <NilaiEntry kelas={kelas} />
    </div>
  );
}
