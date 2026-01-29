import Link from "next/link";
import { prisma } from "@/lib/db";
import { getTenantId } from "@/lib/tenant";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EquipmentFilters } from "./equipment-filters";
import { Criticality, EquipmentStatus, UserRole } from "@prisma/client";

const criticalityVariant = {
  A: "danger",
  B: "warning",
  C: "success",
} as const;

const statusLabels: Record<EquipmentStatus, string> = {
  ATIVO: "Ativo",
  INATIVO: "Inativo",
  EM_MANUTENCAO: "Em manutenção",
  DESCARTADO: "Descartado",
};

const statusVariant: Record<EquipmentStatus, "success" | "muted" | "info" | "danger"> = {
  ATIVO: "success",
  INATIVO: "muted",
  EM_MANUTENCAO: "info",
  DESCARTADO: "danger",
};

interface PageProps {
  searchParams: Promise<{
    q?: string;
    unitId?: string;
    criticality?: Criticality;
    status?: EquipmentStatus;
  }>;
}

export default async function EquipamentosPage({ searchParams }: PageProps) {
  const tenantId = await getTenantId();
  const session = await auth();
  const role = (session?.user as { role: string })?.role as UserRole;
  const canCreate = hasPermission(role, "equipment.create");
  const params = await searchParams;
  const { q, unitId, criticality, status } = params;

  const equipments = await prisma.equipment.findMany({
    where: {
      tenantId,
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { brand: { contains: q, mode: "insensitive" } },
          { model: { contains: q, mode: "insensitive" } },
          { patrimony: { contains: q, mode: "insensitive" } },
          { serialNumber: { contains: q, mode: "insensitive" } },
        ],
      }),
      ...(unitId && { unitId }),
      ...(criticality && { criticality }),
      ...(status && { status }),
    },
    include: { unit: true },
    orderBy: { name: "asc" },
  });

  const units = await prisma.unit.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipamentos</h1>
          <p className="mt-1 text-sm text-gray-500">
            {equipments.length} equipamento{equipments.length !== 1 && "s"} encontrado{equipments.length !== 1 && "s"}
          </p>
        </div>
        {canCreate && (
          <Link href="/equipamentos/novo">
            <Button>Novo Equipamento</Button>
          </Link>
        )}
      </div>

      {/* Filtros */}
      <EquipmentFilters units={units} />

      {/* Mobile: Cards */}
      <div className="mt-4 space-y-3 lg:hidden">
        {equipments.length === 0 ? (
          <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-400">
            Nenhum equipamento encontrado.
          </div>
        ) : (
          equipments.map((eq) => (
            <Link key={eq.id} href={`/equipamentos/${eq.id}`} className="block rounded-lg border bg-white p-4 shadow-sm active:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">{eq.name}</p>
                  <p className="text-sm text-gray-500">
                    {[eq.brand, eq.model].filter(Boolean).join(" — ") || ""}
                  </p>
                </div>
                <div className="ml-2 flex flex-shrink-0 gap-1.5">
                  <Badge variant={criticalityVariant[eq.criticality]}>{eq.criticality}</Badge>
                  <Badge variant={statusVariant[eq.status]}>{statusLabels[eq.status]}</Badge>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                <span>{eq.unit.name}</span>
                {eq.patrimony && <span>Pat: {eq.patrimony}</span>}
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Desktop: Tabela */}
      <div className="mt-4 hidden overflow-x-auto rounded-lg border bg-white shadow-sm lg:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Marca / Modelo</th>
              <th className="px-4 py-3">Setor</th>
              <th className="px-4 py-3">Patrimônio</th>
              <th className="px-4 py-3">Criticidade</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {equipments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Nenhum equipamento encontrado.
                </td>
              </tr>
            ) : (
              equipments.map((eq) => (
                <tr key={eq.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {eq.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {[eq.brand, eq.model].filter(Boolean).join(" — ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {eq.unit.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {eq.patrimony || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={criticalityVariant[eq.criticality]}>
                      {eq.criticality}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[eq.status]}>
                      {statusLabels[eq.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/equipamentos/${eq.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
