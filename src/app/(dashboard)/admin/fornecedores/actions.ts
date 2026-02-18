"use server";

import { prisma } from "@/lib/db";
import { checkPermission } from "@/lib/auth/require-role";
import { revalidatePath } from "next/cache";

export async function getProviders() {
  const { tenantId } = await checkPermission("provider.view");
  return prisma.provider.findMany({
    where: { tenantId },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });
}

export async function createProvider(formData: FormData) {
  const { tenantId } = await checkPermission("provider.create");

  const name = formData.get("name") as string;
  const cnpj = (formData.get("cnpj") as string) || undefined;
  const phone = (formData.get("phone") as string) || undefined;
  const email = (formData.get("email") as string) || undefined;
  const contactPerson = (formData.get("contactPerson") as string) || undefined;

  if (!name?.trim()) {
    return { error: "Nome do fornecedor e obrigatorio." };
  }

  await prisma.provider.create({
    data: { tenantId, name: name.trim(), cnpj, phone, email, contactPerson },
  });

  revalidatePath("/admin/fornecedores");
  return { success: true };
}

export async function updateProvider(id: string, formData: FormData) {
  const { tenantId } = await checkPermission("provider.edit");

  const name = formData.get("name") as string;
  const cnpj = (formData.get("cnpj") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const email = (formData.get("email") as string) || null;
  const contactPerson = (formData.get("contactPerson") as string) || null;

  if (!name?.trim()) {
    return { error: "Nome do fornecedor e obrigatorio." };
  }

  await prisma.provider.update({
    where: { id, tenantId },
    data: { name: name.trim(), cnpj, phone, email, contactPerson },
  });

  revalidatePath("/admin/fornecedores");
  return { success: true };
}

export async function toggleProviderActive(id: string) {
  const { tenantId } = await checkPermission("provider.edit");

  const provider = await prisma.provider.findFirst({
    where: { id, tenantId },
  });

  if (!provider) return { error: "Fornecedor nao encontrado." };

  await prisma.provider.update({
    where: { id, tenantId },
    data: { active: !provider.active },
  });

  revalidatePath("/admin/fornecedores");
  return { success: true };
}
