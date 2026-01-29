"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { executePhysicsTest, deletePhysicsTest } from "../actions";
import Link from "next/link";

interface TestData {
  id: string;
  type: string;
  status: string;
  displayStatus: string;
  scheduledDate: string;
  dueDate: string;
  executionDate: string | null;
  provider: string | null;
  reportUrl: string | null;
  notes: string | null;
  equipmentName: string;
  equipmentId: string;
  equipmentPatrimony: string | null;
}

const typeLabels: Record<string, string> = {
  CONTROLE_QUALIDADE: "Controle de Qualidade",
  TESTE_CONSTANCIA: "Teste de Constância",
  LEVANTAMENTO_RADIOMETRICO: "Levantamento Radiométrico",
  TESTE_RADIACAO_FUGA: "Teste de Radiação de Fuga",
};

const statusVariant: Record<string, "info" | "success" | "danger"> = {
  AGENDADA: "info",
  REALIZADA: "success",
  VENCIDA: "danger",
};

const statusLabels: Record<string, string> = {
  AGENDADA: "Agendado",
  REALIZADA: "Realizado",
  VENCIDA: "Vencido",
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
        {value || "—"}
      </dd>
    </div>
  );
}

export function PhysicsTestDetails({ test }: { test: TestData }) {
  const [showExecuteForm, setShowExecuteForm] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canExecute =
    test.status === "AGENDADA" || test.displayStatus === "VENCIDA";

  async function handleExecute(formData: FormData) {
    setExecuting(true);
    await executePhysicsTest(test.id, formData);
  }

  async function handleDelete() {
    if (!confirm("Deseja excluir este teste de física médica?")) return;
    setDeleting(true);
    await deletePhysicsTest(test.id);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/fisica-medica"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            &larr; Voltar para Física Médica
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            {typeLabels[test.type] || test.type}
          </h1>
          <p className="text-sm text-gray-500">
            {test.equipmentName}
            {test.equipmentPatrimony && ` (${test.equipmentPatrimony})`}
          </p>
        </div>
        <div className="flex gap-2">
          {canExecute && (
            <Button onClick={() => setShowExecuteForm(!showExecuteForm)}>
              Registrar Execução
            </Button>
          )}
          <Button variant="danger" loading={deleting} onClick={handleDelete}>
            Excluir
          </Button>
        </div>
      </div>

      {/* Formulário de execução */}
      {showExecuteForm && (
        <div className="mt-6 rounded-lg border bg-blue-50 p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Registrar Execução do Teste
          </h2>
          <form action={handleExecute} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="executionDate"
                name="executionDate"
                label="Data de Execução *"
                type="date"
                required
              />
              <Input
                id="reportUrl"
                name="reportUrl"
                label="URL do Laudo"
                type="url"
                placeholder="https://..."
              />
              <div className="sm:col-span-2">
                <Input
                  id="notes"
                  name="notes"
                  label="Observações"
                  placeholder="Notas adicionais..."
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" loading={executing}>
                Confirmar Execução
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowExecuteForm(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Detalhes */}
      <div className="mt-6 rounded-lg border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Detalhes</h2>
        </div>
        <dl className="divide-y px-6">
          <InfoRow
            label="Tipo de Teste"
            value={typeLabels[test.type] || test.type}
          />
          <InfoRow
            label="Equipamento"
            value={
              <Link
                href={`/equipamentos/${test.equipmentId}`}
                className="text-blue-600 hover:text-blue-800"
              >
                {test.equipmentName}
              </Link>
            }
          />
          <InfoRow label="Fornecedor" value={test.provider} />
          <InfoRow
            label="Status"
            value={
              <Badge variant={statusVariant[test.displayStatus]}>
                {statusLabels[test.displayStatus]}
              </Badge>
            }
          />
          <InfoRow
            label="Data Agendada"
            value={new Date(test.scheduledDate).toLocaleDateString("pt-BR")}
          />
          <InfoRow
            label="Vencimento"
            value={new Date(test.dueDate).toLocaleDateString("pt-BR")}
          />
          {test.status === "REALIZADA" && (
            <>
              <InfoRow
                label="Data de Execução"
                value={
                  test.executionDate
                    ? new Date(test.executionDate).toLocaleDateString("pt-BR")
                    : null
                }
              />
              <InfoRow
                label="Laudo"
                value={
                  test.reportUrl ? (
                    <a
                      href={test.reportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Ver laudo
                    </a>
                  ) : null
                }
              />
            </>
          )}
          <InfoRow label="Observações" value={test.notes} />
        </dl>
      </div>

      {/* Aviso sobre regra especial */}
      <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800">
          <strong>Regra RDC 611:</strong> Se uma manutenção corretiva for
          registrada para este equipamento, todos os testes de física médica
          realizados serão automaticamente invalidados, exigindo novo
          agendamento.
        </p>
      </div>
    </div>
  );
}
