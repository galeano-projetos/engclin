"use server";

import { prisma } from "@/lib/db";
import { checkPermission } from "@/lib/auth/require-role";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createNonConformity(_prevState: { error: string } | undefined, formData: FormData) {
  const { tenantId, userId } = await checkPermission("ticket.create");

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const source = formData.get("source") as string;
  const severity = formData.get("severity") as string;

  if (!title || !description || !source || !severity) {
    return { error: "Todos os campos obrigatorios devem ser preenchidos." };
  }

  const nc = await prisma.nonConformity.create({
    data: {
      tenantId,
      title,
      description,
      source: source as any,
      severity: severity as any,
      identifiedBy: userId,
      status: "ABERTA",
    },
  });

  await logAudit({ tenantId, userId, action: "CREATE", entity: "non_conformity", entityId: nc.id });
  revalidatePath("/melhoria");
  redirect("/melhoria");
}

export async function createImprovementAction(formData: FormData) {
  const { tenantId, userId } = await checkPermission("ticket.create");

  const nonConformityId = (formData.get("nonConformityId") as string)?.trim() || null;
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const responsibleId = (formData.get("responsibleId") as string)?.trim();
  const deadline = formData.get("deadline") as string;
  const phase = (formData.get("phase") as string) || "PLAN";

  if (!title || !description || !responsibleId || !deadline) {
    return { error: "Todos os campos obrigatorios devem ser preenchidos." };
  }

  const action = await prisma.improvementAction.create({
    data: {
      tenantId,
      nonConformityId: nonConformityId || null,
      title,
      description,
      phase: phase as any,
      responsibleId,
      deadline: new Date(deadline),
      status: "PENDENTE",
    },
  });

  await logAudit({ tenantId, userId, action: "CREATE", entity: "improvement_action", entityId: action.id });
  revalidatePath("/melhoria");
}

export async function updateImprovementAction(id: string, formData: FormData) {
  const { tenantId, userId } = await checkPermission("ticket.resolve");

  const status = formData.get("status") as string;
  const phase = formData.get("phase") as string;
  const verificationNotes = (formData.get("verificationNotes") as string)?.trim() || undefined;

  const isCompleted = status === "CONCLUIDA";
  const isVerified = status === "VERIFICADA";

  await prisma.improvementAction.update({
    where: { id, tenantId },
    data: {
      status: status as any,
      phase: phase as any,
      ...(isCompleted ? { completedAt: new Date() } : {}),
      ...(isVerified ? { verifiedBy: userId, verifiedAt: new Date(), verificationNotes } : {}),
    },
  });

  await logAudit({ tenantId, userId, action: "UPDATE", entity: "improvement_action", entityId: id });
  revalidatePath("/melhoria");
}

export async function updateNonConformityStatus(id: string, formData: FormData) {
  const { tenantId, userId } = await checkPermission("ticket.resolve");

  const status = formData.get("status") as string;
  const rootCause = (formData.get("rootCause") as string)?.trim() || undefined;
  const isClosed = status === "FECHADA";

  await prisma.nonConformity.update({
    where: { id, tenantId },
    data: {
      status: status as any,
      rootCause,
      ...(isClosed ? { closedAt: new Date(), closedBy: userId } : {}),
    },
  });

  await logAudit({ tenantId, userId, action: "UPDATE", entity: "non_conformity", entityId: id });
  revalidatePath("/melhoria");
}
