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

  // Validate provider belongs to tenant
  const provider = await prisma.provider.findFirst({
    where: { id: providerId, tenantId },
  });
  if (!provider) {
    return { error: "Fornecedor nao encontrado." };
  }

  // Validate all equipment belong to tenant
  if (equipmentIds.length > 0) {
    const validEquipCount = await prisma.equipment.count({
      where: { id: { in: equipmentIds.filter(Boolean) }, tenantId },
    });
    if (validEquipCount !== equipmentIds.filter(Boolean).length) {
      return { error: "Um ou mais equipamentos nao foram encontrados." };
    }
  }

  if (documentUrl && !documentUrl.startsWith("http://") && !documentUrl.startsWith("https://")) {
    return { error: "URL do documento deve iniciar com http:// ou https://" };
  }

  if (new Date(startDate) >= new Date(endDate)) {
    return { error: "Data de inicio deve ser anterior a data de fim." };
  }

  await prisma.contract.create({
    data: {
      tenantId,
      providerId,
      name: name.trim(),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      value: value && !isNaN(parseFloat(value)) ? parseFloat(value) : undefined,
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

  const contract = await prisma.contract.findFirst({
    where: { id, tenantId },
  });

  if (!contract) {
    return { error: "Contrato nao encontrado." };
  }

  try {
    await prisma.contract.delete({
      where: { id, tenantId },
    });
  } catch {
    return { error: "Erro ao excluir contrato. Verifique dependencias." };
  }

  revalidatePath("/admin/contratos");
  return { success: true };
}
