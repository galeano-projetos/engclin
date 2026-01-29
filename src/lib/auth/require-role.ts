import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { hasPermission } from "./permissions";

/**
 * Verifica se o usuário autenticado possui a permissão especificada.
 * Redireciona para /dashboard se não tiver permissão.
 * Retorna os dados do usuário se autorizado.
 */
export async function requirePermission(permission: string) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as {
    id: string;
    name: string;
    email: string;
    role: string;
    tenantId: string;
    tenantName: string;
  };

  const role = user.role as UserRole;

  if (!hasPermission(role, permission)) {
    redirect("/dashboard");
  }

  return { ...user, role };
}

/**
 * Verifica permissão sem redirecionar — para uso em Server Actions.
 * Lança erro se não autorizado.
 */
export async function checkPermission(permission: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Não autenticado");
  }

  const user = session.user as { role: string; tenantId: string; id: string };
  const role = user.role as UserRole;

  if (!hasPermission(role, permission)) {
    throw new Error("Sem permissão para esta ação");
  }

  return { role, tenantId: user.tenantId as string, userId: user.id };
}
