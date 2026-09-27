import type { Metadata } from "next";
import { getAnnouncements } from "@/lib/data";
import { formatTanggal } from "@/lib/format";

export const metadata: Metadata = { title: "Pengumuman" };

export default async function PengumumanPage() {
  const list = await getAnnouncements();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Pengumuman</h1>
        <p className="mt-1.5 text-muted">Informasi resmi dari kampus, terbaru di atas.</p>
      </header>

      <ol className="divide-y divide-line border-y border-line">
        {list.map((p) => (
          <li key={p.id} className="grid gap-1.5 py-6 md:grid-cols-[10rem_1fr] md:gap-8">
            <time dateTime={p.tanggal.toISOString()} className="text-sm text-muted">
              {formatTanggal(p.tanggal)}
            </time>
            <article>
              <h2 className="font-display text-lg font-semibold leading-snug">{p.judul}</h2>
              <p className="mt-2 max-w-[68ch] leading-relaxed text-ink">{p.isi}</p>
            </article>
          </li>
        ))}
      </ol>
      {list.length === 0 && <p className="text-sm text-muted">Belum ada pengumuman.</p>}
    </div>
  );
}
