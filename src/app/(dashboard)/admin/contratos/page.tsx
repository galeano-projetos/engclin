import { requirePermission } from "@/lib/auth/require-role";
import { getContracts } from "./actions";
import { ContractPanel } from "./contract-panel";
import { prisma } from "@/lib/db";
import { getTenantId } from "@/lib/tenant";

export default async function ContratosPage() {
  await requirePermission("contract.view");
  const tenantId = await getTenantId();

  const [contracts, providers, equipments] = await Promise.all([
    getContracts(),
    prisma.provider.findMany({
      where: { tenantId, active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.equipment.findMany({
      where: { tenantId, status: { not: "DESCARTADO" } },
      select: { id: true, name: true, patrimony: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const now = new Date();
  const serializedContracts = contracts.map((c) => ({
    id: c.id,
    name: c.name,
    providerName: c.provider.name,
    startDate: c.startDate.toLocaleDateString("pt-BR"),
    endDate: c.endDate.toLocaleDateString("pt-BR"),
    value: c.value,
    documentUrl: c.documentUrl,
    equipmentNames: c.equipments.map((e) => e.equipment.name),
    isActive: c.endDate >= now,
  }));

  return (
    <ContractPanel
      contracts={serializedContracts}
      providers={providers}
      equipments={equipments}
    />
  );
}
