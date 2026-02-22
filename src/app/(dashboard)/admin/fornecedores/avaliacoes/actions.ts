"use server";

import { prisma } from "@/lib/db";
import { checkPermission } from "@/lib/auth/require-role";
import { revalidatePath } from "next/cache";

export async function createProviderEvaluation(formData: FormData) {
  const { tenantId, userId } = await checkPermission("provider.edit");

  const providerId = formData.get("providerId") as string;
  const period = formData.get("period") as string;
  const qualityScore = parseInt(formData.get("qualityScore") as string);
  const timelinessScore = parseInt(formData.get("timelinessScore") as string);
  const costScore = parseInt(formData.get("costScore") as string);
  const communicationScore = parseInt(formData.get("communicationScore") as string);
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!providerId || !period) {
    return { error: "Fornecedor e periodo sao obrigatorios." };
  }

  const scores = [qualityScore, timelinessScore, costScore, communicationScore];
  if (scores.some(s => isNaN(s) || s < 1 || s > 5)) {
    return { error: "Notas devem ser entre 1 e 5." };
  }

  const provider = await prisma.provider.findFirst({
    where: { id: providerId, tenantId },
  });
  if (!provider) return { error: "Fornecedor nao encontrado." };

  const overallScore = scores.reduce((a, b) => a + b, 0) / 4;

  await prisma.providerEvaluation.create({
    data: {
      tenantId,
      providerId,
      evaluatedBy: userId,
      period,
      qualityScore,
      timelinessScore,
      costScore,
      communicationScore,
      overallScore,
      notes,
    },
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function getProviderEvaluations(tenantId: string, providerId?: string) {
  return prisma.providerEvaluation.findMany({
    where: { tenantId, ...(providerId ? { providerId } : {}) },
    include: {
      provider: { select: { name: true } },
      evaluator: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
