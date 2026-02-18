import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require-role";
import { NewTicketForm } from "./new-ticket-form";

interface PageProps {
  searchParams: Promise<{ equipmentId?: string }>;
}

export default async function NovoChamadoPage({ searchParams }: PageProps) {
  const user = await requirePermission("ticket.create");
  const tenantId = user.tenantId;
  const { equipmentId } = await searchParams;

  const equipments = await prisma.equipment.findMany({
    where: { tenantId, status: { not: "DESCARTADO" } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, patrimony: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Novo Chamado</h1>
      <p className="mt-1 text-sm text-gray-500">
        Abra um chamado de manutenção corretiva para um equipamento com problema.
      </p>
      <div className="mt-6">
        <NewTicketForm equipments={equipments} defaultEquipmentId={equipmentId} />
      </div>
    </div>
  );
}
