import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

/**
 * Retorna o tenantId do usuario autenticado na sessao atual.
 * Redireciona para /login se nao autenticado.
 * Redireciona para /platform se for PLATFORM_ADMIN (sem tenant).
 */
export async function getTenantId(): Promise<string> {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "PLATFORM_ADMIN") {
    redirect("/platform");
  }

  const tenantId = session.user.tenantId;

  if (!tenantId) {
    redirect("/login");
  }

  return tenantId;
}

/**
 * Retorna os dados completos do usuario autenticado.
 */
export async function getCurrentUser() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return session.user as {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    tenantId?: string;
    tenantName?: string;
  };
}
