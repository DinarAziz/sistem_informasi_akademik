"use client";

import { motion } from "framer-motion";

type Props = {
  value: number; // 0..1
  label: string;
  tone?: "navy" | "gold" | "bad";
  height?: string;
};

const TONE = { navy: "bg-navy", gold: "bg-gold", bad: "bg-bad" } as const;

export function Meter({ value, label, tone = "navy", height = "h-2" }: Props) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={`${height} w-full overflow-hidden rounded-full bg-navy-soft`}
    >
      <motion.div
        className={`h-full rounded-full ${TONE[tone]}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ type: "spring", stiffness: 90, damping: 20, delay: 0.15 }}
      />
    </div>
  );
}
