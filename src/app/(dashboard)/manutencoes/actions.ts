"use server";

import { prisma } from "@/lib/db";
import { checkPermission } from "@/lib/auth/require-role";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ServiceType } from "@prisma/client";
import { safeFormGet, serviceTypeSchema, dateSchema, positiveDecimalSchema, positiveIntSchema, urlSchema } from "@/lib/validation";
import { planAllows } from "@/lib/auth/plan-features";
import { createServiceOrderInTx } from "@/lib/service-order";

const SERVICE_TYPE_TO_LEGACY: Record<string, string> = {
  PREVENTIVA: "Manutencao Preventiva Geral",
  CALIBRACAO: "Calibracao",
  TSE: "Teste de Seguranca Eletrica",
};

export async function createPreventiveAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  return createPreventive(formData);
}

export async function createPreventive(formData: FormData) {
  const { tenantId, plan } = await checkPermission("preventive.create");

  const equipmentId = formData.get("equipmentId") as string;
  const serviceType = (formData.get("serviceType") as string) || "PREVENTIVA";

  // Plan enforcement: block CALIBRACAO/TSE for plans that don't support them
  if (serviceType === "CALIBRACAO" && !planAllows(plan, "preventive.calibracao")) {
    return { error: "Calibração não disponível no seu plano." };
  }
  if (serviceType === "TSE" && !planAllows(plan, "preventive.tse")) {
    return { error: "TSE não disponível no seu plano." };
  }
  const scheduledDate = formData.get("scheduledDate") as string;
  const dueDate = formData.get("dueDate") as string;
  const periodicityMonths = formData.get("periodicityMonths") as string;
  const providerId = (formData.get("providerId") as string) || undefined;

  // Legacy: also accept "type" field for backwards compat
  const legacyType = (formData.get("type") as string) || SERVICE_TYPE_TO_LEGACY[serviceType] || serviceType;

  if (!equipmentId || !scheduledDate || !dueDate) {
    return { error: "Equipamento, data agendada e vencimento sao obrigatorios." };
  }

  if (new Date(scheduledDate) > new Date(dueDate)) {
    return { error: "Data agendada deve ser anterior ou igual ao vencimento." };
  }

  const equipment = await prisma.equipment.findFirst({
    where: { id: equipmentId, tenantId },
  });

  if (!equipment) {
    return { error: "Equipamento nao encontrado." };
  }

  // Resolve provider name for legacy field
  let providerName: string | undefined;
  if (providerId) {
    const prov = await prisma.provider.findFirst({
      where: { id: providerId, tenantId },
      select: { name: true },
    });
    providerName = prov?.name;
  }

  await prisma.$transaction(async (tx) => {
    const maintenance = await tx.preventiveMaintenance.create({
      data: {
        tenantId,
        equipmentId,
        type: legacyType,
        serviceType: serviceType as ServiceType,
        scheduledDate: new Date(scheduledDate),
        dueDate: new Date(dueDate),
        periodicityMonths: periodicityMonths ? Math.min(Math.max(parseInt(periodicityMonths) || 12, 1), 120) : 12,
        providerId: providerId || undefined,
        provider: providerName,
        status: "AGENDADA",
      },
    });

    await createServiceOrderInTx(tx, tenantId, {
      preventiveMaintenanceId: maintenance.id,
    });
  });

  revalidatePath("/manutencoes");
  revalidatePath("/ordens-servico");
  redirect("/manutencoes");
}

export async function executePreventive(id: string, formData: FormData) {
  const { tenantId } = await checkPermission("preventive.execute");

  const executionDate = formData.get("executionDate") as string;
  const cost = formData.get("cost") as string;
  const certificateUrl = (formData.get("certificateUrl") as string) || undefined;
  const notes = (formData.get("notes") as string) || undefined;

  if (!executionDate) {
    return { error: "A data de execucao e obrigatoria." };
  }

  // Get the current maintenance to read periodicity and create next
  const current = await prisma.preventiveMaintenance.findFirst({
    where: { id, tenantId },
  });

  if (!current) {
    return { error: "Manutencao nao encontrada." };
  }

  const operations = [
    prisma.preventiveMaintenance.update({
      where: { id, tenantId },
      data: {
        executionDate: new Date(executionDate),
        cost: cost && !isNaN(parseFloat(cost)) ? parseFloat(cost) : undefined,
        certificateUrl,
        notes,
        status: "REALIZADA",
      },
    }),
  ];

  // Auto-generate next maintenance
  if (current.periodicityMonths > 0) {
    const nextScheduledDate = new Date(executionDate);
    nextScheduledDate.setMonth(nextScheduledDate.getMonth() + current.periodicityMonths);
    const nextDueDate = new Date(nextScheduledDate);

    operations.push(
      prisma.preventiveMaintenance.create({
        data: {
          tenantId: current.tenantId,
          equipmentId: current.equipmentId,
          type: current.type,
          serviceType: current.serviceType,
          scheduledDate: nextScheduledDate,
          dueDate: nextDueDate,
          periodicityMonths: current.periodicityMonths,
          providerId: current.providerId,
          provider: current.provider,
          status: "AGENDADA",
        },
      })
    );
  }

  await prisma.$transaction(operations);

  revalidatePath("/manutencoes");
  redirect("/manutencoes");
}

export async function deletePreventive(id: string) {
  const { tenantId } = await checkPermission("preventive.delete");

  await prisma.preventiveMaintenance.delete({
    where: { id, tenantId },
  });

  revalidatePath("/manutencoes");
  redirect("/manutencoes");
}
