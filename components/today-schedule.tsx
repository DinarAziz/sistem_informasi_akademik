"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarOff, DoorOpen, UserRound } from "lucide-react";
import { menitDariJam, menitSekarangWib } from "@/lib/format";

export type ScheduleItem = {
  id: number;
  kode: string;
  nama: string;
  sks: number;
  jamMulai: string;
  jamSelesai: string;
  ruang: string;
  dosen: string;
};

type Phase = "selesai" | "berlangsung" | "berikutnya" | "nanti";

type Props = {
  items: ScheduleItem[];
  hariLabel: string | null;
  jadwalHref?: string;
  jadwalLabel?: string;
  catatan?: string;
  kosong?: string;
};

export function TodaySchedule({
  items,
  hariLabel,
  jadwalHref = "/jadwal",
  jadwalLabel = "Jadwal Kuliah",
  catatan = "Hanya Mata Kuliah dengan KRS berstatus Disetujui yang tampil di sini.",
  kosong = "Tidak ada kuliah hari ini",
}: Props) {
  // null sampai client mount: server dan client merender hasil yang sama, tanpa hydration mismatch
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(menitSekarangWib());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 py-6">
        <span className="grid size-11 place-items-center rounded-full bg-navy-soft text-navy">
          <CalendarOff className="size-5" aria-hidden />
        </span>
        <div>
          <p className="font-display text-lg font-semibold">
            {hariLabel ? kosong : "Hari ini libur kuliah"}
          </p>
          <p className="mt-1 max-w-md text-sm text-muted">
            {catatan} Lihat seluruh minggu di{" "}
            <Link href={jadwalHref} className="font-medium text-navy underline underline-offset-2">
              {jadwalLabel}
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  const firstUpcoming = now === null ? -1 : items.findIndex((i) => menitDariJam(i.jamMulai) > now);

  const phaseOf = (item: ScheduleItem, index: number): Phase | null => {
    if (now === null) return null;
    const start = menitDariJam(item.jamMulai);
    const end = menitDariJam(item.jamSelesai);
    if (now >= end) return "selesai";
    if (now >= start) return "berlangsung";
    return index === firstUpcoming ? "berikutnya" : "nanti";
  };

  return (
    <ol className="relative">
      {items.map((item, i) => {
        const phase = phaseOf(item, i);
        const start = menitDariJam(item.jamMulai);
        const end = menitDariJam(item.jamSelesai);
        const progress = phase === "berlangsung" && now !== null ? (now - start) / (end - start) : 0;
        const live = phase === "berlangsung";
        const done = phase === "selesai";

        return (
          <motion.li
            key={item.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.09, type: "spring", stiffness: 260, damping: 26 }}
            className="grid grid-cols-[3.75rem_1fr] gap-x-4 sm:grid-cols-[4.5rem_1fr] sm:gap-x-5"
          >
            <div className="num pt-4 text-right">
              <p className={`font-display text-lg font-semibold leading-none ${done ? "text-muted" : "text-ink"}`}>{item.jamMulai}</p>
              <p className="mt-1 text-xs text-muted">{item.jamSelesai}</p>
            </div>

            <div className="relative border-l-2 border-line pb-3 pl-5 last:pb-0 sm:pl-6">
              <span
                aria-hidden
                className={`absolute -left-[7px] top-[1.15rem] size-3 rounded-full border-2 border-paper ${
                  live ? "bg-gold ring-4 ring-gold/30" : done ? "bg-line" : "bg-navy"
                }`}
              />
              <div className={`rounded-lg p-4 transition-colors ${live ? "bg-gold-soft" : "bg-transparent"} ${done ? "opacity-80" : ""}`}>
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                  <h3 className="font-display text-base font-semibold leading-snug sm:text-lg">{item.nama}</h3>
                  {phase && phase !== "nanti" && (
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                        live ? "bg-gold text-navy-deep" : phase === "berikutnya" ? "bg-navy-soft text-navy" : "bg-line/60 text-ink"
                      }`}
                    >
                      {phase === "selesai" ? "Selesai" : phase === "berlangsung" ? "Berlangsung" : "Berikutnya"}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">
                  {item.kode}, {item.sks} SKS
                </p>
                <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                  <span className="inline-flex items-center gap-1.5">
                    <DoorOpen className="size-4 text-muted" aria-hidden />
                    {item.ruang}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <UserRound className="size-4 text-muted" aria-hidden />
                    {item.dosen}
                  </span>
                </div>
                {live && (
                  <div className="mt-3" aria-hidden>
                    <div className="h-1.5 overflow-hidden rounded-full bg-gold/30">
                      <motion.div
                        className="h-full rounded-full bg-gold"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
