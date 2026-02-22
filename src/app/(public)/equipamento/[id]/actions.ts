"use server";

import { prisma } from "@/lib/db";
import { createServiceOrderInTx } from "@/lib/service-order";
import { checkRateLimit } from "@/lib/rate-limit";

export async function reportPublicProblem(formData: FormData) {
  const equipmentId = formData.get("equipmentId") as string;

  const rl = checkRateLimit({ key: `public-report:${equipmentId}`, limit: 5, windowSeconds: 3600 });
  if (!rl.allowed) {
    return { error: "Muitas tentativas. Aguarde antes de reportar novamente." };
  }

  const reporterName = (formData.get("reporterName") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || "";

  if (!equipmentId || !reporterName || !description) {
    return { error: "Nome e descrição do problema são obrigatórios." };
  }

  if (reporterName.length < 2) {
    return { error: "Informe seu nome completo." };
  }

  if (description.length < 10) {
    return { error: "Descreva o problema com mais detalhes (mínimo 10 caracteres)." };
  }

  const equipment = await prisma.equipment.findUnique({
    where: { id: equipmentId },
    select: { id: true, tenantId: true, status: true, criticality: true },
  });

  if (!equipment) {
    return { error: "Equipamento não encontrado." };
  }

  // Find the tenant's MASTER user to use as openedById (required by schema)
  const masterUser = await prisma.user.findFirst({
    where: { tenantId: equipment.tenantId, role: "MASTER", active: true },
    select: { id: true },
  });

  if (!masterUser) {
    return { error: "Não foi possível registrar o problema. Contate a equipe técnica." };
  }

  const contactInfo = phone ? `${reporterName} (${phone})` : reporterName;
  const fullDescription = `[Reporte Público] ${contactInfo}\n\n${description}`;

  // Calcular SLA baseado na criticidade do equipamento
  const now = new Date();
  const slaMinutes = { A: 10, B: 120, C: 1440 };
  const slaDeadline = new Date(now.getTime() + slaMinutes[equipment.criticality] * 60_000);

  await prisma.$transaction(async (tx) => {
    const ticket = await tx.correctiveMaintenance.create({
      data: {
        tenantId: equipment.tenantId,
        equipmentId: equipment.id,
        openedById: masterUser.id,
        description: fullDescription,
        urgency: "MEDIA",
        status: "ABERTO",
        slaDeadline,
      },
    });

    await tx.equipment.update({
      where: { id: equipment.id },
      data: { status: "EM_MANUTENCAO" },
    });

    await createServiceOrderInTx(tx, equipment.tenantId, {
      correctiveMaintenanceId: ticket.id,
    });
  });

  return { success: true };
}
