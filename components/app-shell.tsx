"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "framer-motion";
import {
  BookOpen, CalendarDays, ClipboardCheck, ClipboardList, LayoutDashboard, Megaphone, Menu, Award, Users, X,
  type LucideIcon,
} from "lucide-react";
import { LogoutButton } from "./logout-button";
import type { NavIcon, NavItem } from "@/lib/roles";

const ICONS: Record<NavIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  krs: ClipboardList,
  jadwal: CalendarDays,
  nilai: Award,
  pengumuman: Megaphone,
  persetujuan: ClipboardCheck,
  matakuliah: BookOpen,
  pengguna: Users,
};

type UserInfo = { nama: string; username: string; peran: string };

function Brand({ peran }: { peran: string }) {
  return (
    <div className="leading-tight">
      <p className="font-display text-xl font-bold tracking-tight">SIA</p>
      <span className="my-1 block h-1 w-6 bg-gold" aria-hidden />
      <p className="text-xs text-white/85">Portal {peran}</p>
    </div>
  );
}

function NavList({ nav, onNavigate, group }: { nav: NavItem[]; onNavigate?: () => void; group: string }) {
  const pathname = usePathname();
  return (
    <LayoutGroup id={group}>
      <ul className="space-y-1">
        {nav.map(({ href, label, icon, exact }) => {
          const Icon = ICONS[icon];
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-white/10 text-white" : "text-white/85 hover:bg-white/5 hover:text-white"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-marker"
                    className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-gold"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <Icon className="size-[18px]" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </LayoutGroup>
  );
}

function Profile({ user }: { user: UserInfo }) {
  const inisial = user.nama.replace(/^(Dr\.|Prof\.|Ir\.|Drs\.)\s+/, "").split(" ").slice(0, 2).map((s) => s[0]).join("");
  return (
    <div className="space-y-3 border-t border-white/10 pt-4">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/15 text-sm font-semibold">{inisial}</span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold">{user.nama}</p>
          <p className="truncate text-xs text-white/85">
            {user.peran}, <span className="num">{user.username}</span>
          </p>
        </div>
      </div>
      <LogoutButton />
    </div>
  );
}

export function AppShell({ user, nav, children }: { user: UserInfo; nav: NavItem[]; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  return (
    <MotionConfig reducedMotion="user">
      <a
        href="#konten"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
      >
        Lewati ke konten
      </a>

      {/* Sidebar desktop */}
      <aside className="on-navy fixed inset-y-0 left-0 z-30 hidden w-64 flex-col justify-between bg-navy p-5 text-white lg:flex">
        <div className="space-y-8">
          <Brand peran={user.peran} />
          <nav aria-label="Menu utama">
            <NavList nav={nav} group="desktop" />
          </nav>
        </div>
        <Profile user={user} />
      </aside>

      {/* Top bar mobile */}
      <header className="on-navy sticky top-0 z-30 flex h-14 items-center justify-between bg-navy px-4 text-white lg:hidden">
        <Brand peran={user.peran} />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Buka menu"
          aria-expanded={open}
          className="-mr-2 grid size-10 place-items-center rounded-lg hover:bg-white/10"
        >
          <Menu className="size-6" />
        </button>
      </header>

      {/* Drawer mobile */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-navy-deep/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className="on-navy absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col justify-between bg-navy p-5 text-white shadow-2xl"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
            >
              <div className="space-y-8">
                <div className="flex items-start justify-between">
                  <Brand peran={user.peran} />
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Tutup menu"
                    className="-mr-2 -mt-1 grid size-10 place-items-center rounded-lg hover:bg-white/10"
                  >
                    <X className="size-5" />
                  </button>
                </div>
                <nav aria-label="Menu utama">
                  <NavList nav={nav} group="mobile" onNavigate={() => setOpen(false)} />
                </nav>
              </div>
              <Profile user={user} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <main id="konten" className="lg:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">{children}</div>
      </main>
    </MotionConfig>
  );
}
