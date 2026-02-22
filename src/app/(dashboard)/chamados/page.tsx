import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require-role";
import { hasPermission } from "@/lib/auth/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TicketFilters } from "./ticket-filters";
import { SlaIndicator } from "./sla-indicator";
import { TicketStatus, Urgency, Criticality } from "@prisma/client";

const statusLabels: Record<TicketStatus, string> = {
  ABERTO: "Aberto",
  EM_ATENDIMENTO: "Em atendimento",
  RESOLVIDO: "Resolvido",
  FECHADO: "Fechado",
};

const statusVariant: Record<TicketStatus, "danger" | "warning" | "success" | "muted"> = {
  ABERTO: "danger",
  EM_ATENDIMENTO: "warning",
  RESOLVIDO: "success",
  FECHADO: "muted",
};

const urgencyLabels: Record<Urgency, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  CRITICA: "Crítica",
};

const urgencyVariant: Record<Urgency, "muted" | "info" | "warning" | "danger"> = {
  BAIXA: "muted",
  MEDIA: "info",
  ALTA: "warning",
  CRITICA: "danger",
};

const criticalityLabels: Record<Criticality, string> = {
  A: "Critico",
  B: "Moderado",
  C: "Baixo",
};

const criticalityVariant: Record<Criticality, "danger" | "warning" | "muted"> = {
  A: "danger",
  B: "warning",
  C: "muted",
};

interface PageProps {
  searchParams: Promise<{
    status?: TicketStatus;
    urgency?: Urgency;
    page?: string;
  }>;
}

const PAGE_SIZE = 20;

export default async function ChamadosPage({ searchParams }: PageProps) {
  const { tenantId, role } = await requirePermission("ticket.view");
  const canCreate = hasPermission(role, "ticket.create");
  const params = await searchParams;
  const { status, urgency } = params;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const skip = (currentPage - 1) * PAGE_SIZE;

  const whereClause = {
    tenantId,
    ...(status && { status }),
    ...(urgency && { urgency }),
  };

  const [tickets, totalCount] = await Promise.all([
    prisma.correctiveMaintenance.findMany({
      where: whereClause,
      select: {
        id: true,
        description: true,
        urgency: true,
        status: true,
        openedAt: true,
        slaDeadline: true,
        equipment: { select: { name: true, patrimony: true, criticality: true } },
        openedBy: { select: { name: true } },
        assignedTo: { select: { name: true } },
      },
      orderBy: { openedAt: "desc" },
      take: PAGE_SIZE,
      skip,
    }),
    prisma.correctiveMaintenance.count({ where: whereClause }),
  ]);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chamados</h1>
          <p className="mt-1 text-sm text-gray-500">
            {totalCount} chamado{totalCount !== 1 && "s"} encontrado{totalCount !== 1 && "s"}
          </p>
        </div>
        {canCreate && (
          <Link href="/chamados/novo">
            <Button>Novo Chamado</Button>
          </Link>
        )}
      </div>

      <TicketFilters />

      {/* Mobile: Cards */}
      <div className="mt-4 space-y-3 lg:hidden">
        {tickets.length === 0 ? (
          <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-400">
            Nenhum chamado encontrado.
          </div>
        ) : (
          tickets.map((t) => (
            <Link key={t.id} href={`/chamados/${t.id}`} className="block rounded-lg border bg-white p-4 shadow-sm active:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">{t.equipment.name}</p>
                  {t.equipment.patrimony && (
                    <p className="text-xs text-gray-400">{t.equipment.patrimony}</p>
                  )}
                </div>
                <div className="ml-2 flex flex-shrink-0 gap-1.5">
                  <Badge variant={criticalityVariant[t.equipment.criticality]}>{criticalityLabels[t.equipment.criticality]}</Badge>
                  <Badge variant={statusVariant[t.status]}>{statusLabels[t.status]}</Badge>
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-gray-600">{t.description}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span>Por {t.openedBy.name}</span>
                {t.assignedTo && <span>Tecnico: {t.assignedTo.name}</span>}
                <span>{t.openedAt.toLocaleDateString("pt-BR")}</span>
                {t.slaDeadline && (t.status === "ABERTO" || t.status === "EM_ATENDIMENTO") && (
                  <SlaIndicator deadline={t.slaDeadline.toISOString()} />
                )}
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
              <th scope="col" className="px-4 py-3">Problema</th>
              <th scope="col" className="px-4 py-3">Criticidade</th>
              <th scope="col" className="px-4 py-3">SLA</th>
              <th scope="col" className="px-4 py-3">Tecnico</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Data</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">Acoes</span></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">Nenhum chamado encontrado.</td>
              </tr>
            ) : (
              tickets.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {t.equipment.name}
                    </div>
                    {t.equipment.patrimony && (
                      <div className="text-xs text-gray-400">
                        {t.equipment.patrimony}
                      </div>
                    )}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-gray-600">
                    {t.description}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={criticalityVariant[t.equipment.criticality]}>
                      {criticalityLabels[t.equipment.criticality]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {t.slaDeadline && (t.status === "ABERTO" || t.status === "EM_ATENDIMENTO") ? (
                      <SlaIndicator deadline={t.slaDeadline.toISOString()} />
                    ) : t.status === "RESOLVIDO" || t.status === "FECHADO" ? (
                      <span className="text-xs text-gray-400">Concluido</span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {t.assignedTo?.name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[t.status]}>
                      {statusLabels[t.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {t.openedAt.toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/chamados/${t.id}`}
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

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Pagina {currentPage} de {totalPages} ({totalCount} chamados)
          </p>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link
                href={`/chamados?${new URLSearchParams({ ...(status ? { status } : {}), ...(urgency ? { urgency } : {}), page: String(currentPage - 1) }).toString()}`}
                className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                Anterior
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={`/chamados?${new URLSearchParams({ ...(status ? { status } : {}), ...(urgency ? { urgency } : {}), page: String(currentPage + 1) }).toString()}`}
                className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                Proxima
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
