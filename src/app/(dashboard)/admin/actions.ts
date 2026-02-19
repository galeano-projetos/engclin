"use server";

import { prisma } from "@/lib/db";
import { checkPermission } from "@/lib/auth/require-role";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { userRoleSchema, emailSchema, passwordSchema } from "@/lib/validation";

// ============================================================
// Gestao de Unidades
// ============================================================

export async function createUnit(formData: FormData) {
  const { tenantId } = await checkPermission("admin.units");
  const name = formData.get("name") as string;

  if (!name?.trim()) {
    return { error: "Nome da unidade e obrigatorio" };
  }

  await prisma.unit.create({
    data: { tenantId, name: name.trim() },
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteUnit(unitId: string) {
  const { tenantId } = await checkPermission("admin.units");

  // Verificar se ha equipamentos vinculados
  const equipCount = await prisma.equipment.count({
    where: { unitId, tenantId },
  });

  if (equipCount > 0) {
    return {
      error: `Esta unidade possui ${equipCount} equipamento(s) vinculado(s). Transfira-os antes de excluir.`,
    };
  }

  await prisma.unit.delete({ where: { id: unitId, tenantId } });
  revalidatePath("/admin");
  return { success: true };
}

// ============================================================
// Gestao de Usuarios
// ============================================================

export async function createUser(formData: FormData) {
  const { tenantId } = await checkPermission("admin.users");

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;
  const specialty = (formData.get("specialty") as string)?.trim() || undefined;

  if (!name?.trim() || !email?.trim() || !password?.trim() || !role) {
    return { error: "Todos os campos sao obrigatorios" };
  }

  const roleResult = userRoleSchema.safeParse(role);
  if (!roleResult.success) {
    return { error: "Perfil invalido." };
  }

  if (roleResult.data === "PLATFORM_ADMIN") {
    return { error: "Nao e permitido criar usuario PLATFORM_ADMIN pelo painel do tenant." };
  }

  const emailResult = emailSchema.safeParse(email);
  if (!emailResult.success) {
    return { error: "Email invalido." };
  }

  const passwordResult = passwordSchema.safeParse(password);
  if (!passwordResult.success) {
    return { error: passwordResult.error.issues[0].message };
  }

  // Verificar se email ja existe
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Este e-mail ja esta cadastrado" };
  }

  const hashedPassword = await hash(password, 10);

  await prisma.user.create({
    data: {
      tenantId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: roleResult.data,
      specialty,
    },
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function toggleUserActive(userId: string) {
  const { tenantId } = await checkPermission("admin.users");

  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId },
  });

  if (!user) {
    return { error: "Usuario nao encontrado" };
  }

  if (user.active && user.role === "MASTER") {
    const masterCount = await prisma.user.count({
      where: { tenantId, role: "MASTER", active: true },
    });
    if (masterCount <= 1) {
      return { error: "Nao e possivel desativar o ultimo usuario MASTER." };
    }
  }

  await prisma.user.update({
    where: { id: userId, tenantId },
    data: { active: !user.active },
  });

  revalidatePath("/admin");
  return { success: true };
}

// ============================================================
// Dados para a pagina de admin
// ============================================================

export async function getAdminData() {
  const { tenantId } = await checkPermission("admin.users");

  const [units, users, tenant] = await Promise.all([
    prisma.unit.findMany({
      where: { tenantId },
      include: { _count: { select: { equipments: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { tenantId },
      orderBy: [{ active: "desc" }, { name: "asc" }],
    }),
    prisma.tenant.findUnique({
      where: { id: tenantId },
    }),
  ]);

  return { units, users, tenant };
}
