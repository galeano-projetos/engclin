import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require-role";
import { hasPermission } from "@/lib/auth/permissions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ncStatusLabels: Record<string, string> = {
  ABERTA: "Aberta",
  EM_ANALISE: "Em Analise",
  EM_TRATAMENTO: "Em Tratamento",
  VERIFICACAO: "Verificacao",
  FECHADA: "Fechada",
};

const ncStatusVariant: Record<string, "danger" | "warning" | "success" | "muted" | "info"> = {
  ABERTA: "danger",
  EM_ANALISE: "warning",
  EM_TRATAMENTO: "info",
  VERIFICACAO: "info",
  FECHADA: "muted",
};

const ncSeverityLabels: Record<string, string> = {
  MENOR: "Menor",
  MAIOR: "Maior",
  CRITICA: "Critica",
};

const ncSourceLabels: Record<string, string> = {
  AUDITORIA_INTERNA: "Auditoria Interna",
  AUDITORIA_EXTERNA: "Auditoria Externa",
  CHAMADO_RECORRENTE: "Chamado Recorrente",
  CHECKLIST_NAO_CONFORME: "Checklist Nao Conforme",
  EVENTO_ADVERSO: "Evento Adverso",
  INDICADOR_FORA_META: "Indicador Fora da Meta",
  RECLAMACAO: "Reclamacao",
  OUTRO: "Outro",
};

const actionStatusLabels: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em Andamento",
  CONCLUIDA: "Concluida",
  VERIFICADA: "Verificada",
  CANCELADA: "Cancelada",
};

const actionStatusVariant: Record<string, "danger" | "warning" | "success" | "muted" | "info"> = {
  PENDENTE: "danger",
  EM_ANDAMENTO: "warning",
  CONCLUIDA: "success",
  VERIFICADA: "muted",
  CANCELADA: "muted",
};

const phaseLabels: Record<string, string> = {
  PLAN: "Plan",
  DO: "Do",
  CHECK: "Check",
  ACT: "Act",
};

const phaseColors: Record<string, string> = {
  PLAN: "bg-blue-100 text-blue-700",
  DO: "bg-yellow-100 text-yellow-800",
  CHECK: "bg-purple-100 text-purple-700",
  ACT: "bg-green-100 text-green-700",
};

export default async function MelhoriaPage() {
  const { tenantId, role } = await requirePermission("ticket.view");
  const canCreate = hasPermission(role, "ticket.create");

  const [nonConformities, actions] = await Promise.all([
    prisma.nonConformity.findMany({
      where: { tenantId },
      include: {
        identifier: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.improvementAction.findMany({
      where: { tenantId },
      include: {
        responsible: { select: { name: true } },
        nonConformity: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Melhoria Continua</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestao de nao conformidades e acoes de melhoria (PDCA)
          </p>
        </div>
        {canCreate && (
          <Link href="/melhoria/nova-nc">
            <Button>Nova Nao Conformidade</Button>
          </Link>
        )}
      </div>

      {/* Non-Conformities Section */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900">Nao Conformidades</h2>

        {/* Mobile: Cards */}
        <div className="mt-3 space-y-3 lg:hidden">
          {nonConformities.length === 0 ? (
            <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-400">
              Nenhuma nao conformidade registrada.
            </div>
          ) : (
            nonConformities.map((nc) => (
              <Link key={nc.id} href={`/melhoria/nc/${nc.id}`} className="block rounded-lg border bg-white p-4 shadow-sm active:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">{nc.title}</p>
                    <p className="text-xs text-gray-400">{ncSourceLabels[nc.source] || nc.source}</p>
                  </div>
                  <div className="ml-2 flex flex-shrink-0 gap-1.5">
                    <Badge variant={nc.severity === "CRITICA" ? "danger" : nc.severity === "MAIOR" ? "warning" : "muted"}>
                      {ncSeverityLabels[nc.severity] || nc.severity}
                    </Badge>
                    <Badge variant={ncStatusVariant[nc.status] || "muted"}>
                      {ncStatusLabels[nc.status] || nc.status}
                    </Badge>
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-gray-600">{nc.description}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span>Por {nc.identifier.name}</span>
                  <span>{nc.identifiedAt.toLocaleDateString("pt-BR")}</span>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Desktop: Table */}
        <div className="mt-3 hidden overflow-x-auto rounded-lg border bg-white shadow-sm lg:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Titulo</th>
                <th className="px-4 py-3">Origem</th>
                <th className="px-4 py-3">Severidade</th>
                <th className="px-4 py-3">Identificado por</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"><span className="sr-only">Acoes</span></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {nonConformities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    Nenhuma nao conformidade registrada.
                  </td>
                </tr>
              ) : (
                nonConformities.map((nc) => (
                  <tr key={nc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{nc.title}</td>
                    <td className="px-4 py-3 text-gray-600">{ncSourceLabels[nc.source] || nc.source}</td>
                    <td className="px-4 py-3">
                      <Badge variant={nc.severity === "CRITICA" ? "danger" : nc.severity === "MAIOR" ? "warning" : "muted"}>
                        {ncSeverityLabels[nc.severity] || nc.severity}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{nc.identifier.name}</td>
                    <td className="px-4 py-3 text-gray-600">{nc.identifiedAt.toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-3">
                      <Badge variant={ncStatusVariant[nc.status] || "muted"}>
                        {ncStatusLabels[nc.status] || nc.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/melhoria/nc/${nc.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
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

      {/* Improvement Actions Section */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Acoes de Melhoria (PDCA)</h2>

        {/* Mobile: Cards */}
        <div className="mt-3 space-y-3 lg:hidden">
          {actions.length === 0 ? (
            <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-400">
              Nenhuma acao de melhoria registrada.
            </div>
          ) : (
            actions.map((a) => (
              <div key={a.id} className="rounded-lg border bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">{a.title}</p>
                    {a.nonConformity && (
                      <p className="text-xs text-gray-400">NC: {a.nonConformity.title}</p>
                    )}
                  </div>
                  <div className="ml-2 flex flex-shrink-0 gap-1.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${phaseColors[a.phase]}`}>
                      {phaseLabels[a.phase] || a.phase}
                    </span>
                    <Badge variant={actionStatusVariant[a.status] || "muted"}>
                      {actionStatusLabels[a.status] || a.status}
                    </Badge>
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-gray-600">{a.description}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span>Responsavel: {a.responsible.name}</span>
                  <span>Prazo: {a.deadline.toLocaleDateString("pt-BR")}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop: Table */}
        <div className="mt-3 hidden overflow-x-auto rounded-lg border bg-white shadow-sm lg:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Titulo</th>
                <th className="px-4 py-3">NC Relacionada</th>
                <th className="px-4 py-3">Fase PDCA</th>
                <th className="px-4 py-3">Responsavel</th>
                <th className="px-4 py-3">Prazo</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {actions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Nenhuma acao de melhoria registrada.
                  </td>
                </tr>
              ) : (
                actions.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{a.title}</td>
                    <td className="px-4 py-3 text-gray-600">{a.nonConformity?.title || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${phaseColors[a.phase]}`}>
                        {phaseLabels[a.phase] || a.phase}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{a.responsible.name}</td>
                    <td className="px-4 py-3 text-gray-600">{a.deadline.toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-3">
                      <Badge variant={actionStatusVariant[a.status] || "muted"}>
                        {actionStatusLabels[a.status] || a.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
