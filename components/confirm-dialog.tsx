"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CircleHelp, Loader2, TriangleAlert } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  loading?: boolean;
  tone?: "danger" | "neutral";
  icon?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({ open, title, description, confirmLabel, cancelLabel = "Kembali", loading, tone = "danger", icon, onConfirm, onCancel }: Props) {
  const danger = tone === "danger";
  const client = useSyncExternalStore(() => () => {}, () => true, () => false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const cancelHandler = useRef(onCancel);
  const busy = useRef(false);

  useEffect(() => {
    cancelHandler.current = onCancel;
    busy.current = !!loading;
  });

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy.current) cancelHandler.current();
      if (e.key === "Tab") {
        const focusable = document.querySelectorAll<HTMLElement>("[data-dialog] button:not([disabled])");
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!client) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <motion.div
            className="absolute inset-0 bg-navy-deep/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !loading && onCancel()}
          />
          <motion.div
            data-dialog
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-desc"
            className="relative w-full max-w-md rounded-xl bg-white p-6 text-ink shadow-2xl"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          >
            <div className="flex gap-4">
              <span className={`grid size-10 shrink-0 place-items-center rounded-full ${danger ? "bg-bad-soft text-bad" : "bg-navy-soft text-navy"}`}>
                {icon ?? (danger ? <TriangleAlert className="size-5" aria-hidden /> : <CircleHelp className="size-5" aria-hidden />)}
              </span>
              <div>
                <h2 id="confirm-title" className="font-display text-lg font-semibold leading-tight">
                  {title}
                </h2>
                <div id="confirm-desc" className="mt-1.5 text-sm leading-relaxed text-muted">
                  {description}
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                ref={cancelRef}
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink hover:bg-paper disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition active:scale-[0.97] hover:brightness-110 disabled:opacity-70 ${danger ? "bg-bad" : "bg-navy"}`}
              >
                {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
                {loading ? "Memproses…" : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
