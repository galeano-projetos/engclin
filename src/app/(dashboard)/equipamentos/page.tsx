import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require-role";
import { hasPermission } from "@/lib/auth/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EquipmentFilters } from "./equipment-filters";
import { Pagination } from "@/components/shared/pagination";
import { Criticality, EquipmentStatus, ServiceType } from "@prisma/client";
import { criticalityDisplay } from "@/lib/utils/periodicity";

const statusLabels: Record<EquipmentStatus, string> = {
  ATIVO: "Ativo",
  INATIVO: "Inativo",
  EM_MANUTENCAO: "Em manutencao",
  DESCARTADO: "Descartado",
};

const statusVariant: Record<EquipmentStatus, "success" | "muted" | "info" | "danger"> = {
  ATIVO: "success",
  INATIVO: "muted",
  EM_MANUTENCAO: "info",
  DESCARTADO: "danger",
};

const VALID_PER_PAGE = [20, 50, 100, 150, 200, 0]; // 0 = todos

interface PageProps {
  searchParams: Promise<{
    q?: string;
    unitId?: string;
    criticality?: Criticality;
    status?: EquipmentStatus;
    page?: string;
    perPage?: string;
  }>;
}

function getServiceDotColor(
  dueDate: Date | null,
  now: Date
): "bg-green-500" | "bg-yellow-500" | "bg-red-500" | "bg-gray-300" {
  if (!dueDate) return "bg-gray-300";
  const diff = Math.ceil(
    (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff < 0) return "bg-red-500";
  if (diff <= 30) return "bg-yellow-500";
  return "bg-green-500";
}

export default async function EquipamentosPage({ searchParams }: PageProps) {
  const { tenantId, role } = await requirePermission("equipment.view");
  const canCreate = hasPermission(role, "equipment.create");
  const params = await searchParams;
  const { q, unitId, criticality, status } = params;

  const page = Math.max(1, parseInt(params.page || "1") || 1);
  const rawPerPage = parseInt(params.perPage || "20") || 20;
  const perPage = VALID_PER_PAGE.includes(rawPerPage) ? rawPerPage : 20;
  const showAll = perPage === 0;

  const whereClause = {
    tenantId,
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" as const } },
        { brand: { contains: q, mode: "insensitive" as const } },
        { model: { contains: q, mode: "insensitive" as const } },
        { patrimony: { contains: q, mode: "insensitive" as const } },
        { serialNumber: { contains: q, mode: "insensitive" as const } },
      ],
    }),
    ...(unitId && { unitId }),
    ...(criticality && { criticality }),
    ...(status && { status }),
  };

  // Run queries in parallel
  const [equipments, totalCount, units] = await Promise.all([
    prisma.equipment.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        brand: true,
        model: true,
        patrimony: true,
        criticality: true,
        status: true,
        unit: { select: { name: true } },
      },
      orderBy: { name: "asc" },
      ...(showAll ? {} : { skip: (page - 1) * perPage, take: perPage }),
    }),
    prisma.equipment.count({ where: whereClause }),
    prisma.unit.findMany({
      where: { tenantId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = showAll ? 1 : Math.ceil(totalCount / perPage);

  // Get service status dots for each equipment
  const now = new Date();
  const serviceTypes: ServiceType[] = ["PREVENTIVA", "CALIBRACAO", "TSE"];
  const equipmentIds = equipments.map((e) => e.id);

  // Batch fetch next scheduled maintenance per equipment per service type
  const nextMaintenances = equipmentIds.length > 0
    ? await prisma.preventiveMaintenance.findMany({
        where: {
          equipmentId: { in: equipmentIds },
          tenantId,
          status: "AGENDADA",
        },
        select: { equipmentId: true, serviceType: true, dueDate: true },
        orderBy: { dueDate: "asc" },
      })
    : [];

  // Build map: equipmentId -> serviceType -> earliest dueDate
  const serviceDots = new Map<string, Map<ServiceType, Date>>();
  for (const m of nextMaintenances) {
    if (!serviceDots.has(m.equipmentId)) {
      serviceDots.set(m.equipmentId, new Map());
    }
    const typeMap = serviceDots.get(m.equipmentId)!;
    if (!typeMap.has(m.serviceType)) {
      typeMap.set(m.serviceType, m.dueDate);
    }
  }

  function getDots(equipmentId: string) {
    const typeMap = serviceDots.get(equipmentId);
    return serviceTypes.map((st) => ({
      type: st,
      label: st === "PREVENTIVA" ? "P" : st === "CALIBRACAO" ? "C" : "T",
      color: getServiceDotColor(typeMap?.get(st) || null, now),
    }));
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipamentos</h1>
          <p className="mt-1 text-sm text-gray-500">
            {totalCount} equipamento{totalCount !== 1 && "s"} encontrado{totalCount !== 1 && "s"}
            {!showAll && totalCount > perPage && (
              <span> — mostrando {(page - 1) * perPage + 1} a {Math.min(page * perPage, totalCount)}</span>
            )}
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
          equipments.map((eq) => {
            const crit = criticalityDisplay[eq.criticality] || { label: eq.criticality, variant: "muted" as const };
            const dots = getDots(eq.id);
            return (
              <Link key={eq.id} href={`/equipamentos/${eq.id}`} className="block rounded-lg border bg-white p-4 shadow-sm active:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">{eq.name}</p>
                    <p className="text-sm text-gray-500">
                      {[eq.brand, eq.model].filter(Boolean).join(" — ") || ""}
                    </p>
                  </div>
                  <div className="ml-2 flex flex-shrink-0 gap-1.5">
                    <Badge variant={crit.variant}>{crit.label}</Badge>
                    <Badge variant={statusVariant[eq.status]}>{statusLabels[eq.status]}</Badge>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                  <span>{eq.unit.name}</span>
                  {eq.patrimony && <span>Pat: {eq.patrimony}</span>}
                  <div className="flex items-center gap-1">
                    {dots.map((d) => (
                      <span
                        key={d.type}
                        className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white ${d.color}`}
                        title={d.type}
                      >
                        {d.label}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Desktop: Tabela */}
      <div className="mt-4 hidden overflow-x-auto rounded-lg border bg-white shadow-sm lg:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th scope="col" className="px-4 py-3">Nome</th>
              <th scope="col" className="px-4 py-3">Marca / Modelo</th>
              <th scope="col" className="px-4 py-3">Setor</th>
              <th scope="col" className="px-4 py-3">Patrimonio</th>
              <th scope="col" className="px-4 py-3">Criticidade</th>
              <th scope="col" className="px-4 py-3">Servicos</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">Acoes</span></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {equipments.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  Nenhum equipamento encontrado.
                </td>
              </tr>
            ) : (
              equipments.map((eq) => {
                const crit = criticalityDisplay[eq.criticality] || { label: eq.criticality, variant: "muted" as const };
                const dots = getDots(eq.id);
                return (
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
                      <Badge variant={crit.variant}>
                        {crit.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {dots.map((d) => (
                          <span
                            key={d.type}
                            className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white ${d.color}`}
                            title={d.type}
                          >
                            {d.label}
                          </span>
                        ))}
                      </div>
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
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginacao */}
      <Pagination
        basePath="/equipamentos"
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        perPage={perPage}
      />
    </div>
  );
}
