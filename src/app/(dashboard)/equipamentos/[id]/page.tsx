import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require-role";
import { hasPermission } from "@/lib/auth/permissions";
import { MedicalPhysicsType, ServiceType } from "@prisma/client";
import { planAllows, getAllowedServiceTypes } from "@/lib/auth/plan-features";
import { notFound } from "next/navigation";
import { EquipmentDetails } from "./equipment-details";
import { ServiceStatusSummary } from "./service-status-summary";
import { PhysicsTestStatusSummary } from "./physics-test-status-summary";
import { MtbfMttrSummary } from "./mtbf-mttr-summary";
import { DepreciationSection } from "./depreciation-section";
import { computeEquipmentMtbfMttr } from "@/lib/mtbf-mttr";
import { computeDepreciation } from "@/lib/depreciation";

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
  const { tenantId, role, plan } = await requirePermission("equipment.view");
  const showQrCode = planAllows(plan, "qrcode.view");
  const allowedServiceTypes = getAllowedServiceTypes(plan);
  const showPhysics = planAllows(plan, "physics.view");

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

  const [units, equipmentTypes, closedTickets] = await Promise.all([
    prisma.unit.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    }),
    prisma.equipmentType.findMany({
      where: { tenantId },
      select: { id: true, name: true, defaultCriticality: true },
      orderBy: { name: "asc" },
    }),
    prisma.correctiveMaintenance.findMany({
      where: { equipmentId: id, tenantId, closedAt: { not: null } },
      select: { equipmentId: true, openedAt: true, closedAt: true },
      orderBy: { openedAt: "asc" },
    }),
  ]);

  const mtbfMttr = computeEquipmentMtbfMttr(
    closedTickets.map((t) => ({
      equipmentId: t.equipmentId,
      openedAt: t.openedAt,
      closedAt: t.closedAt!,
    }))
  );

  // Depreciacao (Enterprise only)
  const showDepreciation = planAllows(plan, "depreciation.view");
  let depreciationData = null;
  if (showDepreciation && equipment.acquisitionValue && equipment.acquisitionDate) {
    depreciationData = computeDepreciation({
      acquisitionValue: Number(equipment.acquisitionValue),
      acquisitionDate: equipment.acquisitionDate,
      vidaUtilAnos: equipment.vidaUtilAnos ?? 10,
      metodoDepreciacao: equipment.metodoDepreciacao,
      valorResidual: equipment.valorResidual ? Number(equipment.valorResidual) : 0,
    });
  }

  // Build physics test status for each test type
  const now = new Date();

  const physicsTestTypes: { type: MedicalPhysicsType; label: string }[] = [
    { type: "CONTROLE_QUALIDADE", label: "Controle de Qualidade" },
    { type: "TESTE_CONSTANCIA", label: "Teste de Constância" },
    { type: "LEVANTAMENTO_RADIOMETRICO", label: "Levantamento Radiométrico" },
    { type: "TESTE_RADIACAO_FUGA", label: "Radiação de Fuga" },
  ];

  const physicsTests = await Promise.all(
    physicsTestTypes.map(async ({ type, label }) => {
      const lastExecuted = await prisma.medicalPhysicsTest.findFirst({
        where: { equipmentId: id, tenantId, type, status: "REALIZADA" },
        orderBy: { executionDate: "desc" },
        select: { executionDate: true, provider: true, providerRef: { select: { name: true } } },
      });

      const nextScheduled = await prisma.medicalPhysicsTest.findFirst({
        where: { equipmentId: id, tenantId, type, status: "AGENDADA" },
        orderBy: { dueDate: "asc" },
        select: { id: true, dueDate: true, provider: true, providerRef: { select: { name: true } } },
      });

      const providerName =
        nextScheduled?.providerRef?.name ||
        nextScheduled?.provider ||
        lastExecuted?.providerRef?.name ||
        lastExecuted?.provider ||
        null;

      return {
        testType: type,
        label,
        lastExecution: lastExecuted?.executionDate
          ? lastExecuted.executionDate.toLocaleDateString("pt-BR")
          : null,
        nextDue: nextScheduled?.dueDate
          ? nextScheduled.dueDate.toLocaleDateString("pt-BR")
          : null,
        providerName,
        status: computeServiceStatus(nextScheduled?.dueDate || null, now),
        testId: nextScheduled?.id || null,
      };
    })
  );

  // Only show physics section if equipment has any physics tests
  const hasPhysicsTests = physicsTests.some((t) => t.status !== "na");

  // Build service status for each service type (filtered by plan)
  const allServiceTypes: { type: ServiceType; label: string }[] = [
    { type: "PREVENTIVA", label: "Preventiva" },
    { type: "CALIBRACAO", label: "Calibracao" },
    { type: "TSE", label: "Teste Seg. Eletrica" },
  ];
  const serviceTypes = allServiceTypes.filter(s => allowedServiceTypes.includes(s.type));

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
          vidaUtilAnos: equipment.vidaUtilAnos,
          metodoDepreciacao: equipment.metodoDepreciacao,
          valorResidual: equipment.valorResidual ? Number(equipment.valorResidual) : null,
        }}
        units={units}
        equipmentTypes={equipmentTypes}
        canEdit={hasPermission(role, "equipment.edit")}
        canDelete={hasPermission(role, "equipment.delete")}
        showQrCode={showQrCode}
        plan={plan}
      />
      <DepreciationSection
        showDepreciation={showDepreciation}
        depreciationData={depreciationData}
        acquisitionValue={equipment.acquisitionValue ? Number(equipment.acquisitionValue) : null}
        metodoDepreciacao={equipment.metodoDepreciacao}
        vidaUtilAnos={equipment.vidaUtilAnos}
      />
      <ServiceStatusSummary services={services} />
      <MtbfMttrSummary
        mtbf={mtbfMttr.mtbf}
        mttr={mtbfMttr.mttr}
        ticketCount={mtbfMttr.ticketCount}
      />
      {showPhysics && hasPhysicsTests && <PhysicsTestStatusSummary tests={physicsTests} />}
    </>
  );
}
