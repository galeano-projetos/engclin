import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require-role";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { serviceTypeLabel } from "@/lib/utils/periodicity";

export default async function PorFornecedorPage() {
  const { tenantId } = await requirePermission("preventive.view");
  const now = new Date();

  // Get all scheduled maintenances with provider info
  const maintenances = await prisma.preventiveMaintenance.findMany({
    where: {
      tenantId,
      status: "AGENDADA",
    },
    include: {
      equipment: { select: { name: true, patrimony: true } },
      providerRef: { select: { id: true, name: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  // Group by provider
  const byProvider = new Map<
    string,
    {
      providerName: string;
      items: typeof maintenances;
    }
  >();

  for (const m of maintenances) {
    const providerName = m.providerRef?.name || m.provider || "Sem fornecedor";
    if (!byProvider.has(providerName)) {
      byProvider.set(providerName, { providerName, items: [] });
    }
    byProvider.get(providerName)!.items.push(m);
  }

  const groups = Array.from(byProvider.values()).sort(
    (a, b) => b.items.length - a.items.length
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/manutencoes"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            &larr; Voltar para manutencoes
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            Vencimentos por Fornecedor
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {maintenances.length} servico{maintenances.length !== 1 && "s"} pendente{maintenances.length !== 1 && "s"} agrupado{maintenances.length !== 1 && "s"} por fornecedor
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {groups.length === 0 ? (
          <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-400">
            Nenhum servico pendente.
          </div>
        ) : (
          groups.map((group) => {
            const overdueCount = group.items.filter(
              (m) => m.dueDate < now
            ).length;

            return (
              <div
                key={group.providerName}
                className="rounded-lg border bg-white shadow-sm"
              >
                <div className="flex items-center justify-between border-b px-5 py-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {group.providerName}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {group.items.length} servico{group.items.length !== 1 && "s"}
                      {overdueCount > 0 && (
                        <span className="ml-2 text-red-600">
                          ({overdueCount} vencido{overdueCount !== 1 && "s"})
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <ul className="divide-y">
                  {group.items.map((m) => {
                    const daysLeft = Math.ceil(
                      (m.dueDate.getTime() - now.getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    const isOverdue = daysLeft < 0;
                    return (
                      <li key={m.id} className="px-5 py-3">
                        <Link
                          href={`/manutencoes/${m.id}`}
                          className="flex items-center justify-between hover:bg-gray-50"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {m.equipment.name}
                              {m.equipment.patrimony && (
                                <span className="ml-1 text-xs text-gray-400">
                                  ({m.equipment.patrimony})
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">
                              {serviceTypeLabel(m.serviceType)} — Vencimento:{" "}
                              {m.dueDate.toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <Badge
                            variant={
                              isOverdue
                                ? "danger"
                                : daysLeft <= 30
                                  ? "warning"
                                  : "info"
                            }
                          >
                            {isOverdue
                              ? `${Math.abs(daysLeft)}d atrasado`
                              : `${daysLeft}d restante${daysLeft !== 1 ? "s" : ""}`}
                          </Badge>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
