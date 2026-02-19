import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/db";
import { PgtsDocument, PgtsEquipment, PgtsDocumentProps } from "./pdf-template";

export async function generatePgtsPdf(
  tenantId: string,
  sections: Record<string, string>,
  generatedByName: string
): Promise<Buffer> {
  // Fetch all data needed for the PDF
  const [tenant, equipments, maintenanceCounts, trainings, trainingCompletions] =
    await Promise.all([
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true, cnpj: true },
      }),
      prisma.equipment.findMany({
        where: { tenantId },
        select: {
          name: true,
          brand: true,
          model: true,
          patrimony: true,
          serialNumber: true,
          criticality: true,
          status: true,
        },
        orderBy: [{ criticality: "asc" }, { name: "asc" }],
      }),
      Promise.all([
        prisma.preventiveMaintenance.count({
          where: { tenantId, serviceType: "PREVENTIVA" },
        }),
        prisma.preventiveMaintenance.count({
          where: { tenantId, serviceType: "CALIBRACAO" },
        }),
        prisma.preventiveMaintenance.count({
          where: { tenantId, serviceType: "TSE" },
        }),
        prisma.preventiveMaintenance.count({
          where: { tenantId, status: "REALIZADA" },
        }),
        prisma.preventiveMaintenance.count({
          where: { tenantId, status: "VENCIDA" },
        }),
      ]),
      prisma.training.count({ where: { tenantId, active: true } }),
      prisma.trainingCompletion.count({ where: { tenantId } }),
    ]);

  if (!tenant) {
    throw new Error("Tenant nao encontrado");
  }

  const pdfEquipments: PgtsEquipment[] = equipments.map((eq) => ({
    name: eq.name,
    brand: eq.brand,
    model: eq.model,
    patrimony: eq.patrimony,
    serialNumber: eq.serialNumber,
    criticality: eq.criticality,
    status: eq.status,
  }));

  const equipmentSummary = {
    total: equipments.length,
    critA: equipments.filter((e) => e.criticality === "A").length,
    critB: equipments.filter((e) => e.criticality === "B").length,
    critC: equipments.filter((e) => e.criticality === "C").length,
    ativos: equipments.filter((e) => e.status === "ATIVO").length,
    inativos: equipments.filter((e) => e.status !== "ATIVO").length,
  };

  const [preventivas, calibracoes, tse, realizadas, vencidas] = maintenanceCounts;

  const props: PgtsDocumentProps = {
    hospitalName: tenant.name,
    cnpj: tenant.cnpj,
    generatedByName,
    generatedAt: new Date().toLocaleDateString("pt-BR"),
    sections,
    equipments: pdfEquipments,
    equipmentSummary,
    maintenanceSummary: {
      preventivas,
      calibracoes,
      tse,
      realizadas,
      vencidas,
    },
    trainingSummary: {
      total: trainings,
      completions: trainingCompletions,
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(<PgtsDocument {...props} /> as any);

  return Buffer.from(buffer);
}
