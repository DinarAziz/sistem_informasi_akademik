import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getUser } from "@/lib/auth";
import { AKUN_DEMO } from "@/lib/demo-accounts";
import { homeFor } from "@/lib/roles";

// 0 kosong, 1 kuliah, 2 kuliah hari ini (Sen-Jum x 4 sesi)
const MINGGU = [1,0,1,0,0, 0,1,0,2,1, 1,0,0,1,0, 0,1,1,0,0];

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage() {
  const user = await getUser();
  if (user) redirect(homeFor(user.role));

  return (
    <div className="grid min-h-dvh md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div className="on-navy flex flex-col justify-between gap-10 bg-navy p-6 text-white md:p-12">
        <p className="font-display text-2xl font-bold tracking-tight">
          SIA
          <span className="mt-1.5 block h-1 w-8 bg-gold" aria-hidden />
        </p>
        <div>
          <p className="font-display text-3xl font-bold leading-[1.1] tracking-tight md:text-5xl">
            Jadwal, KRS, dan nilai kamu di satu tempat.
          </p>
          <div aria-hidden className="mt-10 hidden max-w-md grid-cols-5 grid-rows-4 gap-1.5 md:grid">
            {MINGGU.map((blok, i) => (
              <span
                key={i}
                className={`h-9 rounded-sm ${blok === 2 ? "bg-gold" : blok === 1 ? "bg-white/25" : "border border-white/10"}`}
              />
            ))}
          </div>
          <p className="mt-3 hidden text-sm text-white/85 md:block">Seluruh kuliah semester ini, terangkum dalam satu pandangan.</p>
        </div>
        <p className="hidden text-sm text-white/85 md:block">Semester Ganjil 2026/2027</p>
      </div>
      <main className="flex items-center justify-center p-6 py-12 md:p-12">
        <LoginForm akunDemo={process.env.SHOW_DEMO_ACCOUNTS === "true" ? AKUN_DEMO : []} />
      </main>
    </div>
  );
}
