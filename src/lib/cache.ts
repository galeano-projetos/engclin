import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";

/**
 * Cached queries for frequently-accessed reference data.
 * Revalidated every 5 minutes or on mutation via revalidateTag.
 */

export const getCachedUnits = unstable_cache(
  async (tenantId: string) => {
    return prisma.unit.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    });
  },
  ["units"],
  { revalidate: 300, tags: ["units"] }
);

export const getCachedProviders = unstable_cache(
  async (tenantId: string) => {
    return prisma.provider.findMany({
      where: { tenantId, active: true },
      orderBy: { name: "asc" },
    });
  },
  ["providers"],
  { revalidate: 300, tags: ["providers"] }
);

export const getCachedEquipmentTypes = unstable_cache(
  async (tenantId: string) => {
    return prisma.equipmentType.findMany({
      where: { tenantId },
      select: { id: true, name: true, defaultCriticality: true },
      orderBy: { name: "asc" },
    });
  },
  ["equipment-types"],
  { revalidate: 300, tags: ["equipment-types"] }
);
