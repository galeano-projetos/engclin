import Link from "next/link";
import { prisma } from "@/lib/db";
import { getTenantId } from "@/lib/tenant";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MaintenanceFilters } from "./maintenance-filters";
import { MaintenanceStatus } from "@prisma/client";

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

interface PageProps {
  searchParams: Promise<{
    status?: MaintenanceStatus;
    equipmentId?: string;
  }>;
}

export default async function ManutencoesPage({ searchParams }: PageProps) {
  const tenantId = await getTenantId();
  const params = await searchParams;
  const { status, equipmentId } = params;

  const now = new Date();

  const maintenances = await prisma.preventiveMaintenance.findMany({
    where: {
      tenantId,
      ...(status && { status }),
      ...(equipmentId && { equipmentId }),
    },
    include: {
      equipment: { select: { name: true, patrimony: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  // Calcula status visual (vencida se passou da data e não foi realizada)
  const items = maintenances.map((m) => {
    let displayStatus = m.status as string;
    if (m.status === "AGENDADA" && m.dueDate < now) {
      displayStatus = "VENCIDA";
    }
    return { ...m, displayStatus };
  });

  // Filtro adicional no lado do servidor para status "VENCIDA" virtual
  const filteredItems =
    status === "VENCIDA"
      ? items.filter((i) => i.displayStatus === "VENCIDA")
      : status
        ? items
        : items;

  const equipments = await prisma.equipment.findMany({
    where: { tenantId, status: { not: "DESCARTADO" } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Manutenções Preventivas
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {filteredItems.length} manutenção{filteredItems.length !== 1 && "ões"} encontrada{filteredItems.length !== 1 && "s"}
          </p>
        </div>
        <Link href="/manutencoes/nova">
          <Button>Nova Preventiva</Button>
        </Link>
      </div>

      <MaintenanceFilters equipments={equipments} />

      {/* Mobile: Cards */}
      <div className="mt-4 space-y-3 lg:hidden">
        {filteredItems.length === 0 ? (
          <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-400">
            Nenhuma manutenção encontrada.
          </div>
        ) : (
          filteredItems.map((m) => (
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
              <div className="mt-2 text-sm text-gray-600">{m.type}</div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                {m.provider && <span>{m.provider}</span>}
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
              <th className="px-4 py-3">Equipamento</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Fornecedor</th>
              <th className="px-4 py-3">Data Agendada</th>
              <th className="px-4 py-3">Vencimento</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Nenhuma manutenção encontrada.
                </td>
              </tr>
            ) : (
              filteredItems.map((m) => (
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
                  <td className="px-4 py-3 text-gray-600">{m.type}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {m.provider || "—"}
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
    </div>
  );
}
