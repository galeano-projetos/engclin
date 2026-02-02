import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getNavPermissions, isPlatformAdmin } from "@/lib/auth/permissions";
import { UserRole } from "@prisma/client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as {
    name: string;
    role: string;
    tenantName?: string;
  };

  // PLATFORM_ADMIN deve usar /platform
  if (isPlatformAdmin(user.role)) {
    redirect("/platform");
  }

  const navPermissions = { ...getNavPermissions(user.role as UserRole) };

  return (
    <DashboardShell
      userName={user.name}
      tenantName={user.tenantName}
      userRole={user.role}
      navPermissions={navPermissions}
    >
      {children}
    </DashboardShell>
  );
}
