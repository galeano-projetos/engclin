"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { executePreventive, deletePreventive } from "../actions";
import { serviceTypeLabel } from "@/lib/utils/periodicity";
import Link from "next/link";

interface MaintenanceData {
  id: string;
  type: string;
  serviceType: string;
  status: string;
  displayStatus: string;
  scheduledDate: string;
  dueDate: string;
  executionDate: string | null;
  periodicityMonths: number;
  provider: string | null;
  cost: number | null;
  certificateUrl: string | null;
  notes: string | null;
  equipmentName: string;
  equipmentId: string;
  equipmentPatrimony: string | null;
}

interface ChecklistTemplateData {
  id: string;
  name: string;
  items: { id: string; description: string; order: number }[];
}

interface ChecklistResultData {
  id: string;
  templateName: string;
  completedAt: string;
  items: { description: string; status: string; observation: string | null }[];
}

const statusVariant: Record<string, "info" | "success" | "danger"> = {
  AGENDADA: "info",
  REALIZADA: "success",
  VENCIDA: "danger",
};

const statusLabels: Record<string, string> = {
  AGENDADA: "Agendada",
  REALIZADA: "Realizada",
  VENCIDA: "Vencida",
};

const periodicityLabels: Record<number, string> = {
  3: "Trimestral",
  6: "Semestral",
  12: "Anual",
  24: "Bienal",
  60: "Quinquenal",
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

export function PreventiveDetails({
  maintenance,
  checklistTemplates = [],
  checklistResults = [],
}: {
  maintenance: MaintenanceData;
  checklistTemplates?: ChecklistTemplateData[];
  checklistResults?: ChecklistResultData[];
}) {
  const [showExecuteForm, setShowExecuteForm] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [checklistAnswers, setChecklistAnswers] = useState<
    Record<string, { status: string; observation: string }>
  >({});

  function markAllConforme() {
    const allAnswers: Record<string, { status: string; observation: string }> = {};
    for (const template of checklistTemplates) {
      for (const item of template.items) {
        allAnswers[item.id] = { status: "CONFORME", observation: "" };
      }
    }
    setChecklistAnswers(allAnswers);
  }

  const canExecute =
    maintenance.status === "AGENDADA" || maintenance.displayStatus === "VENCIDA";

  async function handleExecute(formData: FormData) {
    setExecuting(true);
    await executePreventive(maintenance.id, formData);
  }

  async function handleDelete() {
    if (!confirm("Deseja excluir esta manutencao preventiva?")) return;
    setDeleting(true);
    await deletePreventive(maintenance.id);
  }

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
            {serviceTypeLabel(maintenance.serviceType)}
          </h1>
          <p className="text-sm text-gray-500">
            {maintenance.equipmentName}
            {maintenance.equipmentPatrimony &&
              ` (${maintenance.equipmentPatrimony})`}
          </p>
        </div>
        <div className="flex gap-2">
          {canExecute && (
            <Button onClick={() => setShowExecuteForm(!showExecuteForm)}>
              Registrar Execucao
            </Button>
          )}
          <Button variant="danger" loading={deleting} onClick={handleDelete}>
            Excluir
          </Button>
        </div>
      </div>

      {/* Formulario de execucao */}
      {showExecuteForm && (
        <div className="mt-6 rounded-lg border bg-blue-50 p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Registrar Execucao
          </h2>
          <p className="mb-4 text-xs text-gray-500">
            Ao confirmar, a proxima manutencao sera gerada automaticamente.
          </p>
          <form action={handleExecute} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="executionDate"
                name="executionDate"
                label="Data de Execucao *"
                type="date"
                required
              />
              <Input
                id="cost"
                name="cost"
                label="Custo do Servico (R$)"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 1500.00"
              />
              <Input
                id="certificateUrl"
                name="certificateUrl"
                label="URL do Certificado"
                type="url"
                placeholder="https://..."
              />
              <Input
                id="notes"
                name="notes"
                label="Observacoes"
                placeholder="Notas adicionais..."
              />
            </div>

            {checklistTemplates.length > 0 && (
              <div className="border-t pt-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Checklist de Verificacao
                  </h3>
                  <button
                    type="button"
                    onClick={markAllConforme}
                    className="rounded-md bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 ring-1 ring-green-600/20 hover:bg-green-100 transition-colors"
                  >
                    Marcar Todos Conforme
                  </button>
                </div>
                {checklistTemplates.map((template) => (
                  <div key={template.id} className="mb-4">
                    <p className="mb-2 text-sm font-medium text-gray-600">
                      {template.name}
                    </p>
                    <input type="hidden" name="checklistTemplateId" value={template.id} />
                    <div className="space-y-2">
                      {template.items.map((item) => (
                        <div
                          key={item.id}
                          className="rounded border bg-white p-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex-1 text-sm text-gray-700">
                              {item.description}
                            </span>
                            <select
                              name={`checklist_${item.id}_status`}
                              required
                              className="rounded border px-2 py-1 text-sm"
                              value={checklistAnswers[item.id]?.status || ""}
                              onChange={(e) =>
                                setChecklistAnswers((prev) => ({
                                  ...prev,
                                  [item.id]: {
                                    status: e.target.value,
                                    observation: prev[item.id]?.observation || "",
                                  },
                                }))
                              }
                            >
                              <option value="" disabled>
                                --
                              </option>
                              <option value="CONFORME">Conforme</option>
                              <option value="NAO_CONFORME">Nao Conforme</option>
                            </select>
                          </div>
                          {checklistAnswers[item.id]?.status === "NAO_CONFORME" && (
                            <input
                              type="text"
                              name={`checklist_${item.id}_obs`}
                              placeholder="Observacao..."
                              className="mt-2 w-full rounded border px-2 py-1 text-sm"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" loading={executing}>
                Confirmar Execucao
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
            label="Tipo de Servico"
            value={
              <Badge variant="muted">
                {serviceTypeLabel(maintenance.serviceType)}
              </Badge>
            }
          />
          <InfoRow label="Descricao Legado" value={maintenance.type} />
          <InfoRow
            label="Equipamento"
            value={
              <Link
                href={`/equipamentos/${maintenance.equipmentId}`}
                className="text-blue-600 hover:text-blue-800"
              >
                {maintenance.equipmentName}
              </Link>
            }
          />
          <InfoRow label="Fornecedor" value={maintenance.provider} />
          <InfoRow
            label="Status"
            value={
              <Badge variant={statusVariant[maintenance.displayStatus]}>
                {statusLabels[maintenance.displayStatus]}
              </Badge>
            }
          />
          <InfoRow
            label="Data Agendada"
            value={new Date(maintenance.scheduledDate).toLocaleDateString("pt-BR")}
          />
          <InfoRow
            label="Vencimento"
            value={new Date(maintenance.dueDate).toLocaleDateString("pt-BR")}
          />
          <InfoRow
            label="Periodicidade"
            value={
              periodicityLabels[maintenance.periodicityMonths] ||
              `${maintenance.periodicityMonths} meses`
            }
          />
          {maintenance.status === "REALIZADA" && (
            <>
              <InfoRow
                label="Data de Execucao"
                value={
                  maintenance.executionDate
                    ? new Date(maintenance.executionDate).toLocaleDateString("pt-BR")
                    : null
                }
              />
              <InfoRow
                label="Custo"
                value={
                  maintenance.cost != null
                    ? `R$ ${maintenance.cost.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}`
                    : null
                }
              />
              <InfoRow
                label="Certificado"
                value={
                  maintenance.certificateUrl ? (
                    <a
                      href={maintenance.certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Ver certificado
                    </a>
                  ) : null
                }
              />
              <InfoRow label="Observacoes" value={maintenance.notes} />
            </>
          )}
        </dl>
      </div>

      {checklistResults.length > 0 && (
        <div className="mt-6 rounded-lg border bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Checklist de Verificacao
            </h2>
          </div>
          {checklistResults.map((result) => (
            <div key={result.id} className="px-6 py-4">
              <p className="mb-2 text-sm font-medium text-gray-700">
                {result.templateName}
                <span className="ml-2 text-xs text-gray-400">
                  Preenchido em{" "}
                  {new Date(result.completedAt).toLocaleDateString("pt-BR")}
                </span>
              </p>
              <div className="space-y-1">
                {result.items.map((ri, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center gap-2 py-1 text-sm"
                  >
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        ri.status === "CONFORME" ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    <span className="text-gray-700">{ri.description}</span>
                    <Badge
                      variant={ri.status === "CONFORME" ? "success" : "danger"}
                    >
                      {ri.status === "CONFORME" ? "Conforme" : "Nao Conforme"}
                    </Badge>
                    {ri.observation && (
                      <span className="text-xs italic text-gray-500">
                        ({ri.observation})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
