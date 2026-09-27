"use client";

import { DatabaseZap } from "lucide-react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-start gap-4 py-16">
      <span className="grid size-12 place-items-center rounded-full bg-bad-soft text-bad">
        <DatabaseZap className="size-6" aria-hidden />
      </span>
      <h1 className="font-display text-2xl font-bold">Data belum bisa dimuat</h1>
      <p className="text-muted">
        Server tidak bisa mengambil data dari database. Pastikan MySQL menyala (<code className="rounded bg-navy-soft px-1.5 py-0.5 text-sm">docker compose up -d</code>) dan
        data awal sudah diisi (<code className="rounded bg-navy-soft px-1.5 py-0.5 text-sm">npm run db:reset</code>).
      </p>
      {process.env.NODE_ENV !== "production" && <p className="text-xs text-muted">{error.message}</p>}
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-deep active:scale-[0.97]"
      >
        Coba lagi
      </button>
    </div>
  );
}
