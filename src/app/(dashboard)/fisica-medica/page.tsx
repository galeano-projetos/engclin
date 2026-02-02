import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require-role";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MedicalPhysicsType } from "@prisma/client";

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

export default async function FisicaMedicaPage() {
  const { tenantId } = await requirePermission("physics.view");
  const now = new Date();

  const tests = await prisma.medicalPhysicsTest.findMany({
    where: { tenantId },
    select: {
      id: true,
      type: true,
      status: true,
      provider: true,
      scheduledDate: true,
      dueDate: true,
      equipment: { select: { name: true, patrimony: true } },
    },
    orderBy: { dueDate: "asc" },
  });

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
            Controle de testes e laudos exigidos pela legislação (RDC 611 / IN
            90-96).
          </p>
        </div>
        <Link href="/fisica-medica/novo">
          <Button>Novo Teste</Button>
        </Link>
      </div>

      {/* Mobile: Cards */}
      <div className="mt-6 space-y-3 lg:hidden">
        {items.length === 0 ? (
          <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-400">
            Nenhum teste de física médica cadastrado.
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
                {t.provider && <span>{t.provider}</span>}
                <span>Agendado: {t.scheduledDate.toLocaleDateString("pt-BR")}</span>
                <span>Vencimento: {t.dueDate.toLocaleDateString("pt-BR")}</span>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Desktop: Tabela */}
      <div className="mt-6 hidden overflow-x-auto rounded-lg border bg-white shadow-sm lg:block">
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
                  Nenhum teste de física médica cadastrado.
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
                    {t.provider || "—"}
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
    </div>
  );
}
