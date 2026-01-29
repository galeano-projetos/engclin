import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require-role";
import { EquipmentForm } from "../equipment-form";
import { createEquipmentAction } from "../actions";

export default async function NovoEquipamentoPage() {
  const user = await requirePermission("equipment.create");
  const tenantId = user.tenantId;

  const units = await prisma.unit.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        Novo Equipamento
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Preencha os dados do equipamento para cadastrá-lo no sistema.
      </p>
      <div className="mt-6">
        <EquipmentForm units={units} action={createEquipmentAction} />
      </div>
    </div>
  );
}
