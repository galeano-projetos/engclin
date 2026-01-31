import { requirePermission } from "@/lib/auth/require-role";
import { getEquipmentTypes } from "./actions";
import { EquipmentTypePanel } from "./equipment-type-panel";
import { prisma } from "@/lib/db";
import { getTenantId } from "@/lib/tenant";

export default async function TiposEquipamentoPage() {
  await requirePermission("equipmentType.view");
  const tenantId = await getTenantId();

  const [types, providers] = await Promise.all([
    getEquipmentTypes(),
    prisma.provider.findMany({
      where: { tenantId, active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedTypes = types.map((t) => ({
    id: t.id,
    name: t.name,
    defaultCriticality: t.defaultCriticality,
    preventivaPeriodicity: t.preventivaPeriodicity,
    calibracaoPeriodicity: t.calibracaoPeriodicity,
    tsePeriodicity: t.tsePeriodicity,
    reserveCount: t.reserveCount,
    defaultPreventivaProvider: t.defaultPreventivaProvider,
    defaultCalibracaoProvider: t.defaultCalibracaoProvider,
    defaultTseProvider: t.defaultTseProvider,
    equipmentCount: t._count.equipments,
  }));

  return <EquipmentTypePanel types={serializedTypes} providers={providers} />;
}
