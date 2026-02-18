"use server";

import { prisma } from "@/lib/db";
import { checkPermission } from "@/lib/auth/require-role";
import { revalidatePath } from "next/cache";

export async function startOsExecution(id: string) {
  const { tenantId } = await checkPermission("os.manage");

  const order = await prisma.serviceOrder.findFirst({
    where: { id, tenantId, status: "ABERTA" },
  });

  if (!order) {
    return { error: "Ordem de serviço não encontrada ou já em execução." };
  }

  await prisma.serviceOrder.update({
    where: { id, tenantId },
    data: { status: "EM_EXECUCAO" },
  });

  revalidatePath("/ordens-servico");
}

export async function completeOs(id: string) {
  const { tenantId } = await checkPermission("os.manage");

  const order = await prisma.serviceOrder.findFirst({
    where: { id, tenantId, status: "EM_EXECUCAO" },
  });

  if (!order) {
    return { error: "Ordem de serviço não encontrada ou não está em execução." };
  }

  await prisma.serviceOrder.update({
    where: { id, tenantId },
    data: {
      status: "CONCLUIDA",
      completedAt: new Date(),
    },
  });

  revalidatePath("/ordens-servico");
}
