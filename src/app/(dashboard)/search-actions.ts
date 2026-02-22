"use server";

import { prisma } from "@/lib/db";
import { checkPermission } from "@/lib/auth/require-role";

export interface SearchResult {
  id: string;
  type: "equipment" | "ticket" | "maintenance";
  title: string;
  subtitle: string | null;
  href: string;
}

export async function searchEquipments(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];

  const { tenantId } = await checkPermission("equipment.view");

  const equipments = await prisma.equipment.findMany({
    where: {
      tenantId,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { patrimony: { contains: query, mode: "insensitive" } },
        { serialNumber: { contains: query, mode: "insensitive" } },
        { brand: { contains: query, mode: "insensitive" } },
        { model: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      patrimony: true,
      brand: true,
      model: true,
      unit: { select: { name: true } },
    },
    orderBy: { name: "asc" },
    take: 8,
  });

  return equipments.map((eq) => ({
    id: eq.id,
    type: "equipment" as const,
    title: eq.name,
    subtitle: [eq.patrimony, eq.brand, eq.model, eq.unit.name]
      .filter(Boolean)
      .join(" — "),
    href: `/equipamentos/${eq.id}`,
  }));
}
