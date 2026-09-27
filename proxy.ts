import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { boleh, homeFor, SESSION_COOKIE, type RoleName } from "@/lib/roles";

/** Lapisan pertama: arahkan tamu ke /login dan tiap peran ke halamannya. Pengecekan penuh tetap ada di server (requireRole). */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;

  let role: RoleName | null = null;
  if (token && process.env.AUTH_SECRET) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
      role = payload.role as RoleName;
    } catch {
      role = null;
    }
  }

  const go = (path: string) => NextResponse.redirect(new URL(path, req.url));

  if (!role) return pathname === "/login" ? NextResponse.next() : go("/login");
  if (pathname === "/login") return go(homeFor(role));
  if (!boleh(role, pathname)) return go(homeFor(role));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"] };
