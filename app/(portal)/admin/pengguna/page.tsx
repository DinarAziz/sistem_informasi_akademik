import type { Metadata } from "next";
import { getLecturers, getUsers } from "@/lib/data";
import { requireRole } from "@/lib/auth";
import { UserAdmin } from "@/components/user-admin";

export const metadata: Metadata = { title: "Kelola Pengguna" };

export default async function AdminPenggunaPage() {
  await requireRole("ADMIN");
  const [users, lecturers] = await Promise.all([getUsers(), getLecturers()]);
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Pengguna</h1>
        <p className="mt-1.5 max-w-prose text-muted">Akun mahasiswa, dosen, dan administrator.</p>
      </header>
      <UserAdmin
        users={users.map((u) => ({ id: u.id, username: u.username, nama: u.nama, role: u.role, pembimbing: u.student?.dosenPembimbing?.nama ?? null }))}
        lecturers={lecturers.map((l) => ({ id: l.id, nama: l.nama }))}
      />
    </div>
  );
}
