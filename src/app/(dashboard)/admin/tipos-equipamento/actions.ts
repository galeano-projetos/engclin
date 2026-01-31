"use server";

import { prisma } from "@/lib/db";
import { checkPermission } from "@/lib/auth/require-role";
import { revalidatePath } from "next/cache";
import { Criticality, Periodicity } from "@prisma/client";

export async function getEquipmentTypes() {
  const { tenantId } = await checkPermission("equipmentType.view");
  return prisma.equipmentType.findMany({
    where: { tenantId },
    include: {
      defaultPreventivaProvider: { select: { id: true, name: true } },
      defaultCalibracaoProvider: { select: { id: true, name: true } },
      defaultTseProvider: { select: { id: true, name: true } },
      _count: { select: { equipments: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function createEquipmentType(formData: FormData) {
  const { tenantId } = await checkPermission("equipmentType.create");

  const name = formData.get("name") as string;
  if (!name?.trim()) {
    return { error: "Nome do tipo e obrigatorio." };
  }

  const defaultCriticality = (formData.get("defaultCriticality") as Criticality) || "C";
  const preventivaPeriodicity = (formData.get("preventivaPeriodicity") as Periodicity) || "ANUAL";
  const calibracaoPeriodicity = (formData.get("calibracaoPeriodicity") as Periodicity) || "ANUAL";
  const tsePeriodicity = (formData.get("tsePeriodicity") as Periodicity) || "ANUAL";
  const reserveCount = parseInt(formData.get("reserveCount") as string) || 0;
  const defaultPreventivaProviderId = (formData.get("defaultPreventivaProviderId") as string) || null;
  const defaultCalibracaoProviderId = (formData.get("defaultCalibracaoProviderId") as string) || null;
  const defaultTseProviderId = (formData.get("defaultTseProviderId") as string) || null;

  await prisma.equipmentType.create({
    data: {
      tenantId,
      name: name.trim(),
      defaultCriticality,
      preventivaPeriodicity,
      calibracaoPeriodicity,
      tsePeriodicity,
      reserveCount,
      defaultPreventivaProviderId,
      defaultCalibracaoProviderId,
      defaultTseProviderId,
    },
  });

  revalidatePath("/admin/tipos-equipamento");
  return { success: true };
}

export async function updateEquipmentType(id: string, formData: FormData) {
  const { tenantId } = await checkPermission("equipmentType.edit");

  const name = formData.get("name") as string;
  if (!name?.trim()) {
    return { error: "Nome do tipo e obrigatorio." };
  }

  const defaultCriticality = (formData.get("defaultCriticality") as Criticality) || "C";
  const preventivaPeriodicity = (formData.get("preventivaPeriodicity") as Periodicity) || "ANUAL";
  const calibracaoPeriodicity = (formData.get("calibracaoPeriodicity") as Periodicity) || "ANUAL";
  const tsePeriodicity = (formData.get("tsePeriodicity") as Periodicity) || "ANUAL";
  const reserveCount = parseInt(formData.get("reserveCount") as string) || 0;
  const defaultPreventivaProviderId = (formData.get("defaultPreventivaProviderId") as string) || null;
  const defaultCalibracaoProviderId = (formData.get("defaultCalibracaoProviderId") as string) || null;
  const defaultTseProviderId = (formData.get("defaultTseProviderId") as string) || null;

  await prisma.equipmentType.update({
    where: { id, tenantId },
    data: {
      name: name.trim(),
      defaultCriticality,
      preventivaPeriodicity,
      calibracaoPeriodicity,
      tsePeriodicity,
      reserveCount,
      defaultPreventivaProviderId,
      defaultCalibracaoProviderId,
      defaultTseProviderId,
    },
  });

  revalidatePath("/admin/tipos-equipamento");
  return { success: true };
}

export async function deleteEquipmentType(id: string) {
  const { tenantId } = await checkPermission("equipmentType.delete");

  const count = await prisma.equipment.count({
    where: { equipmentTypeId: id, tenantId },
  });

  if (count > 0) {
    return { error: `Este tipo possui ${count} equipamento(s) vinculado(s).` };
  }

  await prisma.equipmentType.delete({ where: { id, tenantId } });
  revalidatePath("/admin/tipos-equipamento");
  return { success: true };
}
