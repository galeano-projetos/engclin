import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require-role";
import { Badge } from "@/components/ui/badge";
import { OsFilters } from "./os-filters";
import { Pagination } from "@/components/shared/pagination";
import { OrderStatus } from "@prisma/client";

const statusLabels: Record<string, string> = {
  ABERTA: "Aberta",
  EM_EXECUCAO: "Em Execução",
  CONCLUIDA: "Concluída",
};

const statusVariant: Record<string, "info" | "warning" | "success"> = {
  ABERTA: "info",
  EM_EXECUCAO: "warning",
  CONCLUIDA: "success",
};

const VALID_PER_PAGE = [20, 50, 100, 150, 200, 0];

interface PageProps {
  searchParams: Promise<{
    status?: OrderStatus;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
    perPage?: string;
  }>;
}

export default async function OrdensServicoPage({ searchParams }: PageProps) {
  const { tenantId } = await requirePermission("os.view");
  const params = await searchParams;
  const { status, dateFrom, dateTo } = params;

  const page = Math.max(1, parseInt(params.page || "1") || 1);
  const rawPerPage = parseInt(params.perPage || "20") || 20;
  const perPage = VALID_PER_PAGE.includes(rawPerPage) ? rawPerPage : 20;
  const showAll = perPage === 0;

  const whereClause = {
    tenantId,
    ...(status && { status }),
    ...(dateFrom || dateTo
      ? {
          issuedAt: {
            ...(dateFrom && { gte: new Date(dateFrom) }),
            ...(dateTo && { lte: new Date(`${dateTo}T23:59:59.999Z`) }),
          },
        }
      : {}),
  };

  const [orders, totalCount] = await Promise.all([
    prisma.serviceOrder.findMany({
      where: whereClause,
      include: {
        preventiveMaintenance: {
          select: {
            serviceType: true,
            type: true,
            equipment: { select: { name: true, patrimony: true } },
            providerRef: { select: { name: true } },
            provider: true,
          },
        },
        correctiveMaintenance: {
          select: {
            urgency: true,
            description: true,
            equipment: { select: { name: true, patrimony: true } },
            openedBy: { select: { name: true } },
          },
        },
      },
      orderBy: { number: "desc" },
      ...(showAll ? {} : { skip: (page - 1) * perPage, take: perPage }),
    }),
    prisma.serviceOrder.count({ where: whereClause }),
  ]);

  const totalPages = showAll ? 1 : Math.ceil(totalCount / perPage);

  function getOsInfo(order: (typeof orders)[number]) {
    if (order.preventiveMaintenance) {
      const pm = order.preventiveMaintenance;
      return {
        tipo: "Preventiva",
        equipamento: pm.equipment.name,
        patrimonio: pm.equipment.patrimony,
        detalhe: pm.providerRef?.name || pm.provider || pm.type,
      };
    }
    if (order.correctiveMaintenance) {
      const cm = order.correctiveMaintenance;
      return {
        tipo: "Corretiva",
        equipamento: cm.equipment.name,
        patrimonio: cm.equipment.patrimony,
        detalhe: cm.description.length > 60 ? cm.description.slice(0, 60) + "..." : cm.description,
      };
    }
    return { tipo: "—", equipamento: "—", patrimonio: null, detalhe: "—" };
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Ordens de Serviço
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {totalCount}{" "}
            {totalCount === 1 ? "ordem encontrada" : "ordens encontradas"}
            {!showAll && totalCount > perPage && (
              <span>
                {" "}— mostrando {(page - 1) * perPage + 1} a{" "}
                {Math.min(page * perPage, totalCount)}
              </span>
            )}
          </p>
        </div>
      </div>

      <OsFilters />

      {/* Mobile: Cards */}
      <div className="mt-4 space-y-3 lg:hidden">
        {orders.length === 0 ? (
          <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-400">
            Nenhuma ordem de serviço encontrada.
          </div>
        ) : (
          orders.map((order) => {
            const info = getOsInfo(order);
            return (
              <Link
                key={order.id}
                href={`/ordens-servico/${order.id}`}
                className="block rounded-lg border bg-white p-4 shadow-sm active:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">
                      OS-{String(order.number).padStart(4, "0")}
                    </p>
                    <p className="text-sm text-gray-600">{info.equipamento}</p>
                    {info.patrimonio && (
                      <p className="text-xs text-gray-400">{info.patrimonio}</p>
                    )}
                  </div>
                  <Badge variant={statusVariant[order.status] || "info"}>
                    {statusLabels[order.status] || order.status}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="muted">{info.tipo}</Badge>
                  <span className="truncate text-xs text-gray-500">
                    {info.detalhe}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-gray-500">
                  <span>Emissão: {order.issuedAt.toLocaleDateString("pt-BR")}</span>
                  {order.completedAt && (
                    <span>
                      Conclusão: {order.completedAt.toLocaleDateString("pt-BR")}
                    </span>
                  )}
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
              <th scope="col" className="px-4 py-3">Nº OS</th>
              <th scope="col" className="px-4 py-3">Tipo</th>
              <th scope="col" className="px-4 py-3">Equipamento</th>
              <th scope="col" className="px-4 py-3">Detalhe</th>
              <th scope="col" className="px-4 py-3">Emissão</th>
              <th scope="col" className="px-4 py-3">Conclusão</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  Nenhuma ordem de serviço encontrada.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const info = getOsInfo(order);
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      OS-{String(order.number).padStart(4, "0")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="muted">{info.tipo}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {info.equipamento}
                      </div>
                      {info.patrimonio && (
                        <div className="text-xs text-gray-400">
                          {info.patrimonio}
                        </div>
                      )}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-gray-600">
                      {info.detalhe}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {order.issuedAt.toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {order.completedAt
                        ? order.completedAt.toLocaleDateString("pt-BR")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[order.status] || "info"}>
                        {statusLabels[order.status] || order.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/ordens-servico/${order.id}`}
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

      <Pagination
        basePath="/ordens-servico"
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        perPage={perPage}
      />
    </div>
  );
}
