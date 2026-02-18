import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require-role";
import { notFound } from "next/navigation";
import { PreventiveDetails } from "./preventive-details";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PreventiveDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { tenantId } = await requirePermission("preventive.view");

  const maintenance = await prisma.preventiveMaintenance.findFirst({
    where: { id, tenantId },
    include: {
      equipment: {
        select: {
          name: true,
          patrimony: true,
          id: true,
          equipmentType: {
            select: {
              checklistTemplates: {
                where: { active: true },
                include: { items: { orderBy: { order: "asc" } } },
              },
            },
          },
        },
      },
      providerRef: { select: { name: true } },
      checklistResults: {
        include: {
          template: { select: { name: true } },
          items: {
            include: { item: { select: { description: true } } },
            orderBy: { item: { order: "asc" } },
          },
        },
      },
    },
  });

  if (!maintenance) {
    notFound();
  }

  const now = new Date();
  let displayStatus = maintenance.status as string;
  if (maintenance.status === "AGENDADA" && maintenance.dueDate < now) {
    displayStatus = "VENCIDA";
  }

  const checklistTemplates = (
    maintenance.equipment.equipmentType?.checklistTemplates ?? []
  ).map((t) => ({
    id: t.id,
    name: t.name,
    items: t.items.map((i) => ({ id: i.id, description: i.description, order: i.order })),
  }));

  const checklistResults = maintenance.checklistResults.map((r) => ({
    id: r.id,
    templateName: r.template.name,
    completedAt: r.completedAt.toISOString(),
    items: r.items.map((ri) => ({
      description: ri.item.description,
      status: ri.status,
      observation: ri.observation,
    })),
  }));

  return (
    <PreventiveDetails
      maintenance={{
        id: maintenance.id,
        type: maintenance.type,
        serviceType: maintenance.serviceType,
        status: maintenance.status,
        displayStatus,
        scheduledDate: maintenance.scheduledDate.toISOString(),
        dueDate: maintenance.dueDate.toISOString(),
        executionDate: maintenance.executionDate?.toISOString() || null,
        periodicityMonths: maintenance.periodicityMonths,
        provider: maintenance.providerRef?.name || maintenance.provider,
        cost: maintenance.cost ? Number(maintenance.cost) : null,
        certificateUrl: maintenance.certificateUrl,
        notes: maintenance.notes,
        equipmentName: maintenance.equipment.name,
        equipmentId: maintenance.equipment.id,
        equipmentPatrimony: maintenance.equipment.patrimony,
      }}
      checklistTemplates={checklistTemplates}
      checklistResults={checklistResults}
    />
  );
}
