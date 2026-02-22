"use server";

import { prisma } from "@/lib/db";
import { checkPermission } from "@/lib/auth/require-role";
import { revalidatePath } from "next/cache";
import { ServiceType } from "@prisma/client";
import { planAllows } from "@/lib/auth/plan-features";
import { createServiceOrderInTx } from "@/lib/service-order";

const SERVICE_TYPE_TO_LEGACY: Record<string, string> = {
  PREVENTIVA: "Manutencao Preventiva Geral",
  CALIBRACAO: "Calibracao",
  TSE: "Teste de Seguranca Eletrica",
};

export async function bulkSchedulePreventive(formData: FormData): Promise<{ error?: string; count?: number }> {
  const { tenantId, plan } = await checkPermission("preventive.create");

  const equipmentIdsRaw = formData.get("equipmentIds") as string;
  const serviceType = (formData.get("serviceType") as string) || "PREVENTIVA";
  const scheduledDate = formData.get("scheduledDate") as string;
  const periodicityMonths = formData.get("periodicityMonths") as string;
  const providerId = (formData.get("providerId") as string) || undefined;

  if (!equipmentIdsRaw || !scheduledDate) {
    return { error: "Selecione equipamentos e informe a data agendada." };
  }

  // Plan enforcement
  if (serviceType === "CALIBRACAO" && !planAllows(plan, "preventive.calibracao")) {
    return { error: "Calibracao nao disponivel no seu plano." };
  }
  if (serviceType === "TSE" && !planAllows(plan, "preventive.tse")) {
    return { error: "TSE nao disponivel no seu plano." };
  }

  const equipmentIds = JSON.parse(equipmentIdsRaw) as string[];
  if (equipmentIds.length === 0) {
    return { error: "Selecione ao menos um equipamento." };
  }

  // Validate all equipment belongs to tenant
  const validEquipments = await prisma.equipment.findMany({
    where: { id: { in: equipmentIds }, tenantId },
    select: { id: true },
  });

  if (validEquipments.length === 0) {
    return { error: "Nenhum equipamento valido encontrado." };
  }

  const validIds = new Set(validEquipments.map((e) => e.id));
  const periodicity = periodicityMonths ? Math.min(Math.max(parseInt(periodicityMonths) || 12, 1), 120) : 12;
  const legacyType = SERVICE_TYPE_TO_LEGACY[serviceType] || serviceType;

  // Resolve provider name
  let providerName: string | undefined;
  if (providerId) {
    const prov = await prisma.provider.findFirst({
      where: { id: providerId, tenantId },
      select: { name: true },
    });
    providerName = prov?.name;
  }

  const scheduled = new Date(scheduledDate);
  const dueDate = new Date(scheduled);

  // Create all preventives in a single transaction
  await prisma.$transaction(async (tx) => {
    for (const eqId of equipmentIds) {
      if (!validIds.has(eqId)) continue;

      const maintenance = await tx.preventiveMaintenance.create({
        data: {
          tenantId,
          equipmentId: eqId,
          type: legacyType,
          serviceType: serviceType as ServiceType,
          scheduledDate: scheduled,
          dueDate,
          periodicityMonths: periodicity,
          providerId: providerId || undefined,
          provider: providerName,
          status: "AGENDADA",
        },
      });

      await createServiceOrderInTx(tx, tenantId, {
        preventiveMaintenanceId: maintenance.id,
      });
    }
  });

  revalidatePath("/manutencoes");
  revalidatePath("/equipamentos");
  revalidatePath("/ordens-servico");

  return { count: validIds.size };
}
