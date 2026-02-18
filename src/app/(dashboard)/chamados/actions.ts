"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/tenant";
import { checkPermission } from "@/lib/auth/require-role";
import { invalidatePhysicsTests } from "@/app/(dashboard)/fisica-medica/actions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { safeFormGet, urgencySchema } from "@/lib/validation";
import { createServiceOrderInTx } from "@/lib/service-order";

export async function createTicketAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  return createTicket(formData);
}

export async function createTicket(formData: FormData) {
  const { tenantId, userId } = await checkPermission("ticket.create");
  const user = await getCurrentUser();

  const equipmentId = safeFormGet(formData, "equipmentId");
  const description = safeFormGet(formData, "description");
  const rawUrgency = safeFormGet(formData, "urgency");
  const urgency = urgencySchema.safeParse(rawUrgency || "MEDIA");

  if (!equipmentId || !description) {
    return { error: "Equipamento e descricao sao obrigatorios." };
  }

  if (!urgency.success) {
    return { error: urgency.error.issues[0].message };
  }

  const equipment = await prisma.equipment.findFirst({
    where: { id: equipmentId, tenantId },
  });

  if (!equipment) {
    return { error: "Equipamento nao encontrado." };
  }

  await prisma.$transaction(async (tx) => {
    const ticket = await tx.correctiveMaintenance.create({
      data: {
        tenantId,
        equipmentId,
        openedById: user.id,
        description,
        urgency: urgency.data,
        status: "ABERTO",
      },
    });

    await tx.equipment.update({
      where: { id: equipmentId, tenantId },
      data: { status: "EM_MANUTENCAO" },
    });

    await createServiceOrderInTx(tx, tenantId, {
      correctiveMaintenanceId: ticket.id,
    });
  });

  revalidatePath("/chamados");
  revalidatePath("/ordens-servico");
  redirect("/chamados");
}

export async function acceptTicket(id: string) {
  const { tenantId } = await checkPermission("ticket.accept");
  const user = await getCurrentUser();

  await prisma.correctiveMaintenance.update({
    where: { id, tenantId },
    data: {
      assignedToId: user.id,
      status: "EM_ATENDIMENTO",
    },
  });

  revalidatePath("/chamados");
}

export async function resolveTicket(id: string, formData: FormData) {
  const { tenantId } = await checkPermission("ticket.resolve");

  const diagnosis = safeFormGet(formData, "diagnosis") || undefined;
  const solution = safeFormGet(formData, "solution");
  const partsUsed = safeFormGet(formData, "partsUsed") || undefined;
  const rawTimeSpent = safeFormGet(formData, "timeSpent");
  const rawCost = safeFormGet(formData, "cost");

  if (!solution) {
    return { error: "A descricao da solucao e obrigatoria." };
  }

  const timeSpent = rawTimeSpent ? parseInt(rawTimeSpent) : undefined;
  const cost = rawCost ? parseFloat(rawCost) : undefined;

  if (rawTimeSpent && isNaN(timeSpent!)) {
    return { error: "Tempo gasto invalido." };
  }
  if (rawCost && isNaN(cost!)) {
    return { error: "Custo invalido." };
  }

  const ticket = await prisma.correctiveMaintenance.update({
    where: { id, tenantId },
    data: {
      diagnosis,
      solution,
      partsUsed,
      timeSpent,
      cost,
      status: "RESOLVIDO",
      closedAt: new Date(),
    },
  });

  // Only set equipment to ATIVO if no other open tickets exist
  const otherOpenTickets = await prisma.correctiveMaintenance.count({
    where: {
      equipmentId: ticket.equipmentId,
      tenantId,
      status: { in: ["ABERTO", "EM_ATENDIMENTO"] },
      id: { not: id },
    },
  });

  if (otherOpenTickets === 0) {
    await prisma.equipment.update({
      where: { id: ticket.equipmentId, tenantId },
      data: { status: "ATIVO" },
    });
  }

  await invalidatePhysicsTests(tenantId, ticket.equipmentId);

  revalidatePath("/chamados");
  revalidatePath("/fisica-medica");
  redirect("/chamados");
}

export async function closeTicket(id: string) {
  const { tenantId } = await checkPermission("ticket.close");

  await prisma.correctiveMaintenance.update({
    where: { id, tenantId },
    data: { status: "FECHADO" },
  });

  revalidatePath("/chamados");
}
