"use server";

import { prisma } from "@/lib/db";
import { getTenantId } from "@/lib/tenant";
import { checkPermission } from "@/lib/auth/require-role";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ServiceType } from "@prisma/client";

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
  await checkPermission("preventive.create");
  const tenantId = await getTenantId();

  const equipmentId = formData.get("equipmentId") as string;
  const serviceType = (formData.get("serviceType") as ServiceType) || "PREVENTIVA";
  const scheduledDate = formData.get("scheduledDate") as string;
  const dueDate = formData.get("dueDate") as string;
  const periodicityMonths = formData.get("periodicityMonths") as string;
  const providerId = (formData.get("providerId") as string) || undefined;

  // Legacy: also accept "type" field for backwards compat
  const legacyType = (formData.get("type") as string) || SERVICE_TYPE_TO_LEGACY[serviceType] || serviceType;

  if (!equipmentId || !scheduledDate || !dueDate) {
    return { error: "Equipamento, data agendada e vencimento sao obrigatorios." };
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
    const prov = await prisma.provider.findUnique({
      where: { id: providerId },
      select: { name: true },
    });
    providerName = prov?.name;
  }

  await prisma.preventiveMaintenance.create({
    data: {
      tenantId,
      equipmentId,
      type: legacyType,
      serviceType,
      scheduledDate: new Date(scheduledDate),
      dueDate: new Date(dueDate),
      periodicityMonths: periodicityMonths ? parseInt(periodicityMonths) : 12,
      providerId: providerId || undefined,
      provider: providerName,
      status: "AGENDADA",
    },
  });

  revalidatePath("/manutencoes");
  redirect("/manutencoes");
}

export async function executePreventive(id: string, formData: FormData) {
  await checkPermission("preventive.execute");
  const tenantId = await getTenantId();

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

  // Mark current as REALIZADA
  await prisma.preventiveMaintenance.update({
    where: { id, tenantId },
    data: {
      executionDate: new Date(executionDate),
      cost: cost ? parseFloat(cost) : undefined,
      certificateUrl,
      notes,
      status: "REALIZADA",
    },
  });

  // Auto-generate next maintenance
  if (current.periodicityMonths > 0) {
    const nextScheduledDate = new Date(executionDate);
    nextScheduledDate.setMonth(nextScheduledDate.getMonth() + current.periodicityMonths);

    const nextDueDate = new Date(nextScheduledDate);

    await prisma.preventiveMaintenance.create({
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
    });
  }

  revalidatePath("/manutencoes");
  redirect("/manutencoes");
}

export async function deletePreventive(id: string) {
  await checkPermission("preventive.delete");
  const tenantId = await getTenantId();

  await prisma.preventiveMaintenance.delete({
    where: { id, tenantId },
  });

  revalidatePath("/manutencoes");
  redirect("/manutencoes");
}
