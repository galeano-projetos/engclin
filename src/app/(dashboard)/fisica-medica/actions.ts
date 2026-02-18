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

  if (new Date(scheduledDate) > new Date(dueDate)) {
    return { error: "Data agendada deve ser anterior ou igual ao vencimento." };
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
 * Regra especial PRD 3.6 / RDC 611:
 * Quando uma manutencao corretiva e resolvida para um equipamento:
 * 1. Invalida todos os testes REALIZADA (reseta para AGENDADA)
 * 2. Para cada tipo de teste que o equipamento possui, garante que
 *    exista pelo menos um teste AGENDADA pendente (cria automaticamente se nao houver)
 */
export async function invalidatePhysicsTests(
  tenantId: string,
  equipmentId: string
) {
  // 1. Invalidar testes realizados
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

  // 2. Auto-criar testes pendentes para tipos sem AGENDADA
  const allTests = await prisma.medicalPhysicsTest.findMany({
    where: { tenantId, equipmentId },
    select: { type: true, status: true, periodicityMonths: true, provider: true, providerId: true },
    orderBy: { createdAt: "desc" },
  });

  if (allTests.length === 0) return;

  // Tipos distintos que o equipamento ja possui
  const typesSeen = new Set(allTests.map((t) => t.type));

  const now = new Date();
  const testsToCreate: Array<{
    tenantId: string;
    equipmentId: string;
    type: MedicalPhysicsType;
    scheduledDate: Date;
    dueDate: Date;
    status: "AGENDADA";
    periodicityMonths: number;
    provider: string | null;
    providerId: string | null;
    notes: string;
  }> = [];

  for (const type of typesSeen) {
    const hasScheduled = allTests.some(
      (t) => t.type === type && t.status === "AGENDADA"
    );

    if (!hasScheduled) {
      const reference = allTests.find((t) => t.type === type);
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + 30);

      testsToCreate.push({
        tenantId,
        equipmentId,
        type,
        scheduledDate: now,
        dueDate,
        status: "AGENDADA",
        periodicityMonths: reference?.periodicityMonths || 12,
        provider: reference?.provider || null,
        providerId: reference?.providerId || null,
        notes: "Teste gerado automaticamente: manutencao corretiva resolvida. RDC 611 exige novo teste.",
      });
    }
  }

  if (testsToCreate.length > 0) {
    await prisma.medicalPhysicsTest.createMany({ data: testsToCreate });
  }
}
