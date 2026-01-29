"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { executePreventive, deletePreventive } from "../actions";
import Link from "next/link";

interface MaintenanceData {
  id: string;
  type: string;
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
}: {
  maintenance: MaintenanceData;
}) {
  const [showExecuteForm, setShowExecuteForm] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canExecute =
    maintenance.status === "AGENDADA" || maintenance.displayStatus === "VENCIDA";

  async function handleExecute(formData: FormData) {
    setExecuting(true);
    await executePreventive(maintenance.id, formData);
  }

  async function handleDelete() {
    if (!confirm("Deseja excluir esta manutenção preventiva?")) return;
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
            &larr; Voltar para manutenções
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            {maintenance.type}
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
            Registrar Execução
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
                id="cost"
                name="cost"
                label="Custo do Serviço (R$)"
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
                label="Observações"
                placeholder="Notas adicionais..."
              />
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
          <InfoRow label="Tipo" value={maintenance.type} />
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
                label="Data de Execução"
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
              <InfoRow label="Observações" value={maintenance.notes} />
            </>
          )}
        </dl>
      </div>
    </div>
  );
}
