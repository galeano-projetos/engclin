"use server";

import { prisma } from "@/lib/db";
import { checkPermission } from "@/lib/auth/require-role";
import { revalidatePath } from "next/cache";

export async function bulkExecutePreventives(formData: FormData): Promise<{ error?: string; count?: number }> {
  const { tenantId } = await checkPermission("preventive.execute");

  const idsRaw = formData.get("maintenanceIds") as string;
  const executionDate = formData.get("executionDate") as string;
  const notes = (formData.get("notes") as string) || undefined;

  if (!idsRaw || !executionDate) {
    return { error: "Selecione manutencoes e informe a data de execucao." };
  }

  const maintenanceIds = JSON.parse(idsRaw) as string[];
  if (maintenanceIds.length === 0) {
    return { error: "Selecione ao menos uma manutencao." };
  }

  // Fetch all selected maintenances (only AGENDADA ones)
  const maintenances = await prisma.preventiveMaintenance.findMany({
    where: { id: { in: maintenanceIds }, tenantId, status: "AGENDADA" },
    select: {
      id: true, equipmentId: true, type: true, serviceType: true,
      periodicityMonths: true, providerId: true, provider: true, tenantId: true,
    },
  });

  if (maintenances.length === 0) {
    return { error: "Nenhuma manutencao valida para executar." };
  }

  const execDate = new Date(executionDate);

  await prisma.$transaction(async (tx) => {
    for (const m of maintenances) {
      // 1. Mark as executed
      await tx.preventiveMaintenance.update({
        where: { id: m.id, tenantId },
        data: {
          executionDate: execDate,
          notes,
          status: "REALIZADA",
        },
      });

      // 2. Auto-generate next maintenance
      if (m.periodicityMonths > 0) {
        const nextDate = new Date(execDate);
        nextDate.setMonth(nextDate.getMonth() + m.periodicityMonths);

        await tx.preventiveMaintenance.create({
          data: {
            tenantId: m.tenantId,
            equipmentId: m.equipmentId,
            type: m.type,
            serviceType: m.serviceType,
            scheduledDate: nextDate,
            dueDate: nextDate,
            periodicityMonths: m.periodicityMonths,
            providerId: m.providerId,
            provider: m.provider,
            status: "AGENDADA",
          },
        });
      }
    }
  });

  revalidatePath("/manutencoes");

  return { count: maintenances.length };
}
