"use server";

import { prisma } from "@/lib/db";
import { checkPlatformAdmin } from "@/lib/auth/require-role";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import crypto from "crypto";
import { emailSchema, passwordSchema } from "@/lib/validation";
import { sendPasswordResetEmail } from "@/lib/email";
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

  if (!name) return { error: "Nome da empresa e obrigatorio" };

  const cnpjResult = cnpjSchema.safeParse(cnpj);
  if (!cnpjResult.success) return { error: "CNPJ invalido" };

  const planResult = planSchema.safeParse(plan);
  if (!planResult.success) return { error: "Plano invalido" };

  if (!masterName) return { error: "Nome do usuario MASTER e obrigatorio" };

  const emailResult = emailSchema.safeParse(masterEmail);
  if (!emailResult.success) return { error: "Email do MASTER invalido" };

  const passwordResult = passwordSchema.safeParse(masterPassword);
  if (!passwordResult.success) return { error: passwordResult.error.issues[0].message };

  // Campos do cartao CNPJ (opcionais)
  const razaoSocial = (formData.get("razaoSocial") as string)?.trim() || null;
  const nomeFantasia = (formData.get("nomeFantasia") as string)?.trim() || null;
  const logradouro = (formData.get("logradouro") as string)?.trim() || null;
  const numero = (formData.get("numero") as string)?.trim() || null;
  const complemento = (formData.get("complemento") as string)?.trim() || null;
  const bairro = (formData.get("bairro") as string)?.trim() || null;
  const cidade = (formData.get("cidade") as string)?.trim() || null;
  const uf = (formData.get("uf") as string)?.trim() || null;
  const cep = (formData.get("cep") as string)?.trim() || null;
  const telefone = (formData.get("telefone") as string)?.trim() || null;
  const emailEmpresa = (formData.get("emailEmpresa") as string)?.trim() || null;
  const atividadePrincipal = (formData.get("atividadePrincipal") as string)?.trim() || null;

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
        razaoSocial,
        nomeFantasia,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        uf,
        cep,
        telefone,
        email: emailEmpresa,
        atividadePrincipal,
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
// Excluir tenant e todos os dados relacionados
// ============================================================

export async function deleteTenant(tenantId: string) {
  await checkPlatformAdmin();

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return { error: "Tenant nao encontrado" };

  // onDelete: Cascade no schema cuida de deletar users, equipments, etc.
  await prisma.tenant.delete({ where: { id: tenantId } });

  revalidatePath("/platform/tenants");
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

  // Campos do cartao CNPJ (opcionais)
  const razaoSocial = (formData.get("razaoSocial") as string)?.trim() || null;
  const nomeFantasia = (formData.get("nomeFantasia") as string)?.trim() || null;
  const logradouro = (formData.get("logradouro") as string)?.trim() || null;
  const numero = (formData.get("numero") as string)?.trim() || null;
  const complemento = (formData.get("complemento") as string)?.trim() || null;
  const bairro = (formData.get("bairro") as string)?.trim() || null;
  const cidade = (formData.get("cidade") as string)?.trim() || null;
  const uf = (formData.get("uf") as string)?.trim() || null;
  const cep = (formData.get("cep") as string)?.trim() || null;
  const telefone = (formData.get("telefone") as string)?.trim() || null;
  const emailEmpresa = (formData.get("emailEmpresa") as string)?.trim() || null;
  const atividadePrincipal = (formData.get("atividadePrincipal") as string)?.trim() || null;

  // Normalize CNPJ to digits only
  const normalizedCnpj = cnpj.replace(/\D/g, "");

  // Check CNPJ uniqueness (exclude current tenant)
  const existingCnpj = await prisma.tenant.findFirst({
    where: { cnpj: normalizedCnpj, id: { not: tenantId } },
  });
  if (existingCnpj) return { error: "Ja existe outro tenant com este CNPJ" };

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      name,
      cnpj: normalizedCnpj,
      plan: planResult.data,
      razaoSocial,
      nomeFantasia,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      uf,
      cep,
      telefone,
      email: emailEmpresa,
      atividadePrincipal,
    },
  });

  revalidatePath(`/platform/tenants/${tenantId}`);
  revalidatePath("/platform/tenants");
  revalidatePath("/platform");
  return { success: true };
}

// ============================================================
// Redefinir senha de um usuario (gera senha provisoria)
// ============================================================

const roleSchema = z.enum(["MASTER", "TECNICO", "COORDENADOR", "FISCAL"]);

function generateRandomPassword(): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const special = "!@#$%&*";
  const all = upper + lower + digits + special;

  // Garantir ao menos 1 de cada tipo
  let password =
    upper[Math.floor(Math.random() * upper.length)] +
    lower[Math.floor(Math.random() * lower.length)] +
    digits[Math.floor(Math.random() * digits.length)] +
    special[Math.floor(Math.random() * special.length)];

  for (let i = password.length; i < 12; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Embaralhar
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

export async function resetUserPassword(userId: string) {
  await checkPlatformAdmin();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Usuário não encontrado" };

  const newPassword = generateRandomPassword();
  const hashedPassword = await hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword, mustChangePassword: true },
  });

  // Send password reset email (failure does not block the operation)
  try {
    await prisma.passwordResetToken.deleteMany({ where: { email: user.email } });

    const rawToken = crypto.randomUUID();
    const hashedToken = await hash(rawToken, 10);

    await prisma.passwordResetToken.create({
      data: {
        email: user.email,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    const baseUrl = process.env.AUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

    await sendPasswordResetEmail(user.email, resetUrl);
  } catch {
    // Email failure should not block the password reset
  }

  return { success: true, temporaryPassword: newPassword };
}

// ============================================================
// Toggle usuario ativo/inativo (pela plataforma)
// ============================================================

export async function toggleUserActiveFromPlatform(userId: string) {
  await checkPlatformAdmin();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Usuário não encontrado" };

  await prisma.user.update({
    where: { id: userId },
    data: { active: !user.active },
  });

  const tenantId = user.tenantId;
  if (tenantId) {
    revalidatePath(`/platform/tenants/${tenantId}`);
  }
  revalidatePath("/platform/tenants");
  return { success: true };
}

// ============================================================
// Criar usuario para um tenant (pela plataforma)
// ============================================================

export async function createUserForTenant(tenantId: string, formData: FormData) {
  await checkPlatformAdmin();

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;

  if (!name) return { error: "Nome é obrigatório" };

  const emailResult = emailSchema.safeParse(email);
  if (!emailResult.success) return { error: "Email inválido" };

  const passwordResult = passwordSchema.safeParse(password);
  if (!passwordResult.success) return { error: passwordResult.error.issues[0].message };

  const roleResult = roleSchema.safeParse(role);
  if (!roleResult.success) return { error: "Perfil inválido" };

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return { error: "Tenant não encontrado" };

  const existingEmail = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existingEmail) return { error: "Este email já está cadastrado" };

  const hashedPassword = await hash(password, 10);

  await prisma.user.create({
    data: {
      tenantId,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: roleResult.data,
    },
  });

  revalidatePath(`/platform/tenants/${tenantId}`);
  revalidatePath("/platform/tenants");
  revalidatePath("/platform");
  return { success: true };
}
