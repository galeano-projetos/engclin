import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require-role";
import { hasPermission } from "@/lib/auth/permissions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const statusLabels: Record<string, string> = {
  ABERTO: "Aberto",
  EM_INVESTIGACAO: "Em Investigacao",
  NOTIFICADO_ANVISA: "Notificado ANVISA",
  RESOLVIDO: "Resolvido",
  FECHADO: "Fechado",
};

const statusVariant: Record<string, "danger" | "warning" | "success" | "muted" | "info"> = {
  ABERTO: "danger",
  EM_INVESTIGACAO: "warning",
  NOTIFICADO_ANVISA: "info",
  RESOLVIDO: "success",
  FECHADO: "muted",
};

const severityLabels: Record<string, string> = {
  LEVE: "Leve",
  MODERADO: "Moderado",
  GRAVE: "Grave",
  OBITO: "Obito",
};

export default async function TecnovigilanciaPage() {
  const { tenantId, role } = await requirePermission("ticket.view");
  const canCreate = hasPermission(role, "ticket.create");

  const events = await prisma.adverseEvent.findMany({
    where: { tenantId },
    include: {
      equipment: { select: { name: true, patrimony: true } },
      reporter: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tecnovigilancia</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestao de eventos adversos e notificacoes ANVISA
          </p>
        </div>
        {canCreate && (
          <Link href="/tecnovigilancia/novo">
            <Button>Novo Evento</Button>
          </Link>
        )}
      </div>

      {/* Mobile: Cards */}
      <div className="mt-4 space-y-3 lg:hidden">
        {events.length === 0 ? (
          <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-400">
            Nenhum evento adverso registrado.
          </div>
        ) : (
          events.map((e) => (
            <Link key={e.id} href={`/tecnovigilancia/${e.id}`} className="block rounded-lg border bg-white p-4 shadow-sm active:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">{e.equipment.name}</p>
                  {e.equipment.patrimony && (
                    <p className="text-xs text-gray-400">{e.equipment.patrimony}</p>
                  )}
                </div>
                <div className="ml-2 flex flex-shrink-0 gap-1.5">
                  <Badge variant={e.severity === "GRAVE" || e.severity === "OBITO" ? "danger" : e.severity === "MODERADO" ? "warning" : "muted"}>
                    {severityLabels[e.severity] || e.severity}
                  </Badge>
                  <Badge variant={statusVariant[e.status] || "muted"}>
                    {statusLabels[e.status] || e.status}
                  </Badge>
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-gray-600">{e.description}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span>Por {e.reporter.name}</span>
                <span>{e.eventDate.toLocaleDateString("pt-BR")}</span>
                <span>{e.eventType.replace(/_/g, " ")}</span>
                {e.anvisaNotified ? (
                  <span className="text-green-600 font-medium">ANVISA: Sim</span>
                ) : (
                  <span className="text-gray-400">ANVISA: Nao</span>
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
              <th className="px-4 py-3">Equipamento</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Severidade</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">ANVISA</th>
              <th className="px-4 py-3"><span className="sr-only">Acoes</span></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {events.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Nenhum evento adverso registrado.
                </td>
              </tr>
            ) : (
              events.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{e.equipment.name}</div>
                    {e.equipment.patrimony && <div className="text-xs text-gray-400">{e.equipment.patrimony}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{e.eventDate.toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3 text-gray-600">{e.eventType.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3">
                    <Badge variant={e.severity === "GRAVE" || e.severity === "OBITO" ? "danger" : e.severity === "MODERADO" ? "warning" : "muted"}>
                      {severityLabels[e.severity] || e.severity}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[e.status] || "muted"}>
                      {statusLabels[e.status] || e.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {e.anvisaNotified ? (
                      <span className="text-green-600 text-xs font-medium">Sim</span>
                    ) : (
                      <span className="text-gray-400 text-xs">Nao</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/tecnovigilancia/${e.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
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
