import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getNavPermissions, isPlatformAdmin } from "@/lib/auth/permissions";
import { UserRole, Plan } from "@prisma/client";
import { prisma } from "@/lib/db";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.mustChangePassword) {
    redirect("/trocar-senha");
  }

  const user = session.user as {
    name: string;
    role: string;
    tenantId?: string;
    tenantName?: string;
    plan?: Plan;
  };

  // PLATFORM_ADMIN deve usar /platform
  if (isPlatformAdmin(user.role)) {
    redirect("/platform");
  }

  // Verificar se o tenant completou o pagamento (tem cartao cadastrado)
  if (user.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { asaasSubscriptionId: true },
    });

    if (!tenant?.asaasSubscriptionId) {
      redirect(`/registro/pagamento?tenantId=${user.tenantId}`);
    }
  }

  const navPermissions = { ...getNavPermissions(user.role as UserRole, user.plan as Plan | undefined) };

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
