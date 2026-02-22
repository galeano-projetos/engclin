import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require-role";
import { EquipmentForm } from "../equipment-form";
import { createEquipmentAction } from "../actions";

interface PageProps {
  searchParams: Promise<{ clone?: string }>;
}

export default async function NovoEquipamentoPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const user = await requirePermission("equipment.create");
  const tenantId = user.tenantId;

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

  // Clone: pre-fill form with data from existing equipment (without id, serial, patrimony)
  let cloneData = undefined;
  if (params.clone) {
    const source = await prisma.equipment.findFirst({
      where: { id: params.clone, tenantId },
      select: {
        name: true, brand: true, model: true, anvisaRegistry: true,
        unitId: true, equipmentTypeId: true, criticality: true,
        ownershipType: true, loanProvider: true,
        acquisitionValue: true, vidaUtilAnos: true,
        metodoDepreciacao: true, valorResidual: true,
        contingencyPlan: true,
      },
    });
    if (source) {
      cloneData = {
        name: `${source.name} (copia)`,
        brand: source.brand,
        model: source.model,
        serialNumber: null,
        anvisaRegistry: source.anvisaRegistry,
        patrimony: null,
        unitId: source.unitId,
        criticality: source.criticality,
        status: "ATIVO" as const,
        acquisitionDate: null,
        acquisitionValue: source.acquisitionValue ? Number(source.acquisitionValue) : null,
        equipmentTypeId: source.equipmentTypeId,
        ownershipType: source.ownershipType,
        loanProvider: source.loanProvider,
        vidaUtilAnos: source.vidaUtilAnos,
        metodoDepreciacao: source.metodoDepreciacao,
        valorResidual: source.valorResidual ? Number(source.valorResidual) : null,
        contingencyPlan: source.contingencyPlan,
      };
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        {cloneData ? "Duplicar Equipamento" : "Novo Equipamento"}
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        {cloneData
          ? "Dados pre-preenchidos a partir do equipamento original. Ajuste conforme necessario."
          : "Preencha os dados do equipamento para cadastra-lo no sistema."}
      </p>
      <div className="mt-6">
        <EquipmentForm
          units={units}
          equipmentTypes={equipmentTypes}
          equipment={cloneData || undefined}
          action={createEquipmentAction}
          plan={user.plan}
        />
      </div>
    </div>
  );
}
