import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require-role";
import { NewPhysicsTestForm } from "./new-physics-test-form";

export default async function NovoTesteFisicaPage() {
  const user = await requirePermission("physics.create");
  const tenantId = user.tenantId;

  const equipments = await prisma.equipment.findMany({
    where: { tenantId, status: { not: "DESCARTADO" } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, patrimony: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        Novo Teste de Física Médica
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Cadastre um teste de física médica para um equipamento de diagnóstico
        por imagem.
      </p>
      <div className="mt-6">
        <NewPhysicsTestForm equipments={equipments} />
      </div>
    </div>
  );
}
