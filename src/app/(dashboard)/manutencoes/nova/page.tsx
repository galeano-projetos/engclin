import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require-role";
import { NewPreventiveForm } from "./new-preventive-form";

export default async function NovaPreventivePage() {
  const user = await requirePermission("preventive.create");
  const tenantId = user.tenantId;

  const equipments = await prisma.equipment.findMany({
    where: { tenantId, status: { not: "DESCARTADO" } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, patrimony: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        Nova Manutenção Preventiva
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Agende uma calibração ou teste de segurança para um equipamento.
      </p>
      <div className="mt-6">
        <NewPreventiveForm equipments={equipments} />
      </div>
    </div>
  );
}
