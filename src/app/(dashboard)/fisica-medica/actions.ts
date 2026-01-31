"use server";

import { prisma } from "@/lib/db";
import { getTenantId } from "@/lib/tenant";
import { checkPermission } from "@/lib/auth/require-role";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { MedicalPhysicsType } from "@prisma/client";

export async function createPhysicsTestAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  return createPhysicsTest(formData);
}

export async function createPhysicsTest(formData: FormData) {
  await checkPermission("physics.create");
  const tenantId = await getTenantId();

  const equipmentId = formData.get("equipmentId") as string;
  const type = formData.get("type") as MedicalPhysicsType;
  const scheduledDate = formData.get("scheduledDate") as string;
  const dueDate = formData.get("dueDate") as string;
  const provider = (formData.get("provider") as string) || undefined;
  const providerId = (formData.get("providerId") as string) || undefined;

  if (!equipmentId || !type || !scheduledDate || !dueDate) {
    return { error: "Equipamento, tipo, data agendada e vencimento sao obrigatorios." };
  }

  const equipment = await prisma.equipment.findFirst({
    where: { id: equipmentId, tenantId },
  });

  if (!equipment) {
    return { error: "Equipamento nao encontrado." };
  }

  await prisma.medicalPhysicsTest.create({
    data: {
      tenantId,
      equipmentId,
      type,
      scheduledDate: new Date(scheduledDate),
      dueDate: new Date(dueDate),
      provider,
      providerId: providerId || undefined,
      status: "AGENDADA",
    },
  });

  revalidatePath("/fisica-medica");
  redirect("/fisica-medica");
}

export async function executePhysicsTest(id: string, formData: FormData) {
  await checkPermission("physics.execute");
  const tenantId = await getTenantId();

  const executionDate = formData.get("executionDate") as string;
  const reportUrl = (formData.get("reportUrl") as string) || undefined;
  const notes = (formData.get("notes") as string) || undefined;

  if (!executionDate) {
    return { error: "A data de execucao e obrigatoria." };
  }

  await prisma.medicalPhysicsTest.update({
    where: { id, tenantId },
    data: {
      executionDate: new Date(executionDate),
      reportUrl,
      notes,
      status: "REALIZADA",
    },
  });

  revalidatePath("/fisica-medica");
  redirect("/fisica-medica");
}

export async function deletePhysicsTest(id: string) {
  await checkPermission("physics.delete");
  const tenantId = await getTenantId();

  await prisma.medicalPhysicsTest.delete({
    where: { id, tenantId },
  });

  revalidatePath("/fisica-medica");
  redirect("/fisica-medica");
}

/**
 * Regra especial PRD 3.6:
 * Zera a validade de todos os testes de fisica medica de um equipamento
 * quando uma manutencao corretiva e registrada para ele.
 */
export async function invalidatePhysicsTests(
  tenantId: string,
  equipmentId: string
) {
  await prisma.medicalPhysicsTest.updateMany({
    where: {
      tenantId,
      equipmentId,
      status: "REALIZADA",
    },
    data: {
      status: "AGENDADA",
      executionDate: null,
      notes: "Teste invalidado: manutencao corretiva registrada. Necessario reagendar.",
    },
  });
}
