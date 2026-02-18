"use server";

import { prisma } from "@/lib/db";
import { checkPermission } from "@/lib/auth/require-role";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Criticality, DepreciationMethod, EquipmentStatus, OwnershipType } from "@prisma/client";

interface EquipmentFormData {
  name: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  patrimony?: string;
  unitId: string;
  equipmentTypeId?: string;
  criticality: Criticality;
  status: EquipmentStatus;
  ownershipType: OwnershipType;
  loanProvider?: string;
  acquisitionDate?: string;
  acquisitionValue?: string;
  vidaUtilAnos?: string;
  metodoDepreciacao?: string;
  valorResidual?: string;
}

function parseFormData(formData: FormData): EquipmentFormData {
  return {
    name: formData.get("name") as string,
    brand: (formData.get("brand") as string) || undefined,
    model: (formData.get("model") as string) || undefined,
    serialNumber: (formData.get("serialNumber") as string) || undefined,
    patrimony: (formData.get("patrimony") as string) || undefined,
    unitId: formData.get("unitId") as string,
    equipmentTypeId: (formData.get("equipmentTypeId") as string) || undefined,
    criticality: (formData.get("criticality") as Criticality) || "C",
    status: (formData.get("status") as EquipmentStatus) || "ATIVO",
    ownershipType: (formData.get("ownershipType") as OwnershipType) || "PROPRIO",
    loanProvider: (formData.get("loanProvider") as string) || undefined,
    acquisitionDate: (formData.get("acquisitionDate") as string) || undefined,
    acquisitionValue: (formData.get("acquisitionValue") as string) || undefined,
    vidaUtilAnos: (formData.get("vidaUtilAnos") as string) || undefined,
    metodoDepreciacao: (formData.get("metodoDepreciacao") as string) || undefined,
    valorResidual: (formData.get("valorResidual") as string) || undefined,
  };
}

export async function createEquipmentAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  return createEquipment(formData);
}

export async function createEquipment(formData: FormData) {
  const { tenantId, plan } = await checkPermission("equipment.create");
  const data = parseFormData(formData);

  if (!data.name || !data.unitId) {
    return { error: "Nome e Setor sao obrigatorios." };
  }

  // Validate unit belongs to tenant
  const unit = await prisma.unit.findFirst({
    where: { id: data.unitId, tenantId },
  });
  if (!unit) {
    return { error: "Setor nao encontrado." };
  }

  // Validate equipment type belongs to tenant (if provided)
  if (data.equipmentTypeId) {
    const eqType = await prisma.equipmentType.findFirst({
      where: { id: data.equipmentTypeId, tenantId },
    });
    if (!eqType) {
      return { error: "Tipo de equipamento nao encontrado." };
    }
  }

  await prisma.equipment.create({
    data: {
      tenantId,
      unitId: data.unitId,
      equipmentTypeId: data.equipmentTypeId || undefined,
      name: data.name,
      brand: data.brand,
      model: data.model,
      serialNumber: data.serialNumber,
      patrimony: data.patrimony,
      criticality: data.criticality,
      status: data.status,
      ownershipType: data.ownershipType,
      loanProvider: data.ownershipType === "COMODATO" ? data.loanProvider : undefined,
      acquisitionDate: data.acquisitionDate
        ? new Date(data.acquisitionDate)
        : undefined,
      acquisitionValue: data.acquisitionValue
        ? parseFloat(data.acquisitionValue)
        : undefined,
      ...(plan === "ENTERPRISE" && {
        vidaUtilAnos: data.vidaUtilAnos ? parseInt(data.vidaUtilAnos) : 10,
        metodoDepreciacao: (data.metodoDepreciacao as DepreciationMethod) || "LINEAR",
        valorResidual: data.valorResidual
          ? parseFloat(data.valorResidual)
          : null,
      }),
    },
  });

  revalidatePath("/equipamentos");
  redirect("/equipamentos");
}

export async function updateEquipmentAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const id = formData.get("_equipmentId") as string;
  return updateEquipment(id, formData);
}

export async function updateEquipment(id: string, formData: FormData) {
  const { tenantId, plan } = await checkPermission("equipment.edit");
  const data = parseFormData(formData);

  if (!data.name || !data.unitId) {
    return { error: "Nome e Setor sao obrigatorios." };
  }

  // Validate unit belongs to tenant
  const unit = await prisma.unit.findFirst({
    where: { id: data.unitId, tenantId },
  });
  if (!unit) {
    return { error: "Setor nao encontrado." };
  }

  // Validate equipment type belongs to tenant (if provided)
  if (data.equipmentTypeId) {
    const eqType = await prisma.equipmentType.findFirst({
      where: { id: data.equipmentTypeId, tenantId },
    });
    if (!eqType) {
      return { error: "Tipo de equipamento nao encontrado." };
    }
  }

  await prisma.equipment.update({
    where: { id, tenantId },
    data: {
      unitId: data.unitId,
      equipmentTypeId: data.equipmentTypeId || null,
      name: data.name,
      brand: data.brand,
      model: data.model,
      serialNumber: data.serialNumber,
      patrimony: data.patrimony,
      criticality: data.criticality,
      status: data.status,
      ownershipType: data.ownershipType,
      loanProvider: data.ownershipType === "COMODATO" ? data.loanProvider : null,
      acquisitionDate: data.acquisitionDate
        ? new Date(data.acquisitionDate)
        : null,
      acquisitionValue: data.acquisitionValue
        ? parseFloat(data.acquisitionValue)
        : null,
      ...(plan === "ENTERPRISE" && {
        vidaUtilAnos: data.vidaUtilAnos ? parseInt(data.vidaUtilAnos) : 10,
        metodoDepreciacao: (data.metodoDepreciacao as DepreciationMethod) || "LINEAR",
        valorResidual: data.valorResidual
          ? parseFloat(data.valorResidual)
          : null,
      }),
    },
  });

  revalidatePath("/equipamentos");
  redirect("/equipamentos");
}

export async function deleteEquipment(id: string, reason?: string) {
  const { tenantId } = await checkPermission("equipment.delete");

  await prisma.equipment.update({
    where: { id, tenantId },
    data: {
      status: "DESCARTADO",
      deactivationDate: new Date(),
      deactivationReason: reason || undefined,
    },
  });

  revalidatePath("/equipamentos");
  redirect("/equipamentos");
}
