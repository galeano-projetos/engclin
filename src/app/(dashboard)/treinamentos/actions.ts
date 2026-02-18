"use server";

import { prisma } from "@/lib/db";
import { checkPermission } from "@/lib/auth/require-role";
import { revalidatePath } from "next/cache";

// ============================================================
// Criar treinamento (MASTER)
// ============================================================

export async function createTraining(formData: FormData) {
  const { tenantId } = await checkPermission("training.create");

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const equipmentTypeId =
    (formData.get("equipmentTypeId") as string)?.trim() || null;
  const videoUrl = (formData.get("videoUrl") as string)?.trim() || null;
  const validityMonths = parseInt(
    (formData.get("validityMonths") as string) || "12",
    10
  );

  if (!title) {
    return { error: "Titulo e obrigatorio." };
  }

  await prisma.training.create({
    data: {
      tenantId,
      title,
      description,
      equipmentTypeId: equipmentTypeId || null,
      videoUrl,
      validityMonths: isNaN(validityMonths) ? 12 : validityMonths,
    },
  });

  revalidatePath("/treinamentos");
  return { success: true };
}

// ============================================================
// Deletar treinamento (MASTER)
// ============================================================

export async function deleteTraining(id: string) {
  const { tenantId } = await checkPermission("training.create");

  await prisma.training.deleteMany({
    where: { id, tenantId },
  });

  revalidatePath("/treinamentos");
  return { success: true };
}

// ============================================================
// Marcar como concluido (MASTER/TECNICO)
// ============================================================

export async function completeTraining(trainingId: string) {
  const { tenantId, userId } = await checkPermission("training.complete");

  // Verificar que o treinamento pertence ao tenant
  const training = await prisma.training.findFirst({
    where: { id: trainingId, tenantId },
  });

  if (!training) {
    return { error: "Treinamento nao encontrado." };
  }

  // Upsert: se ja completou, atualiza a data
  await prisma.trainingCompletion.upsert({
    where: {
      trainingId_userId: { trainingId, userId },
    },
    create: {
      tenantId,
      trainingId,
      userId,
      completedAt: new Date(),
    },
    update: {
      completedAt: new Date(),
    },
  });

  revalidatePath(`/treinamentos/${trainingId}`);
  revalidatePath("/treinamentos");
  revalidatePath("/perfil");
  return { success: true };
}
