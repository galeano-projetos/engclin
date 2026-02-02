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
      equipment: { select: { name: true, patrimony: true, id: true } },
      providerRef: { select: { name: true } },
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
    />
  );
}
