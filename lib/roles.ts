// Aman dipakai di edge (proxy) maupun client: tanpa impor server-only.
export type RoleName = "MAHASISWA" | "DOSEN" | "ADMIN";

export const SESSION_COOKIE = "sia_session";
export const SESSION_HOURS = 8;

export const LABEL_ROLE: Record<RoleName, string> = {
  MAHASISWA: "Mahasiswa",
  DOSEN: "Dosen",
  ADMIN: "Administrator",
};

export const homeFor = (role: RoleName) => (role === "DOSEN" ? "/dosen" : role === "ADMIN" ? "/admin" : "/");

const MAHASISWA_PATHS = ["/", "/krs", "/jadwal", "/nilai", "/pengumuman"];

export function boleh(role: RoleName, pathname: string) {
  if (role === "MAHASISWA") return MAHASISWA_PATHS.includes(pathname);
  if (role === "DOSEN") return pathname === "/dosen" || pathname.startsWith("/dosen/") || pathname === "/pengumuman";
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export type NavIcon = "dashboard" | "krs" | "jadwal" | "nilai" | "pengumuman" | "persetujuan" | "matakuliah" | "pengguna";
export type NavItem = { href: string; label: string; icon: NavIcon; exact?: boolean };

export const NAV: Record<RoleName, NavItem[]> = {
  MAHASISWA: [
    { href: "/", label: "Dashboard", icon: "dashboard", exact: true },
    { href: "/krs", label: "KRS", icon: "krs" },
    { href: "/jadwal", label: "Jadwal Kuliah", icon: "jadwal" },
    { href: "/nilai", label: "Nilai", icon: "nilai" },
    { href: "/pengumuman", label: "Pengumuman", icon: "pengumuman" },
  ],
  DOSEN: [
    { href: "/dosen", label: "Dashboard", icon: "dashboard", exact: true },
    { href: "/dosen/jadwal", label: "Jadwal Mengajar", icon: "jadwal" },
    { href: "/dosen/persetujuan", label: "Persetujuan KRS", icon: "persetujuan" },
    { href: "/dosen/nilai", label: "Input Nilai", icon: "nilai" },
    { href: "/pengumuman", label: "Pengumuman", icon: "pengumuman" },
  ],
  ADMIN: [
    { href: "/admin", label: "Dashboard", icon: "dashboard", exact: true },
    { href: "/admin/mata-kuliah", label: "Mata Kuliah", icon: "matakuliah" },
    { href: "/admin/pengumuman", label: "Pengumuman", icon: "pengumuman" },
    { href: "/admin/pengguna", label: "Pengguna", icon: "pengguna" },
  ],
};
