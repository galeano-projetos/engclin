import { prisma } from "@/lib/db";
import { getTenantId } from "@/lib/tenant";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { UserRole } from "@prisma/client";
import { notFound } from "next/navigation";
import { EquipmentDetails } from "./equipment-details";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EquipamentoDetailPage({ params }: PageProps) {
  const { id } = await params;
  const tenantId = await getTenantId();
  const session = await auth();
  const role = (session?.user as { role: string })?.role as UserRole;

  const equipment = await prisma.equipment.findFirst({
    where: { id, tenantId },
    include: { unit: true },
  });

  if (!equipment) {
    notFound();
  }

  const units = await prisma.unit.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
  });

  return (
    <EquipmentDetails
      equipment={{
        ...equipment,
        acquisitionValue: equipment.acquisitionValue ?? null,
        acquisitionDate: equipment.acquisitionDate
          ? equipment.acquisitionDate.toISOString()
          : null,
        createdAt: equipment.createdAt.toISOString(),
        updatedAt: equipment.updatedAt.toISOString(),
        unitName: equipment.unit.name,
      }}
      units={units}
      canEdit={hasPermission(role, "equipment.edit")}
      canDelete={hasPermission(role, "equipment.delete")}
    />
  );
}
