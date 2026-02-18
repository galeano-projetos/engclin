import { prisma } from "@/lib/db";
import { PrismaClient } from "@prisma/client";

type TransactionClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

/**
 * Cria uma Ordem de Servico com numero sequencial por tenant.
 * Deve ser chamada dentro de uma $transaction interativa.
 */
export async function createServiceOrderInTx(
  tx: TransactionClient,
  tenantId: string,
  opts: { preventiveMaintenanceId?: string; correctiveMaintenanceId?: string }
) {
  const tenant = await tx.tenant.update({
    where: { id: tenantId },
    data: { lastOsNumber: { increment: 1 } },
    select: { lastOsNumber: true },
  });

  return tx.serviceOrder.create({
    data: {
      tenantId,
      number: tenant.lastOsNumber,
      status: "ABERTA",
      preventiveMaintenanceId: opts.preventiveMaintenanceId,
      correctiveMaintenanceId: opts.correctiveMaintenanceId,
    },
  });
}
