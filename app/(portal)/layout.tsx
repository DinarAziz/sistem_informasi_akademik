import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { LABEL_ROLE, NAV } from "@/lib/roles";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <AppShell user={{ nama: user.nama, username: user.username, peran: LABEL_ROLE[user.role] }} nav={NAV[user.role]}>
      {children}
    </AppShell>
  );
}
