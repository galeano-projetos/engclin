import { requirePermission } from "@/lib/auth/require-role";
import { getChecklistTemplates } from "./actions";
import { ChecklistPanel } from "./checklist-panel";
import { prisma } from "@/lib/db";
import { getTenantId } from "@/lib/tenant";

export default async function ChecklistsPage() {
  await requirePermission("checklist.view");
  const tenantId = await getTenantId();

  const [templates, equipmentTypes] = await Promise.all([
    getChecklistTemplates(),
    prisma.equipmentType.findMany({
      where: { tenantId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedTemplates = templates.map((t) => ({
    id: t.id,
    name: t.name,
    active: t.active,
    equipmentType: t.equipmentType,
    items: t.items.map((i) => ({ id: i.id, description: i.description, order: i.order })),
    resultCount: t._count.results,
  }));

  return (
    <ChecklistPanel
      templates={serializedTemplates}
      equipmentTypes={equipmentTypes}
    />
  );
}
