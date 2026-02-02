import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require-role";
import { notFound } from "next/navigation";
import { TicketDetails } from "./ticket-details";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ChamadoDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { tenantId } = await requirePermission("ticket.view");

  const ticket = await prisma.correctiveMaintenance.findFirst({
    where: { id, tenantId },
    include: {
      equipment: { select: { name: true, patrimony: true, id: true } },
      openedBy: { select: { name: true } },
      assignedTo: { select: { name: true } },
    },
  });

  if (!ticket) {
    notFound();
  }

  return (
    <TicketDetails
      ticket={{
        id: ticket.id,
        description: ticket.description,
        urgency: ticket.urgency,
        status: ticket.status,
        diagnosis: ticket.diagnosis,
        solution: ticket.solution,
        partsUsed: ticket.partsUsed,
        timeSpent: ticket.timeSpent,
        cost: ticket.cost ? Number(ticket.cost) : null,
        openedAt: ticket.openedAt.toISOString(),
        closedAt: ticket.closedAt?.toISOString() || null,
        equipmentName: ticket.equipment.name,
        equipmentId: ticket.equipment.id,
        equipmentPatrimony: ticket.equipment.patrimony,
        openedByName: ticket.openedBy.name,
        assignedToName: ticket.assignedTo?.name || null,
      }}
    />
  );
}
