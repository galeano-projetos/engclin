import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require-role";
import { hasPermission } from "@/lib/auth/permissions";
import { planAllows } from "@/lib/auth/plan-features";
import { PgtsPageClient } from "./pgts-page-client";

export default async function PgtsPage() {
  const { tenantId, role, plan } = await requirePermission("pgts.view");

  const canGenerate = hasPermission(role, "pgts.create") && planAllows(plan, "pgts.create");

  const [versions, tenant, equipmentCounts, maintenanceCounts, trainingCounts] =
    await Promise.all([
      prisma.pgtsVersion.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          version: true,
          fileName: true,
          createdAt: true,
          user: { select: { name: true } },
        },
      }),
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true, cnpj: true },
      }),
      Promise.all([
        prisma.equipment.count({ where: { tenantId } }),
        prisma.equipment.count({ where: { tenantId, criticality: "A" } }),
        prisma.equipment.count({ where: { tenantId, criticality: "B" } }),
        prisma.equipment.count({ where: { tenantId, criticality: "C" } }),
        prisma.equipment.count({ where: { tenantId, status: "ATIVO" } }),
      ]),
      Promise.all([
        prisma.preventiveMaintenance.count({ where: { tenantId, serviceType: "PREVENTIVA" } }),
        prisma.preventiveMaintenance.count({ where: { tenantId, serviceType: "CALIBRACAO" } }),
        prisma.preventiveMaintenance.count({ where: { tenantId, serviceType: "TSE" } }),
      ]),
      Promise.all([
        prisma.training.count({ where: { tenantId, active: true } }),
        prisma.trainingCompletion.count({ where: { tenantId } }),
      ]),
    ]);

  const serializedVersions = versions.map((v) => ({
    id: v.id,
    version: v.version,
    fileName: v.fileName,
    createdAt: v.createdAt.toISOString(),
    generatedByName: v.user.name,
  }));

  const [total, critA, critB, critC, ativos] = equipmentCounts;
  const [preventivas, calibracoes, tse] = maintenanceCounts;
  const [totalTrainings, totalCompletions] = trainingCounts;

  return (
    <PgtsPageClient
      versions={serializedVersions}
      canGenerate={canGenerate}
      isEnterprise={planAllows(plan, "pgts.create")}
      tenantName={tenant?.name ?? ""}
      tenantCnpj={tenant?.cnpj ?? ""}
      equipmentSummary={{ total, critA, critB, critC, ativos }}
      maintenanceSummary={{ preventivas, calibracoes, tse }}
      trainingSummary={{ total: totalTrainings, completions: totalCompletions }}
    />
  );
}
