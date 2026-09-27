import type { StatusKrs } from "@prisma/client";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { LABEL_STATUS } from "@/lib/format";

const STYLE: Record<StatusKrs, { cls: string; Icon: typeof Clock3 }> = {
  DISETUJUI: { cls: "bg-ok-soft text-ok", Icon: CheckCircle2 },
  MENUNGGU: { cls: "bg-wait-soft text-wait", Icon: Clock3 },
  DITOLAK: { cls: "bg-bad-soft text-bad", Icon: XCircle },
};

export function StatusBadge({ status }: { status: StatusKrs }) {
  const { cls, Icon } = STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${cls}`}>
      <Icon className="size-3.5" aria-hidden />
      {LABEL_STATUS[status]}
    </span>
  );
}
