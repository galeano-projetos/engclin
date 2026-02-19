import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require-role";
import { hasPermission } from "@/lib/auth/permissions";
import { planAllows } from "@/lib/auth/plan-features";
import { PgtsPageClient } from "./pgts-page-client";

export default async function PgtsPage() {
  const { tenantId, role, plan } = await requirePermission("pgts.view");

  const canGenerate = hasPermission(role, "pgts.create") && planAllows(plan, "pgts.create");

  const versions = await prisma.pgtsVersion.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      version: true,
      fileName: true,
      createdAt: true,
      user: { select: { name: true } },
    },
  });

  const serializedVersions = versions.map((v) => ({
    id: v.id,
    version: v.version,
    fileName: v.fileName,
    createdAt: v.createdAt.toISOString(),
    generatedByName: v.user.name,
  }));

  return (
    <PgtsPageClient
      versions={serializedVersions}
      canGenerate={canGenerate}
      isEnterprise={planAllows(plan, "pgts.create")}
    />
  );
}
