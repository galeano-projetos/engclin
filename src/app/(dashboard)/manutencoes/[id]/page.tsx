import { prisma } from "@/lib/db";
import { getTenantId } from "@/lib/tenant";
import { notFound } from "next/navigation";
import { PreventiveDetails } from "./preventive-details";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PreventiveDetailPage({ params }: PageProps) {
  const { id } = await params;
  const tenantId = await getTenantId();

  const maintenance = await prisma.preventiveMaintenance.findFirst({
    where: { id, tenantId },
    include: {
      equipment: { select: { name: true, patrimony: true, id: true } },
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
        status: maintenance.status,
        displayStatus,
        scheduledDate: maintenance.scheduledDate.toISOString(),
        dueDate: maintenance.dueDate.toISOString(),
        executionDate: maintenance.executionDate?.toISOString() || null,
        periodicityMonths: maintenance.periodicityMonths,
        provider: maintenance.provider,
        cost: maintenance.cost,
        certificateUrl: maintenance.certificateUrl,
        notes: maintenance.notes,
        equipmentName: maintenance.equipment.name,
        equipmentId: maintenance.equipment.id,
        equipmentPatrimony: maintenance.equipment.patrimony,
      }}
    />
  );
}
