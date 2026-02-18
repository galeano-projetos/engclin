import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require-role";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MaintenanceFilters } from "./maintenance-filters";
import { MaintenancePagination } from "./maintenance-pagination";
import { MaintenanceStatus, ServiceType } from "@prisma/client";
import { serviceTypeLabel } from "@/lib/utils/periodicity";
import { getAllowedServiceTypes } from "@/lib/auth/plan-features";

const statusLabels: Record<string, string> = {
  AGENDADA: "Agendada",
  REALIZADA: "Realizada",
  VENCIDA: "Vencida",
};

const statusVariant: Record<string, "info" | "success" | "danger"> = {
  AGENDADA: "info",
  REALIZADA: "success",
  VENCIDA: "danger",
};

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
  const { tenantId, plan } = await requirePermission("preventive.view");
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

      {/* Mobile: Cards */}
      <div className="mt-4 space-y-3 lg:hidden">
        {items.length === 0 ? (
          <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-400">
            Nenhuma manutencao encontrada.
          </div>
        ) : (
          items.map((m) => (
            <Link key={m.id} href={`/manutencoes/${m.id}`} className="block rounded-lg border bg-white p-4 shadow-sm active:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">{m.equipment.name}</p>
                  {m.equipment.patrimony && (
                    <p className="text-xs text-gray-400">{m.equipment.patrimony}</p>
                  )}
                </div>
                <Badge variant={statusVariant[m.displayStatus] || "info"}>
                  {statusLabels[m.displayStatus] || m.displayStatus}
                </Badge>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="muted">{serviceTypeLabel(m.serviceType)}</Badge>
                <span className="text-sm text-gray-600">{m.type}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                {(m.providerRef?.name || m.provider) && <span>{m.providerRef?.name || m.provider}</span>}
                <span>Agendada: {m.scheduledDate.toLocaleDateString("pt-BR")}</span>
                <span>Vencimento: {m.dueDate.toLocaleDateString("pt-BR")}</span>
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
              <th scope="col" className="px-4 py-3">Equipamento</th>
              <th scope="col" className="px-4 py-3">Servico</th>
              <th scope="col" className="px-4 py-3">Fornecedor</th>
              <th scope="col" className="px-4 py-3">Data Agendada</th>
              <th scope="col" className="px-4 py-3">Vencimento</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">Acoes</span></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Nenhuma manutencao encontrada.
                </td>
              </tr>
            ) : (
              items.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {m.equipment.name}
                    </div>
                    {m.equipment.patrimony && (
                      <div className="text-xs text-gray-400">
                        {m.equipment.patrimony}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="muted">{serviceTypeLabel(m.serviceType)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {m.providerRef?.name || m.provider || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {m.scheduledDate.toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {m.dueDate.toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        statusVariant[m.displayStatus] || "info"
                      }
                    >
                      {statusLabels[m.displayStatus] || m.displayStatus}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/manutencoes/${m.id}`}
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

      {/* Paginacao */}
      <MaintenancePagination
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        perPage={perPage}
      />
    </div>
  );
}
