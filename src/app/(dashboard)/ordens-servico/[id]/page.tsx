import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require-role";
import { notFound } from "next/navigation";
import { OsDetails } from "./os-details";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OsDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requirePermission("os.view");
  const tenantId = user.tenantId as string;

  const order = await prisma.serviceOrder.findFirst({
    where: { id, tenantId },
    include: {
      preventiveMaintenance: {
        include: {
          equipment: {
            include: { unit: { select: { name: true } } },
          },
          providerRef: { select: { name: true } },
        },
      },
      correctiveMaintenance: {
        include: {
          equipment: {
            include: { unit: { select: { name: true } } },
          },
          openedBy: { select: { name: true } },
          assignedTo: { select: { name: true } },
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  // Build unified data for the client component
  const pm = order.preventiveMaintenance;
  const cm = order.correctiveMaintenance;
  const equipment = pm?.equipment || cm?.equipment;

  const osData = {
    id: order.id,
    number: order.number,
    status: order.status,
    issuedAt: order.issuedAt.toISOString(),
    completedAt: order.completedAt?.toISOString() || null,
    tenantName: user.tenantName || "",
    tipo: pm ? "Preventiva" : "Corretiva",
    // Equipment
    equipmentName: equipment?.name || "—",
    equipmentBrand: equipment?.brand || null,
    equipmentModel: equipment?.model || null,
    equipmentSerialNumber: equipment?.serialNumber || null,
    equipmentPatrimony: equipment?.patrimony || null,
    unitName: equipment?.unit.name || "—",
    // Service details
    serviceType: pm?.serviceType || null,
    description: cm?.description || pm?.notes || null,
    provider: pm?.providerRef?.name || pm?.provider || null,
    urgency: cm?.urgency || null,
    // Dates
    scheduledDate: pm?.scheduledDate?.toISOString() || null,
    dueDate: pm?.dueDate?.toISOString() || null,
    executionDate: pm?.executionDate?.toISOString() || cm?.closedAt?.toISOString() || null,
    // Corrective specifics
    diagnosis: cm?.diagnosis || null,
    solution: cm?.solution || null,
    partsUsed: cm?.partsUsed || null,
    timeSpent: cm?.timeSpent || null,
    cost: pm?.cost ? Number(pm.cost) : cm?.cost ? Number(cm.cost) : null,
    openedByName: cm?.openedBy?.name || null,
    assignedToName: cm?.assignedTo?.name || null,
    notes: pm?.notes || null,
    // Permission
    canManage: user.role === "MASTER" || user.role === "TECNICO",
  };

  return <OsDetails os={osData} />;
}
