"use server";

import { prisma } from "@/lib/db";
import { getTenantId } from "@/lib/tenant";
import { checkPermission } from "@/lib/auth/require-role";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
  const type = formData.get("type") as string;
  const scheduledDate = formData.get("scheduledDate") as string;
  const dueDate = formData.get("dueDate") as string;
  const periodicityMonths = formData.get("periodicityMonths") as string;
  const provider = (formData.get("provider") as string) || undefined;

  if (!equipmentId || !type || !scheduledDate || !dueDate) {
    return { error: "Equipamento, tipo, data agendada e vencimento são obrigatórios." };
  }

  const equipment = await prisma.equipment.findFirst({
    where: { id: equipmentId, tenantId },
  });

  if (!equipment) {
    return { error: "Equipamento não encontrado." };
  }

  await prisma.preventiveMaintenance.create({
    data: {
      tenantId,
      equipmentId,
      type,
      scheduledDate: new Date(scheduledDate),
      dueDate: new Date(dueDate),
      periodicityMonths: periodicityMonths ? parseInt(periodicityMonths) : 12,
      provider,
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
    return { error: "A data de execução é obrigatória." };
  }

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
