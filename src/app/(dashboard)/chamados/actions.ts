"use server";

import { prisma } from "@/lib/db";
import { getTenantId, getCurrentUser } from "@/lib/tenant";
import { checkPermission } from "@/lib/auth/require-role";
import { invalidatePhysicsTests } from "@/app/(dashboard)/fisica-medica/actions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Urgency } from "@prisma/client";

export async function createTicketAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  return createTicket(formData);
}

export async function createTicket(formData: FormData) {
  await checkPermission("ticket.create");
  const tenantId = await getTenantId();
  const user = await getCurrentUser();

  const equipmentId = formData.get("equipmentId") as string;
  const description = formData.get("description") as string;
  const urgency = (formData.get("urgency") as Urgency) || "MEDIA";

  if (!equipmentId || !description) {
    return { error: "Equipamento e descrição são obrigatórios." };
  }

  const equipment = await prisma.equipment.findFirst({
    where: { id: equipmentId, tenantId },
  });

  if (!equipment) {
    return { error: "Equipamento não encontrado." };
  }

  await prisma.correctiveMaintenance.create({
    data: {
      tenantId,
      equipmentId,
      openedById: user.id,
      description,
      urgency,
      status: "ABERTO",
    },
  });

  await prisma.equipment.update({
    where: { id: equipmentId },
    data: { status: "EM_MANUTENCAO" },
  });

  revalidatePath("/chamados");
  redirect("/chamados");
}

export async function acceptTicket(id: string) {
  await checkPermission("ticket.accept");
  const tenantId = await getTenantId();
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
  await checkPermission("ticket.resolve");
  const tenantId = await getTenantId();

  const diagnosis = (formData.get("diagnosis") as string) || undefined;
  const solution = formData.get("solution") as string;
  const partsUsed = (formData.get("partsUsed") as string) || undefined;
  const timeSpent = formData.get("timeSpent") as string;
  const cost = formData.get("cost") as string;

  if (!solution) {
    return { error: "A descrição da solução é obrigatória." };
  }

  const ticket = await prisma.correctiveMaintenance.update({
    where: { id, tenantId },
    data: {
      diagnosis,
      solution,
      partsUsed,
      timeSpent: timeSpent ? parseInt(timeSpent) : undefined,
      cost: cost ? parseFloat(cost) : undefined,
      status: "RESOLVIDO",
      closedAt: new Date(),
    },
  });

  await prisma.equipment.update({
    where: { id: ticket.equipmentId },
    data: { status: "ATIVO" },
  });

  // Regra especial PRD 3.6: zerar testes de física médica
  await invalidatePhysicsTests(tenantId, ticket.equipmentId);

  revalidatePath("/chamados");
  revalidatePath("/fisica-medica");
  redirect("/chamados");
}

export async function closeTicket(id: string) {
  await checkPermission("ticket.close");
  const tenantId = await getTenantId();

  await prisma.correctiveMaintenance.update({
    where: { id, tenantId },
    data: { status: "FECHADO" },
  });

  revalidatePath("/chamados");
}
