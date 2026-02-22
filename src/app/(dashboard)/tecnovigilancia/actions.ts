"use server";

import { prisma } from "@/lib/db";
import { checkPermission } from "@/lib/auth/require-role";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createAdverseEvent(_prevState: { error: string } | undefined, formData: FormData) {
  const { tenantId, userId } = await checkPermission("ticket.create");

  const equipmentId = (formData.get("equipmentId") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const eventDateStr = formData.get("eventDate") as string;
  const severity = formData.get("severity") as string;
  const eventType = formData.get("eventType") as string;

  if (!equipmentId || !description || !eventDateStr || !severity || !eventType) {
    return { error: "Todos os campos obrigatorios devem ser preenchidos." };
  }

  const equipment = await prisma.equipment.findFirst({
    where: { id: equipmentId, tenantId },
  });
  if (!equipment) return { error: "Equipamento nao encontrado." };

  const event = await prisma.adverseEvent.create({
    data: {
      tenantId,
      equipmentId,
      reportedBy: userId,
      eventDate: new Date(eventDateStr),
      description,
      severity: severity as any,
      eventType: eventType as any,
      status: "ABERTO",
    },
  });

  await logAudit({ tenantId, userId, action: "CREATE", entity: "adverse_event", entityId: event.id });
  revalidatePath("/tecnovigilancia");
  redirect("/tecnovigilancia");
}

export async function updateAdverseEvent(id: string, formData: FormData) {
  const { tenantId, userId } = await checkPermission("ticket.resolve");

  const status = formData.get("status") as string;
  const investigation = (formData.get("investigation") as string)?.trim() || undefined;
  const rootCause = (formData.get("rootCause") as string)?.trim() || undefined;
  const correctiveAction = (formData.get("correctiveAction") as string)?.trim() || undefined;
  const anvisaNotified = formData.get("anvisaNotified") === "true";
  const anvisaProtocol = (formData.get("anvisaProtocol") as string)?.trim() || undefined;

  const isClosed = status === "RESOLVIDO" || status === "FECHADO";

  await prisma.adverseEvent.update({
    where: { id, tenantId },
    data: {
      status: status as any,
      investigation,
      rootCause,
      correctiveAction,
      anvisaNotified,
      anvisaProtocol,
      ...(isClosed ? { closedAt: new Date(), closedBy: userId } : {}),
    },
  });

  await logAudit({ tenantId, userId, action: "UPDATE", entity: "adverse_event", entityId: id });
  revalidatePath("/tecnovigilancia");
  revalidatePath(`/tecnovigilancia/${id}`);
}
