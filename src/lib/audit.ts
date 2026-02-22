"use server";

import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";

interface AuditLogEntry {
  tenantId?: string;
  userId?: string;
  userName?: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  entity: string;
  entityId: string;
  changes?: Record<string, { old?: unknown; new?: unknown }>;
}

/**
 * Registra uma entrada no log de auditoria.
 * Chamado automaticamente apos operacoes criticas.
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: entry.tenantId || null,
        userId: entry.userId || null,
        userName: entry.userName || null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        changes: entry.changes ? (entry.changes as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });
  } catch (error) {
    // Audit logging should never break the main flow
    console.error("[AuditLog] Failed to write:", error);
  }
}

/**
 * Helper para logar a partir de um server action com sessao ativa.
 */
export async function logAuditFromSession(
  action: "CREATE" | "UPDATE" | "DELETE",
  entity: string,
  entityId: string,
  changes?: Record<string, { old?: unknown; new?: unknown }>
): Promise<void> {
  try {
    const session = await auth();
    const user = session?.user as { id?: string; name?: string; tenantId?: string } | undefined;
    await logAudit({
      tenantId: user?.tenantId,
      userId: user?.id,
      userName: user?.name || undefined,
      action,
      entity,
      entityId,
      changes,
    });
  } catch {
    // Silent fail
  }
}
