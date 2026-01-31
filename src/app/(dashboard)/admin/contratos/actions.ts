"use server";

import { prisma } from "@/lib/db";
import { checkPermission } from "@/lib/auth/require-role";
import { revalidatePath } from "next/cache";

export async function getContracts() {
  const { tenantId } = await checkPermission("contract.view");
  return prisma.contract.findMany({
    where: { tenantId },
    include: {
      provider: { select: { id: true, name: true } },
      equipments: {
        include: {
          equipment: { select: { id: true, name: true, patrimony: true } },
        },
      },
    },
    orderBy: { endDate: "desc" },
  });
}

export async function createContract(formData: FormData) {
  const { tenantId } = await checkPermission("contract.create");

  const providerId = formData.get("providerId") as string;
  const name = formData.get("name") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const value = formData.get("value") as string;
  const documentUrl = (formData.get("documentUrl") as string) || undefined;
  const equipmentIds = formData.getAll("equipmentIds") as string[];

  if (!providerId || !name?.trim() || !startDate || !endDate) {
    return { error: "Fornecedor, nome, data inicio e data fim sao obrigatorios." };
  }

  await prisma.contract.create({
    data: {
      tenantId,
      providerId,
      name: name.trim(),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      value: value ? parseFloat(value) : undefined,
      documentUrl,
      equipments: {
        create: equipmentIds
          .filter((id) => id)
          .map((equipmentId) => ({ equipmentId })),
      },
    },
  });

  revalidatePath("/admin/contratos");
  return { success: true };
}

export async function deleteContract(id: string) {
  const { tenantId } = await checkPermission("contract.delete");

  await prisma.contract.delete({
    where: { id, tenantId },
  });

  revalidatePath("/admin/contratos");
  return { success: true };
}
