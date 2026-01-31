import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require-role";
import { NewPreventiveForm } from "./new-preventive-form";

export default async function NovaPreventivePage() {
  const user = await requirePermission("preventive.create");
  const tenantId = user.tenantId;

  const [equipments, providers] = await Promise.all([
    prisma.equipment.findMany({
      where: { tenantId, status: { not: "DESCARTADO" } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, patrimony: true, equipmentTypeId: true },
    }),
    prisma.provider.findMany({
      where: { tenantId, active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        Nova Manutencao Preventiva
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Agende uma preventiva, calibracao ou teste de seguranca para um equipamento.
      </p>
      <div className="mt-6">
        <NewPreventiveForm equipments={equipments} providers={providers} />
      </div>
    </div>
  );
}
