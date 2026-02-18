"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { startOsExecution, completeOs } from "../actions";
import { printOs } from "./os-print";

const statusLabels: Record<string, string> = {
  ABERTA: "Aberta",
  EM_EXECUCAO: "Em Execução",
  CONCLUIDA: "Concluída",
};

const statusVariant: Record<string, "info" | "warning" | "success"> = {
  ABERTA: "info",
  EM_EXECUCAO: "warning",
  CONCLUIDA: "success",
};

const urgencyLabels: Record<string, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  CRITICA: "Crítica",
};

const serviceTypeLabels: Record<string, string> = {
  PREVENTIVA: "Preventiva",
  CALIBRACAO: "Calibração",
  TSE: "TSE",
};

interface OsData {
  id: string;
  number: number;
  status: string;
  issuedAt: string;
  completedAt: string | null;
  tenantName: string;
  tipo: string;
  equipmentName: string;
  equipmentBrand: string | null;
  equipmentModel: string | null;
  equipmentSerialNumber: string | null;
  equipmentPatrimony: string | null;
  unitName: string;
  serviceType: string | null;
  description: string | null;
  provider: string | null;
  urgency: string | null;
  scheduledDate: string | null;
  dueDate: string | null;
  executionDate: string | null;
  diagnosis: string | null;
  solution: string | null;
  partsUsed: string | null;
  timeSpent: number | null;
  cost: number | null;
  openedByName: string | null;
  assignedToName: string | null;
  notes: string | null;
  canManage: boolean;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function OsDetails({ os }: { os: OsData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleStart() {
    startTransition(async () => {
      await startOsExecution(os.id);
      router.refresh();
    });
  }

  function handleComplete() {
    startTransition(async () => {
      await completeOs(os.id);
      router.refresh();
    });
  }

  const osNumber = `OS-${String(os.number).padStart(4, "0")}`;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{osNumber}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={statusVariant[os.status] || "info"}>
              {statusLabels[os.status] || os.status}
            </Badge>
            <Badge variant="muted">{os.tipo}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => printOs(os, osNumber)}>
            Imprimir OS
          </Button>
          {os.canManage && os.status === "ABERTA" && (
            <Button onClick={handleStart} loading={isPending}>
              Iniciar Execução
            </Button>
          )}
          {os.canManage && os.status === "EM_EXECUCAO" && (
            <Button onClick={handleComplete} loading={isPending}>
              Concluir OS
            </Button>
          )}
          <Button variant="ghost" onClick={() => router.push("/ordens-servico")}>
            Voltar
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Dados do Equipamento */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Dados do Equipamento
          </h2>
          <dl className="space-y-3">
            <Row label="Nome" value={os.equipmentName} />
            {(os.equipmentBrand || os.equipmentModel) && (
              <Row
                label="Marca / Modelo"
                value={[os.equipmentBrand, os.equipmentModel].filter(Boolean).join(" / ")}
              />
            )}
            {os.equipmentSerialNumber && (
              <Row label="Nº de Série" value={os.equipmentSerialNumber} />
            )}
            {os.equipmentPatrimony && (
              <Row label="Patrimônio" value={os.equipmentPatrimony} />
            )}
            <Row label="Setor" value={os.unitName} />
          </dl>
        </div>

        {/* Dados do Serviço */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Dados do Serviço
          </h2>
          <dl className="space-y-3">
            <Row label="Tipo" value={os.tipo} />
            {os.serviceType && (
              <Row label="Serviço" value={serviceTypeLabels[os.serviceType] || os.serviceType} />
            )}
            {os.provider && <Row label="Fornecedor" value={os.provider} />}
            {os.urgency && (
              <Row label="Urgência" value={urgencyLabels[os.urgency] || os.urgency} />
            )}
            {os.openedByName && <Row label="Aberto por" value={os.openedByName} />}
            {os.assignedToName && <Row label="Técnico" value={os.assignedToName} />}
            {os.cost != null && (
              <Row
                label="Custo"
                value={os.cost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              />
            )}
          </dl>
        </div>

        {/* Cronograma */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Cronograma
          </h2>
          <dl className="space-y-3">
            <Row label="Emissão" value={formatDate(os.issuedAt)} />
            {os.scheduledDate && (
              <Row label="Agendamento" value={formatDate(os.scheduledDate)} />
            )}
            {os.dueDate && (
              <Row label="Vencimento" value={formatDate(os.dueDate)} />
            )}
            {os.executionDate && (
              <Row label="Execução" value={formatDate(os.executionDate)} />
            )}
            <Row label="Conclusão" value={formatDate(os.completedAt)} />
          </dl>
        </div>

        {/* Observações */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Observações
          </h2>
          <dl className="space-y-3">
            {os.description && <Row label="Descrição" value={os.description} />}
            {os.diagnosis && <Row label="Diagnóstico" value={os.diagnosis} />}
            {os.solution && <Row label="Solução" value={os.solution} />}
            {os.partsUsed && <Row label="Peças utilizadas" value={os.partsUsed} />}
            {os.timeSpent != null && (
              <Row label="Tempo gasto" value={`${os.timeSpent} min`} />
            )}
            {os.notes && <Row label="Notas" value={os.notes} />}
            {!os.description && !os.diagnosis && !os.solution && !os.notes && (
              <p className="text-sm text-gray-400">Nenhuma observação registrada.</p>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-sm text-gray-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-gray-900">{value}</dd>
    </div>
  );
}
