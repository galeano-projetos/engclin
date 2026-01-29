import { prisma } from "@/lib/db";
import { getTenantId } from "@/lib/tenant";
import { notFound } from "next/navigation";
import { PhysicsTestDetails } from "./physics-test-details";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PhysicsTestDetailPage({ params }: PageProps) {
  const { id } = await params;
  const tenantId = await getTenantId();

  const test = await prisma.medicalPhysicsTest.findFirst({
    where: { id, tenantId },
    include: {
      equipment: { select: { name: true, patrimony: true, id: true } },
    },
  });

  if (!test) {
    notFound();
  }

  const now = new Date();
  let displayStatus = test.status as string;
  if (test.status === "AGENDADA" && test.dueDate < now) {
    displayStatus = "VENCIDA";
  }

  return (
    <PhysicsTestDetails
      test={{
        id: test.id,
        type: test.type,
        status: test.status,
        displayStatus,
        scheduledDate: test.scheduledDate.toISOString(),
        dueDate: test.dueDate.toISOString(),
        executionDate: test.executionDate?.toISOString() || null,
        provider: test.provider,
        reportUrl: test.reportUrl,
        notes: test.notes,
        equipmentName: test.equipment.name,
        equipmentId: test.equipment.id,
        equipmentPatrimony: test.equipment.patrimony,
      }}
    />
  );
}
