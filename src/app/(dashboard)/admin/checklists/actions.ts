"use server";

import { prisma } from "@/lib/db";
import { checkPermission } from "@/lib/auth/require-role";
import { revalidatePath } from "next/cache";

export async function getChecklistTemplates() {
  const { tenantId } = await checkPermission("checklist.view");
  return prisma.checklistTemplate.findMany({
    where: { tenantId },
    include: {
      equipmentType: { select: { id: true, name: true } },
      items: { orderBy: { order: "asc" } },
      _count: { select: { results: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function createChecklistTemplate(formData: FormData) {
  const { tenantId } = await checkPermission("checklist.create");

  const name = formData.get("name") as string;
  const equipmentTypeId = formData.get("equipmentTypeId") as string;

  if (!name?.trim()) return { error: "Nome do checklist e obrigatorio." };
  if (!equipmentTypeId) return { error: "Tipo de equipamento e obrigatorio." };

  const eqType = await prisma.equipmentType.findFirst({
    where: { id: equipmentTypeId, tenantId },
  });
  if (!eqType) return { error: "Tipo de equipamento nao encontrado." };

  await prisma.checklistTemplate.create({
    data: { tenantId, name: name.trim(), equipmentTypeId },
  });

  revalidatePath("/admin/checklists");
  return { success: true };
}

export async function addChecklistItem(templateId: string, formData: FormData) {
  const { tenantId } = await checkPermission("checklist.edit");

  const description = formData.get("description") as string;
  if (!description?.trim()) return { error: "Descricao do item e obrigatoria." };

  const template = await prisma.checklistTemplate.findFirst({
    where: { id: templateId, tenantId },
  });
  if (!template) return { error: "Template nao encontrado." };

  const lastItem = await prisma.checklistItem.findFirst({
    where: { templateId },
    orderBy: { order: "desc" },
  });
  const nextOrder = (lastItem?.order ?? -1) + 1;

  await prisma.checklistItem.create({
    data: { templateId, description: description.trim(), order: nextOrder },
  });

  revalidatePath("/admin/checklists");
  return { success: true };
}

export async function removeChecklistItem(itemId: string) {
  const { tenantId } = await checkPermission("checklist.edit");

  const item = await prisma.checklistItem.findFirst({
    where: { id: itemId, template: { tenantId } },
  });
  if (!item) return { error: "Item nao encontrado." };

  await prisma.checklistItem.delete({ where: { id: itemId } });

  revalidatePath("/admin/checklists");
  return { success: true };
}

export async function deleteChecklistTemplate(id: string) {
  const { tenantId } = await checkPermission("checklist.delete");

  const resultCount = await prisma.checklistResult.count({
    where: { templateId: id, tenantId },
  });
  if (resultCount > 0) {
    return { error: `Este checklist possui ${resultCount} resultado(s) vinculado(s). Nao e possivel excluir.` };
  }

  await prisma.checklistTemplate.delete({ where: { id, tenantId } });

  revalidatePath("/admin/checklists");
  return { success: true };
}

export async function toggleChecklistActive(id: string) {
  const { tenantId } = await checkPermission("checklist.edit");

  const template = await prisma.checklistTemplate.findFirst({
    where: { id, tenantId },
  });
  if (!template) return { error: "Template nao encontrado." };

  await prisma.checklistTemplate.update({
    where: { id, tenantId },
    data: { active: !template.active },
  });

  revalidatePath("/admin/checklists");
  return { success: true };
}
