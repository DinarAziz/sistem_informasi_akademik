import type { Metadata } from "next";
import { getBimbingan, getCurrentLecturer } from "@/lib/data";
import { requireRole } from "@/lib/auth";
import { SEMESTER_AKTIF } from "@/lib/config";
import { KrsApproval } from "@/components/krs-approval";

export const metadata: Metadata = { title: "Persetujuan KRS" };

export default async function PersetujuanPage() {
  await requireRole("DOSEN");
  const dosen = await getCurrentLecturer();
  const bimbingan = await getBimbingan(dosen.id);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Persetujuan KRS</h1>
        <p className="mt-1.5 max-w-prose text-muted">KRS semester {SEMESTER_AKTIF} dari mahasiswa bimbingan kamu.</p>
      </header>
      <KrsApproval bimbingan={bimbingan} />
    </div>
  );
}
