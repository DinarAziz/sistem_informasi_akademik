import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { db } from "./db";
import { homeFor, SESSION_COOKIE, SESSION_HOURS } from "./roles";

const key = () => {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET belum diatur atau kurang dari 32 karakter (.env)");
  return new TextEncoder().encode(secret);
};

// Hash tiruan agar waktu respons sama untuk username yang tidak ada (mencegah user enumeration)
const DUMMY_HASH = bcrypt.hashSync("tidak-dipakai", 10);

export async function verifikasiKredensial(username: string, password: string) {
  const user = await db.user.findUnique({ where: { username } });
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  return ok && user ? user : null;
}

export async function buatSesi(user: { id: number; role: Role }) {
  const token = await new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(key());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
}

export async function hapusSesi() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Pengguna yang sedang masuk, dibaca ulang dari database (akun yang dihapus langsung kehilangan akses). */
export const getUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    const id = Number(payload.sub);
    if (!Number.isInteger(id)) return null;
    return await db.user.findUnique({ where: { id }, select: { id: true, username: true, nama: true, role: true } });
  } catch {
    return null;
  }
});

/** Untuk halaman dan layout: arahkan ke login atau ke beranda peran yang benar. */
export async function requireRole(role: Role) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (user.role !== role) redirect(homeFor(user.role));
  return user;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}
