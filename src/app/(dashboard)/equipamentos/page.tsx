import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require-role";
import { hasPermission } from "@/lib/auth/permissions";
import { Button } from "@/components/ui/button";
import { EquipmentFilters } from "./equipment-filters";
import { EquipmentListClient } from "./equipment-list-client";
import { Pagination } from "@/components/shared/pagination";
import { Criticality, EquipmentStatus, ServiceType } from "@prisma/client";
import { criticalityDisplay } from "@/lib/utils/periodicity";
import { getAllowedServiceTypes } from "@/lib/auth/plan-features";

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
  const { tenantId, role, plan } = await requirePermission("equipment.view");
  const canCreate = hasPermission(role, "equipment.create");
  const canBulk = hasPermission(role, "preventive.create");
  const allowedServiceTypes = getAllowedServiceTypes(plan);
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
  const [equipments, totalCount, units, providers] = await Promise.all([
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
    canBulk
      ? prisma.provider.findMany({
          where: { tenantId, active: true },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
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

      <EquipmentListClient
        equipments={equipments.map((eq) => {
          const crit = criticalityDisplay[eq.criticality] || { label: eq.criticality, variant: "muted" as const };
          const dots = getDots(eq.id);
          return {
            id: eq.id,
            name: eq.name,
            brand: eq.brand,
            model: eq.model,
            patrimony: eq.patrimony,
            criticality: eq.criticality,
            status: eq.status,
            unitName: eq.unit.name,
            dots,
            critLabel: crit.label,
            critVariant: crit.variant,
          };
        })}
        providers={providers}
        allowedServiceTypes={allowedServiceTypes}
        canBulk={canBulk}
      />

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
