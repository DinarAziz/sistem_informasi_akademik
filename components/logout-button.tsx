"use client";

import { useState, useTransition } from "react";
import { LogOut } from "lucide-react";
import { keluar } from "@/app/actions/auth";
import { ConfirmDialog } from "./confirm-dialog";

export function LogoutButton() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/85 transition-colors hover:bg-white/5 hover:text-white"
      >
        <LogOut className="size-[18px]" aria-hidden />
        Keluar
      </button>
      <ConfirmDialog
        open={open}
        tone="neutral"
        icon={<LogOut className="size-5" aria-hidden />}
        title="Keluar dari SIA?"
        description="Sesi kamu berakhir. Perubahan yang belum disimpan tidak ikut tersimpan."
        confirmLabel="Ya, keluar"
        cancelLabel="Tetap masuk"
        loading={pending}
        onConfirm={() => startTransition(() => keluar())}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
