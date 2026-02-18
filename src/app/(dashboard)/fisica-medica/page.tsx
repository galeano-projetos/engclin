import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require-role";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PhysicsFilters } from "./physics-filters";
import { Pagination } from "@/components/shared/pagination";
import { SyncSeproradButton } from "./sync-seprorad-button";
import { MaintenanceStatus, MedicalPhysicsType } from "@prisma/client";

const typeLabels: Record<MedicalPhysicsType, string> = {
  CONTROLE_QUALIDADE: "Controle de Qualidade",
  TESTE_CONSTANCIA: "Teste de Constância",
  LEVANTAMENTO_RADIOMETRICO: "Levantamento Radiométrico",
  TESTE_RADIACAO_FUGA: "Teste de Radiação de Fuga",
};

const statusLabels: Record<string, string> = {
  AGENDADA: "Agendado",
  REALIZADA: "Realizado",
  VENCIDA: "Vencido",
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
    type?: MedicalPhysicsType;
    equipmentId?: string;
    page?: string;
    perPage?: string;
  }>;
}

export default async function FisicaMedicaPage({ searchParams }: PageProps) {
  const { tenantId } = await requirePermission("physics.view");
  const params = await searchParams;
  const { status, type, equipmentId } = params;

  const page = Math.max(1, parseInt(params.page || "1") || 1);
  const rawPerPage = parseInt(params.perPage || "20") || 20;
  const perPage = VALID_PER_PAGE.includes(rawPerPage) ? rawPerPage : 20;
  const showAll = perPage === 0;

  const now = new Date();

  const whereClause = {
    tenantId,
    ...(status === "VENCIDA"
      ? { status: "AGENDADA" as MaintenanceStatus, dueDate: { lt: now } }
      : status
        ? { status }
        : {}),
    ...(type && { type }),
    ...(equipmentId && { equipmentId }),
  };

  const [tests, totalCount, equipments] = await Promise.all([
    prisma.medicalPhysicsTest.findMany({
      where: whereClause,
      select: {
        id: true,
        type: true,
        status: true,
        provider: true,
        providerRef: { select: { name: true } },
        scheduledDate: true,
        dueDate: true,
        equipment: { select: { name: true, patrimony: true } },
      },
      orderBy: { dueDate: "asc" },
      ...(showAll ? {} : { skip: (page - 1) * perPage, take: perPage }),
    }),
    prisma.medicalPhysicsTest.count({ where: whereClause }),
    prisma.equipment.findMany({
      where: {
        tenantId,
        medicalPhysicsTests: { some: {} },
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const totalPages = showAll ? 1 : Math.ceil(totalCount / perPage);

  const items = tests.map((t) => {
    let displayStatus = t.status as string;
    if (t.status === "AGENDADA" && t.dueDate < now) {
      displayStatus = "VENCIDA";
    }
    return { ...t, displayStatus };
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Física Médica</h1>
          <p className="mt-1 text-sm text-gray-500">
            {totalCount}{" "}
            {totalCount === 1 ? "teste encontrado" : "testes encontrados"}
            {!showAll && totalCount > perPage && (
              <span> — mostrando {(page - 1) * perPage + 1} a {Math.min(page * perPage, totalCount)}</span>
            )}
            {" "}(RDC 611 / IN 90-96)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SyncSeproradButton />
          <Link href="/fisica-medica/novo">
            <Button>Novo Teste</Button>
          </Link>
        </div>
      </div>

      <PhysicsFilters equipments={equipments} />

      {/* Mobile: Cards */}
      <div className="mt-4 space-y-3 lg:hidden">
        {items.length === 0 ? (
          <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-400">
            Nenhum teste de física médica encontrado.
          </div>
        ) : (
          items.map((t) => (
            <Link key={t.id} href={`/fisica-medica/${t.id}`} className="block rounded-lg border bg-white p-4 shadow-sm active:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">{t.equipment.name}</p>
                  {t.equipment.patrimony && (
                    <p className="text-xs text-gray-400">{t.equipment.patrimony}</p>
                  )}
                </div>
                <Badge variant={statusVariant[t.displayStatus] || "info"}>
                  {statusLabels[t.displayStatus] || t.displayStatus}
                </Badge>
              </div>
              <div className="mt-2 text-sm text-gray-600">{typeLabels[t.type]}</div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                {(t.providerRef?.name || t.provider) && <span>{t.providerRef?.name || t.provider}</span>}
                <span>Agendado: {t.scheduledDate.toLocaleDateString("pt-BR")}</span>
                <span>Vencimento: {t.dueDate.toLocaleDateString("pt-BR")}</span>
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
              <th scope="col" className="px-4 py-3">Tipo de Teste</th>
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
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  Nenhum teste de física médica encontrado.
                </td>
              </tr>
            ) : (
              items.map((t) => (
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
                  <td className="px-4 py-3 text-gray-600">
                    {typeLabels[t.type]}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {t.providerRef?.name || t.provider || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {t.scheduledDate.toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {t.dueDate.toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[t.displayStatus] || "info"}>
                      {statusLabels[t.displayStatus] || t.displayStatus}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/fisica-medica/${t.id}`}
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

      <Pagination
        basePath="/fisica-medica"
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        perPage={perPage}
      />
    </div>
  );
}
