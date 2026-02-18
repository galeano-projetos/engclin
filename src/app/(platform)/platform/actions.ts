"use server";

import { prisma } from "@/lib/db";
import { checkPlatformAdmin } from "@/lib/auth/require-role";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { emailSchema, passwordSchema } from "@/lib/validation";
import { z } from "zod";

const cnpjSchema = z.string().min(14, "CNPJ deve ter no minimo 14 caracteres").max(18);
const planSchema = z.enum(["ESSENCIAL", "PROFISSIONAL", "ENTERPRISE"]);

// ============================================================
// Dashboard stats
// ============================================================

export async function getPlatformStats() {
  await checkPlatformAdmin();

  const [totalTenants, activeTenants, totalUsers, totalEquipments, recentTenants] =
    await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { active: true } }),
      prisma.user.count({ where: { role: { not: "PLATFORM_ADMIN" } } }),
      prisma.equipment.count(),
      prisma.tenant.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          _count: { select: { users: true, equipments: true } },
        },
      }),
    ]);

  return { totalTenants, activeTenants, totalUsers, totalEquipments, recentTenants };
}

// ============================================================
// Listar tenants
// ============================================================

export async function listTenants() {
  await checkPlatformAdmin();

  return prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { users: true, equipments: true } },
    },
  });
}

// ============================================================
// Detalhe do tenant
// ============================================================

export async function getTenantDetail(tenantId: string) {
  await checkPlatformAdmin();

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      users: {
        orderBy: [{ active: "desc" }, { name: "asc" }],
        select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
      },
      _count: { select: { equipments: true, units: true } },
    },
  });

  if (!tenant) {
    throw new Error("Tenant nao encontrado");
  }

  return tenant;
}

// ============================================================
// Criar tenant + MASTER
// ============================================================

export async function createTenant(formData: FormData) {
  await checkPlatformAdmin();

  const name = (formData.get("name") as string)?.trim();
  const cnpj = (formData.get("cnpj") as string)?.trim();
  const plan = formData.get("plan") as string;
  const masterName = (formData.get("masterName") as string)?.trim();
  const masterEmail = (formData.get("masterEmail") as string)?.trim();
  const masterPassword = formData.get("masterPassword") as string;

  if (!name) return { error: "Nome do hospital/clinica e obrigatorio" };

  const cnpjResult = cnpjSchema.safeParse(cnpj);
  if (!cnpjResult.success) return { error: "CNPJ invalido" };

  const planResult = planSchema.safeParse(plan);
  if (!planResult.success) return { error: "Plano invalido" };

  if (!masterName) return { error: "Nome do usuario MASTER e obrigatorio" };

  const emailResult = emailSchema.safeParse(masterEmail);
  if (!emailResult.success) return { error: "Email do MASTER invalido" };

  const passwordResult = passwordSchema.safeParse(masterPassword);
  if (!passwordResult.success) return { error: passwordResult.error.issues[0].message };

  // Normalize CNPJ to digits only for consistent comparison
  const normalizedCnpj = cnpj.replace(/\D/g, "");

  // Check duplicates
  const existingCnpj = await prisma.tenant.findFirst({
    where: { cnpj: normalizedCnpj },
  });
  if (existingCnpj) return { error: "Ja existe um tenant com este CNPJ" };

  const existingEmail = await prisma.user.findUnique({ where: { email: masterEmail.toLowerCase() } });
  if (existingEmail) return { error: "Este email ja esta cadastrado" };

  const hashedPassword = await hash(masterPassword, 10);

  await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name,
        cnpj: normalizedCnpj,
        plan: planResult.data,
      },
    });

    await tx.user.create({
      data: {
        tenantId: tenant.id,
        name: masterName,
        email: masterEmail.toLowerCase(),
        password: hashedPassword,
        role: "MASTER",
      },
    });
  });

  revalidatePath("/platform/tenants");
  revalidatePath("/platform");
  return { success: true };
}

// ============================================================
// Toggle tenant ativo/inativo
// ============================================================

export async function toggleTenantActive(tenantId: string) {
  await checkPlatformAdmin();

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return { error: "Tenant nao encontrado" };

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { active: !tenant.active },
  });

  revalidatePath("/platform/tenants");
  revalidatePath(`/platform/tenants/${tenantId}`);
  revalidatePath("/platform");
  return { success: true };
}

// ============================================================
// Atualizar plano do tenant
// ============================================================

export async function updateTenantPlan(tenantId: string, plan: string) {
  await checkPlatformAdmin();

  const planResult = planSchema.safeParse(plan);
  if (!planResult.success) return { error: "Plano invalido" };

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { plan: planResult.data },
  });

  revalidatePath(`/platform/tenants/${tenantId}`);
  revalidatePath("/platform/tenants");
  return { success: true };
}

// ============================================================
// Atualizar dados do tenant
// ============================================================

export async function updateTenant(tenantId: string, formData: FormData) {
  await checkPlatformAdmin();

  const name = (formData.get("name") as string)?.trim();
  const cnpj = (formData.get("cnpj") as string)?.trim();
  const plan = formData.get("plan") as string;

  if (!name) return { error: "Nome e obrigatorio" };

  const cnpjResult = cnpjSchema.safeParse(cnpj);
  if (!cnpjResult.success) return { error: "CNPJ invalido" };

  const planResult = planSchema.safeParse(plan);
  if (!planResult.success) return { error: "Plano invalido" };

  // Normalize CNPJ to digits only
  const normalizedCnpj = cnpj.replace(/\D/g, "");

  // Check CNPJ uniqueness (exclude current tenant)
  const existingCnpj = await prisma.tenant.findFirst({
    where: { cnpj: normalizedCnpj, id: { not: tenantId } },
  });
  if (existingCnpj) return { error: "Ja existe outro tenant com este CNPJ" };

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { name, cnpj: normalizedCnpj, plan: planResult.data },
  });

  revalidatePath(`/platform/tenants/${tenantId}`);
  revalidatePath("/platform/tenants");
  revalidatePath("/platform");
  return { success: true };
}
