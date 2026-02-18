import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require-role";
import { hasPermission } from "@/lib/auth/permissions";
import { TrainingList } from "./training-list";

interface PageProps {
  searchParams: Promise<{
    equipmentTypeId?: string;
    status?: string;
  }>;
}

export default async function TreinamentosPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { tenantId, role, id: userId } = await requirePermission("training.view");
  const canCreate = hasPermission(role, "training.create");

  const [trainings, equipmentTypes, myCompletions] = await Promise.all([
    prisma.training.findMany({
      where: {
        tenantId,
        active: true,
        ...(params.equipmentTypeId
          ? { equipmentTypeId: params.equipmentTypeId }
          : {}),
      },
      include: {
        equipmentType: { select: { name: true } },
        _count: { select: { completions: true } },
      },
      orderBy: { title: "asc" },
    }),
    prisma.equipmentType.findMany({
      where: { tenantId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.trainingCompletion.findMany({
      where: { tenantId, userId },
      select: { trainingId: true, completedAt: true },
    }),
  ]);

  const now = new Date();
  const completionMap = new Map(
    myCompletions.map((c) => [c.trainingId, c.completedAt])
  );

  const serialized = trainings.map((t) => {
    const completedAt = completionMap.get(t.id);
    let userStatus: "pending" | "valid" | "expired" = "pending";
    let expiresAt: string | null = null;

    if (completedAt) {
      const expiry = new Date(completedAt);
      expiry.setMonth(expiry.getMonth() + t.validityMonths);
      expiresAt = expiry.toLocaleDateString("pt-BR");
      userStatus = expiry > now ? "valid" : "expired";
    }

    return {
      id: t.id,
      title: t.title,
      description: t.description,
      equipmentTypeName: t.equipmentType?.name ?? null,
      equipmentTypeId: t.equipmentTypeId,
      validityMonths: t.validityMonths,
      hasVideo: !!t.videoUrl,
      completionCount: t._count.completions,
      userStatus,
      completedAt: completedAt?.toLocaleDateString("pt-BR") ?? null,
      expiresAt,
    };
  });

  // Filtro por status do usuario
  const filtered =
    params.status === "concluido"
      ? serialized.filter((t) => t.userStatus !== "pending")
      : params.status === "pendente"
        ? serialized.filter((t) => t.userStatus === "pending")
        : serialized;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Treinamentos</h1>
      <p className="mt-1 text-sm text-gray-500">
        Treinamentos disponiveis para sua equipe
      </p>
      <TrainingList
        trainings={filtered}
        equipmentTypes={equipmentTypes}
        canCreate={canCreate}
        currentFilters={{
          equipmentTypeId: params.equipmentTypeId ?? "",
          status: params.status ?? "",
        }}
      />
    </div>
  );
}
