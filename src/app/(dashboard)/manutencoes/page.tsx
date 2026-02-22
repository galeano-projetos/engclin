import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require-role";
import { hasPermission } from "@/lib/auth/permissions";
import { Button } from "@/components/ui/button";
import { MaintenanceFilters } from "./maintenance-filters";
import { MaintenanceListClient } from "./maintenance-list-client";
import { Pagination } from "@/components/shared/pagination";
import { MaintenanceStatus, ServiceType } from "@prisma/client";
import { serviceTypeLabel } from "@/lib/utils/periodicity";
import { getAllowedServiceTypes } from "@/lib/auth/plan-features";


const VALID_PER_PAGE = [20, 50, 100, 150, 200, 0];

interface PageProps {
  searchParams: Promise<{
    status?: MaintenanceStatus | "VENCIDA";
    equipmentId?: string;
    serviceType?: ServiceType;
    providerId?: string;
    page?: string;
    perPage?: string;
  }>;
}

export default async function ManutencoesPage({ searchParams }: PageProps) {
  const { tenantId, plan, role } = await requirePermission("preventive.view");
  const canBulkExecute = hasPermission(role, "preventive.execute");
  const params = await searchParams;
  const { status, equipmentId, providerId } = params;
  const allowedServiceTypes = getAllowedServiceTypes(plan);
  // Ignore serviceType filter if not allowed by plan
  const serviceType = params.serviceType && allowedServiceTypes.includes(params.serviceType)
    ? params.serviceType
    : undefined;

  const page = Math.max(1, parseInt(params.page || "1") || 1);
  const rawPerPage = parseInt(params.perPage || "20") || 20;
  const perPage = VALID_PER_PAGE.includes(rawPerPage) ? rawPerPage : 20;
  const showAll = perPage === 0;

  const now = new Date();

  // Build where clause - handle virtual "VENCIDA" status on server
  const whereClause = {
    tenantId,
    // Enforce plan: only show allowed service types
    ...(allowedServiceTypes.length < 3
      ? { serviceType: { in: allowedServiceTypes as ServiceType[] } }
      : {}),
    ...(status === "VENCIDA"
      ? { status: "AGENDADA" as MaintenanceStatus, dueDate: { lt: now } }
      : status
        ? { status }
        : {}),
    ...(equipmentId && { equipmentId }),
    ...(serviceType && { serviceType }),
    ...(providerId && { providerId }),
  };

  const [maintenances, totalCount, equipments, providers] = await Promise.all([
    prisma.preventiveMaintenance.findMany({
      where: whereClause,
      select: {
        id: true,
        type: true,
        serviceType: true,
        status: true,
        scheduledDate: true,
        dueDate: true,
        provider: true,
        equipment: { select: { name: true, patrimony: true } },
        providerRef: { select: { name: true } },
      },
      orderBy: { dueDate: "asc" },
      ...(showAll ? {} : { skip: (page - 1) * perPage, take: perPage }),
    }),
    prisma.preventiveMaintenance.count({ where: whereClause }),
    prisma.equipment.findMany({
      where: { tenantId, status: { not: "DESCARTADO" } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.provider.findMany({
      where: { tenantId, active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = showAll ? 1 : Math.ceil(totalCount / perPage);

  // Compute display status
  const items = maintenances.map((m) => {
    let displayStatus = m.status as string;
    if (m.status === "AGENDADA" && m.dueDate < now) {
      displayStatus = "VENCIDA";
    }
    return { ...m, displayStatus };
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Manutencoes Preventivas
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {totalCount}{" "}
            {totalCount === 1 ? "manutencao encontrada" : "manutencoes encontradas"}
            {!showAll && totalCount > perPage && (
              <span> — mostrando {(page - 1) * perPage + 1} a {Math.min(page * perPage, totalCount)}</span>
            )}
          </p>
        </div>
        <Link href="/manutencoes/nova">
          <Button>Nova Preventiva</Button>
        </Link>
      </div>

      <MaintenanceFilters equipments={equipments} providers={providers} allowedServiceTypes={allowedServiceTypes} />

      <MaintenanceListClient
        items={items.map((m) => ({
          id: m.id,
          type: m.type,
          serviceType: m.serviceType,
          serviceTypeLabel: serviceTypeLabel(m.serviceType),
          displayStatus: m.displayStatus,
          scheduledDate: m.scheduledDate.toLocaleDateString("pt-BR"),
          dueDate: m.dueDate.toLocaleDateString("pt-BR"),
          equipmentName: m.equipment.name,
          equipmentPatrimony: m.equipment.patrimony,
          providerName: m.providerRef?.name || m.provider || null,
          isScheduled: m.status === "AGENDADA",
        }))}
        canBulkExecute={canBulkExecute}
      />

      {/* Paginacao */}
      <Pagination
        basePath="/manutencoes"
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        perPage={perPage}
      />
    </div>
  );
}
