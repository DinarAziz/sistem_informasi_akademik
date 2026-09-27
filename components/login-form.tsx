"use client";

import { useActionState, useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { masuk, type LoginState } from "@/app/actions/auth";

type Akun = { peran: string; username: string; password: string; nama: string };

export function LoginForm({ akunDemo }: { akunDemo: Akun[] }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(masuk, {});
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [tampil, setTampil] = useState(false);

  return (
    <div className="w-full max-w-sm">
      <h1 className="font-display text-3xl font-bold tracking-tight">Masuk</h1>
      <p className="mt-1.5 text-sm text-muted">Gunakan NIM (mahasiswa), NIP (dosen), atau username (administrator).</p>

      <form action={action} className="mt-8 space-y-5" noValidate>
        <div>
          <label htmlFor="username" className="text-sm font-medium">
            NIM, NIP, atau username
          </label>
          <input
            id="username"
            name="username"
            autoComplete="username"
            inputMode="text"
            autoFocus
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            aria-invalid={!!state.error}
            aria-describedby={state.error ? "login-error" : undefined}
            className="num mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-3 text-base"
          />
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-medium">
            Kata sandi
          </label>
          <div className="relative mt-1.5">
            <input
              id="password"
              name="password"
              type={tampil ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!state.error}
              aria-describedby={state.error ? "login-error" : undefined}
              className="w-full rounded-lg border border-line bg-white py-3 pl-3.5 pr-11 text-base"
            />
            <button
              type="button"
              onClick={() => setTampil((v) => !v)}
              aria-label={tampil ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              aria-pressed={tampil}
              className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-muted hover:bg-paper hover:text-ink"
            >
              {tampil ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
            </button>
          </div>
        </div>

        <div aria-live="polite" id="login-error">
          {state.error && (
            <motion.p
              key={state.error}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert"
              className="rounded-lg bg-bad-soft px-3.5 py-2.5 text-sm text-bad"
            >
              {state.error}
            </motion.p>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy px-4 py-3 font-semibold text-white transition active:scale-[0.98] hover:bg-navy-deep disabled:opacity-70"
        >
          {pending ? <Loader2 className="size-[18px] animate-spin" aria-hidden /> : <LogIn className="size-[18px]" aria-hidden />}
          {pending ? "Memeriksa akun…" : "Masuk"}
        </button>
      </form>

      {akunDemo.length > 0 && (
        <div className="mt-10 border-t border-line pt-5">
          <p className="text-sm font-medium">Akun demo</p>
          <p className="mt-0.5 text-xs text-muted">Pilih salah satu untuk mengisi formulir otomatis.</p>
          <ul className="mt-3 space-y-2">
            {akunDemo.map((a) => (
              <li key={a.username}>
                <button
                  type="button"
                  onClick={() => {
                    setUsername(a.username);
                    setPassword(a.password);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-line bg-white px-3.5 py-2.5 text-left text-sm transition hover:border-navy/40 hover:bg-navy-soft/50"
                >
                  <span>
                    <span className="block font-semibold">{a.peran}</span>
                    <span className="block text-xs text-muted">{a.nama}</span>
                  </span>
                  <span className="num text-xs text-muted">{a.username.length > 12 ? `${a.username.slice(0, 8)}…` : a.username}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
