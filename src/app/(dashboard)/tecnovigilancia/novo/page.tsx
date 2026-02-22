import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require-role";
import { NewAdverseEventForm } from "./new-adverse-event-form";

export default async function NovoEventoPage() {
  const user = await requirePermission("ticket.create");
  const tenantId = user.tenantId;

  const equipments = await prisma.equipment.findMany({
    where: { tenantId, status: { not: "DESCARTADO" } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, patrimony: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Novo Evento Adverso</h1>
      <p className="mt-1 text-sm text-gray-500">
        Registre um evento adverso relacionado a equipamento medico para tecnovigilancia.
      </p>
      <div className="mt-6">
        <NewAdverseEventForm equipments={equipments} />
      </div>
    </div>
  );
}
