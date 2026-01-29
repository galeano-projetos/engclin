import { auth } from "@/lib/auth";

/**
 * Retorna o tenantId do usuário autenticado na sessão atual.
 * Deve ser chamado em Server Components ou Route Handlers.
 * Lança erro se o usuário não estiver autenticado.
 */
export async function getTenantId(): Promise<string> {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Usuário não autenticado");
  }

  const tenantId = (session.user as Record<string, unknown>).tenantId as string;

  if (!tenantId) {
    throw new Error("Tenant não encontrado na sessão");
  }

  return tenantId;
}

/**
 * Retorna os dados completos do usuário autenticado.
 */
export async function getCurrentUser() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Usuário não autenticado");
  }

  return session.user;
}
