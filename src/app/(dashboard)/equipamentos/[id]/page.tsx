import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require-role";
import { hasPermission } from "@/lib/auth/permissions";
import { ServiceType } from "@prisma/client";
import { notFound } from "next/navigation";
import { EquipmentDetails } from "./equipment-details";
import { ServiceStatusSummary } from "./service-status-summary";

interface PageProps {
  params: Promise<{ id: string }>;
}

function computeServiceStatus(
  dueDate: Date | null,
  now: Date
): "ok" | "warning" | "overdue" | "na" {
  if (!dueDate) return "na";
  const diff = Math.ceil(
    (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff < 0) return "overdue";
  if (diff <= 30) return "warning";
  return "ok";
}

export default async function EquipamentoDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { tenantId, role } = await requirePermission("equipment.view");

  const equipment = await prisma.equipment.findFirst({
    where: { id, tenantId },
    include: {
      unit: true,
      equipmentType: { select: { id: true, name: true } },
    },
  });

  if (!equipment) {
    notFound();
  }

  const [units, equipmentTypes] = await Promise.all([
    prisma.unit.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    }),
    prisma.equipmentType.findMany({
      where: { tenantId },
      select: { id: true, name: true, defaultCriticality: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Build service status for each service type
  const now = new Date();
  const serviceTypes: { type: ServiceType; label: string }[] = [
    { type: "PREVENTIVA", label: "Preventiva" },
    { type: "CALIBRACAO", label: "Calibracao" },
    { type: "TSE", label: "Teste Seg. Eletrica" },
  ];

  const services = await Promise.all(
    serviceTypes.map(async ({ type, label }) => {
      // Last executed
      const lastExecuted = await prisma.preventiveMaintenance.findFirst({
        where: {
          equipmentId: id,
          tenantId,
          serviceType: type,
          status: "REALIZADA",
        },
        orderBy: { executionDate: "desc" },
        select: {
          executionDate: true,
          providerRef: { select: { name: true } },
          provider: true,
        },
      });

      // Next scheduled
      const nextScheduled = await prisma.preventiveMaintenance.findFirst({
        where: {
          equipmentId: id,
          tenantId,
          serviceType: type,
          status: "AGENDADA",
        },
        orderBy: { dueDate: "asc" },
        select: {
          id: true,
          dueDate: true,
          providerRef: { select: { name: true } },
          provider: true,
        },
      });

      const providerName =
        nextScheduled?.providerRef?.name ||
        nextScheduled?.provider ||
        lastExecuted?.providerRef?.name ||
        lastExecuted?.provider ||
        null;

      return {
        serviceType: type,
        label,
        lastExecution: lastExecuted?.executionDate
          ? lastExecuted.executionDate.toLocaleDateString("pt-BR")
          : null,
        nextDue: nextScheduled?.dueDate
          ? nextScheduled.dueDate.toLocaleDateString("pt-BR")
          : null,
        providerName,
        status: computeServiceStatus(nextScheduled?.dueDate || null, now),
        maintenanceId: nextScheduled?.id || null,
      };
    })
  );

  return (
    <>
      <EquipmentDetails
        equipment={{
          ...equipment,
          acquisitionValue: equipment.acquisitionValue ? Number(equipment.acquisitionValue) : null,
          acquisitionDate: equipment.acquisitionDate
            ? equipment.acquisitionDate.toISOString()
            : null,
          createdAt: equipment.createdAt.toISOString(),
          updatedAt: equipment.updatedAt.toISOString(),
          unitName: equipment.unit.name,
          equipmentTypeId: equipment.equipmentTypeId,
          equipmentTypeName: equipment.equipmentType?.name || null,
          ownershipType: equipment.ownershipType,
          loanProvider: equipment.loanProvider,
        }}
        units={units}
        equipmentTypes={equipmentTypes}
        canEdit={hasPermission(role, "equipment.edit")}
        canDelete={hasPermission(role, "equipment.delete")}
      />
      <ServiceStatusSummary services={services} />
    </>
  );
}
