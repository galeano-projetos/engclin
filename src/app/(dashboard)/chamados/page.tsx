import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require-role";
import { hasPermission } from "@/lib/auth/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TicketFilters } from "./ticket-filters";
import { TicketStatus, Urgency } from "@prisma/client";

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

interface PageProps {
  searchParams: Promise<{
    status?: TicketStatus;
    urgency?: Urgency;
  }>;
}

export default async function ChamadosPage({ searchParams }: PageProps) {
  const { tenantId, role } = await requirePermission("ticket.view");
  const canCreate = hasPermission(role, "ticket.create");
  const params = await searchParams;
  const { status, urgency } = params;

  const tickets = await prisma.correctiveMaintenance.findMany({
    where: {
      tenantId,
      ...(status && { status }),
      ...(urgency && { urgency }),
    },
    select: {
      id: true,
      description: true,
      urgency: true,
      status: true,
      openedAt: true,
      equipment: { select: { name: true, patrimony: true } },
      openedBy: { select: { name: true } },
      assignedTo: { select: { name: true } },
    },
    orderBy: { openedAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chamados</h1>
          <p className="mt-1 text-sm text-gray-500">
            {tickets.length} chamado{tickets.length !== 1 && "s"} encontrado{tickets.length !== 1 && "s"}
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
                  <Badge variant={urgencyVariant[t.urgency]}>{urgencyLabels[t.urgency]}</Badge>
                  <Badge variant={statusVariant[t.status]}>{statusLabels[t.status]}</Badge>
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-gray-600">{t.description}</p>
              <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                <span>Por {t.openedBy.name}</span>
                {t.assignedTo && <span>Técnico: {t.assignedTo.name}</span>}
                <span>{t.openedAt.toLocaleDateString("pt-BR")}</span>
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
              <th scope="col" className="px-4 py-3">Aberto por</th>
              <th scope="col" className="px-4 py-3">Técnico</th>
              <th scope="col" className="px-4 py-3">Urgência</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Data</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">Acoes</span></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  Nenhum chamado encontrado.
                </td>
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
                  <td className="px-4 py-3 text-gray-600">
                    {t.openedBy.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {t.assignedTo?.name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={urgencyVariant[t.urgency]}>
                      {urgencyLabels[t.urgency]}
                    </Badge>
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
    </div>
  );
}
