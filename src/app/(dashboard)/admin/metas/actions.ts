"use server";

import { prisma } from "@/lib/db";
import { checkPermission } from "@/lib/auth/require-role";
import { revalidatePath } from "next/cache";

export async function saveKpiTarget(formData: FormData) {
  const { tenantId } = await checkPermission("admin.units");

  const indicator = formData.get("indicator") as string;
  const targetValue = parseFloat(formData.get("targetValue") as string);
  const unit = (formData.get("unit") as string) || "%";
  const year = parseInt(formData.get("year") as string) || new Date().getFullYear();

  if (!indicator || isNaN(targetValue)) {
    return { error: "Indicador e valor da meta sao obrigatorios." };
  }

  const existing = await prisma.kpiTarget.findFirst({
    where: { tenantId, indicator, year, month: null },
  });

  if (existing) {
    await prisma.kpiTarget.update({
      where: { id: existing.id },
      data: { targetValue, unit },
    });
  } else {
    await prisma.kpiTarget.create({
      data: { tenantId, indicator, targetValue, unit, year },
    });
  }

  revalidatePath("/admin/metas");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getKpiTargets(tenantId: string, year?: number) {
  const targetYear = year || new Date().getFullYear();
  return prisma.kpiTarget.findMany({
    where: { tenantId, year: targetYear },
    orderBy: { indicator: "asc" },
  });
}
