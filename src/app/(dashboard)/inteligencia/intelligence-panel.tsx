"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  runCostBenefitAgent,
  runPredictiveAgent,
  runPrioritizationAgent,
  runPredictiveAlertAgent,
} from "./agents";
import type {
  CostBenefitInsight,
  PredictiveInsight,
  PrioritizationInsight,
  PredictiveAlertInsight,
} from "./agents";
import { formatHours } from "@/lib/mtbf-mttr";

type ActiveAgent = "cost" | "predictive" | "priority" | "predictive-alert" | null;

export function IntelligencePanel() {
  const [activeAgent, setActiveAgent] = useState<ActiveAgent>(null);
  const [loading, setLoading] = useState(false);

  const [costData, setCostData] = useState<CostBenefitInsight[] | null>(null);
  const [predictiveData, setPredictiveData] = useState<PredictiveInsight[] | null>(null);
  const [priorityData, setPriorityData] = useState<PrioritizationInsight[] | null>(null);
  const [alertData, setAlertData] = useState<PredictiveAlertInsight[] | null>(null);

  async function handleRunAgent(agent: ActiveAgent) {
    if (!agent) return;
    setActiveAgent(agent);
    setLoading(true);

    try {
      if (agent === "cost") {
        const data = await runCostBenefitAgent();
        setCostData(data);
      } else if (agent === "predictive") {
        const data = await runPredictiveAgent();
        setPredictiveData(data);
      } else if (agent === "priority") {
        const data = await runPrioritizationAgent();
        setPriorityData(data);
      } else if (agent === "predictive-alert") {
        const data = await runPredictiveAlertAgent();
        setAlertData(data);
      }
    } catch {
      // Error handled silently - agent results are shown as empty
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Cards dos agentes */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AgentCard
          title="Custo-Benefício"
          description="Analisa custos acumulados de manutenção vs. valor de aquisição e recomenda substituição quando necessário."
          icon={
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          active={activeAgent === "cost"}
          loading={loading && activeAgent === "cost"}
          onRun={() => handleRunAgent("cost")}
        />
        <AgentCard
          title="Manutenção Preditiva"
          description="Identifica padrões de falhas recorrentes em modelos de equipamentos e sugere planos preventivos."
          icon={
            <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
            </svg>
          }
          active={activeAgent === "predictive"}
          loading={loading && activeAgent === "predictive"}
          onRun={() => handleRunAgent("predictive")}
        />
        <AgentCard
          title="Priorização de Chamados"
          description="Analisa criticidade do equipamento e urgência para sugerir ordem de prioridade no atendimento."
          icon={
            <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
            </svg>
          }
          active={activeAgent === "priority"}
          loading={loading && activeAgent === "priority"}
          onRun={() => handleRunAgent("priority")}
        />
        <AgentCard
          title="Análise Preditiva"
          description="Identifica equipamentos se aproximando do tempo médio entre falhas (MTBF) do seu modelo."
          icon={
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          }
          active={activeAgent === "predictive-alert"}
          loading={loading && activeAgent === "predictive-alert"}
          onRun={() => handleRunAgent("predictive-alert")}
        />
      </div>

      {/* Resultados */}
      {activeAgent === "cost" && costData && !loading && (
        <CostBenefitResults data={costData} />
      )}
      {activeAgent === "predictive" && predictiveData && !loading && (
        <PredictiveResults data={predictiveData} />
      )}
      {activeAgent === "priority" && priorityData && !loading && (
        <PrioritizationResults data={priorityData} />
      )}
      {activeAgent === "predictive-alert" && alertData && !loading && (
        <PredictiveAlertResults data={alertData} />
      )}
    </div>
  );
}

// ============================================================
// Card de Agente
// ============================================================

function AgentCard({
  title,
  description,
  icon,
  active,
  loading,
  onRun,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  active: boolean;
  loading: boolean;
  onRun: () => void;
}) {
  return (
    <div
      className={`rounded-lg border p-5 shadow-sm transition-colors ${
        active ? "border-blue-300 bg-blue-50" : "bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        {icon}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <div className="mt-4">
        <Button onClick={onRun} loading={loading} className="w-full">
          {loading ? "Analisando..." : "Executar Análise"}
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// Resultados: Custo-Benefício
// ============================================================

function CostBenefitResults({ data }: { data: CostBenefitInsight[] }) {
  if (data.length === 0) {
    return (
      <EmptyResults message="Nenhum equipamento com valor de aquisição cadastrado para análise." />
    );
  }

  const substituir = data.filter((d) => d.recommendation === "substituir");
  const monitorar = data.filter((d) => d.recommendation === "monitorar");

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="border-b px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Análise de Custo-Benefício
        </h2>
        <p className="text-sm text-gray-500">
          {data.length} equipamentos analisados —{" "}
          <span className="font-medium text-red-600">
            {substituir.length} para substituição
          </span>
          ,{" "}
          <span className="font-medium text-yellow-600">
            {monitorar.length} em monitoramento
          </span>
        </p>
      </div>

      {substituir.length > 0 && (
        <div className="border-b px-6 py-4">
          <h3 className="mb-3 text-sm font-semibold text-red-700">
            Recomendação: Avaliar Substituição
          </h3>
          <div className="space-y-3">
            {substituir.map((item) => (
              <CostBenefitCard key={item.equipmentId} item={item} />
            ))}
          </div>
        </div>
      )}

      {monitorar.length > 0 && (
        <div className="border-b px-6 py-4">
          <h3 className="mb-3 text-sm font-semibold text-yellow-700">
            Recomendação: Monitorar de Perto
          </h3>
          <div className="space-y-3">
            {monitorar.map((item) => (
              <CostBenefitCard key={item.equipmentId} item={item} />
            ))}
          </div>
        </div>
      )}

      {data.filter((d) => d.recommendation === "adequado").length > 0 && (
        <div className="px-6 py-4">
          <h3 className="mb-3 text-sm font-semibold text-green-700">
            Custo Adequado
          </h3>
          <div className="space-y-3">
            {data
              .filter((d) => d.recommendation === "adequado")
              .slice(0, 5)
              .map((item) => (
                <CostBenefitCard key={item.equipmentId} item={item} />
              ))}
            {data.filter((d) => d.recommendation === "adequado").length > 5 && (
              <p className="text-xs text-gray-400">
                ... e mais{" "}
                {data.filter((d) => d.recommendation === "adequado").length - 5}{" "}
                equipamentos com custo adequado.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CostBenefitCard({ item }: { item: CostBenefitInsight }) {
  const badgeVariant =
    item.recommendation === "substituir"
      ? "danger"
      : item.recommendation === "monitorar"
        ? "warning"
        : "success";

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href={`/equipamentos/${item.equipmentId}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            {item.equipmentName}
          </Link>
          <p className="text-xs text-gray-500">
            {item.unitName}
            {item.patrimony && ` — Pat: ${item.patrimony}`}
            {item.ageYears > 0 && ` — ${item.ageYears} anos`}
          </p>
        </div>
        <Badge variant={badgeVariant}>
          {(item.costRatio * 100).toFixed(0)}% do valor
        </Badge>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
        <div>
          <span className="text-gray-500">Aquisição:</span>{" "}
          <span className="font-medium">
            R$ {item.acquisitionValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Manutenção total:</span>{" "}
          <span className="font-medium">
            R$ {item.totalMaintenanceCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Corretivas:</span>{" "}
          <span className="font-medium">{item.correctiveCount}</span>
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-600">{item.reasoning}</p>
    </div>
  );
}

// ============================================================
// Resultados: Manutenção Preditiva
// ============================================================

function PredictiveResults({ data }: { data: PredictiveInsight[] }) {
  if (data.length === 0) {
    return (
      <EmptyResults message="Dados insuficientes para análise preditiva. É necessário ao menos 2 equipamentos do mesmo modelo com histórico de chamados." />
    );
  }

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="border-b px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Análise Preditiva de Falhas
        </h2>
        <p className="text-sm text-gray-500">
          {data.length} modelos de equipamento analisados
        </p>
      </div>

      <div className="divide-y">
        {data.map((insight, idx) => (
          <div key={idx} className="px-6 py-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {insight.brand} — {insight.model}
                </h3>
                <p className="text-xs text-gray-500">
                  {insight.equipmentCount} unidades |{" "}
                  {insight.totalFailures} falhas totais |{" "}
                  {insight.avgFailuresPerUnit} falhas/unidade
                </p>
              </div>
              <Badge
                variant={
                  insight.avgFailuresPerUnit >= 3
                    ? "danger"
                    : insight.avgFailuresPerUnit >= 1.5
                      ? "warning"
                      : "info"
                }
              >
                {insight.avgFailuresPerUnit >= 3
                  ? "Crítico"
                  : insight.avgFailuresPerUnit >= 1.5
                    ? "Atenção"
                    : "Normal"}
              </Badge>
            </div>

            {insight.mostCommonIssues.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {insight.mostCommonIssues.map((issue) => (
                  <span
                    key={issue}
                    className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                  >
                    {issue}
                  </span>
                ))}
              </div>
            )}

            <p className="mt-2 text-xs text-gray-600">
              {insight.recommendation}
            </p>

            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-blue-600 hover:text-blue-800">
                Ver equipamentos afetados ({insight.affectedEquipments.length})
              </summary>
              <ul className="mt-1 space-y-0.5 pl-4">
                {insight.affectedEquipments.map((eq) => (
                  <li key={eq.id}>
                    <Link
                      href={`/equipamentos/${eq.id}`}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      {eq.name}
                      {eq.patrimony && ` (${eq.patrimony})`}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Resultados: Priorização de Chamados
// ============================================================

function PrioritizationResults({ data }: { data: PrioritizationInsight[] }) {
  if (data.length === 0) {
    return (
      <EmptyResults message="Nenhum chamado aberto para priorização." />
    );
  }

  const priorityColors: Record<string, string> = {
    Urgente: "bg-red-500",
    Alta: "bg-orange-500",
    Moderada: "bg-yellow-500",
    Baixa: "bg-gray-400",
  };

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="border-b px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Ordem de Prioridade Sugerida
        </h2>
        <p className="text-sm text-gray-500">
          {data.length} chamados abertos ordenados por prioridade
        </p>
      </div>

      <div className="divide-y">
        {data.map((ticket, idx) => (
          <div key={ticket.ticketId} className="px-6 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">
                {idx + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      href={`/chamados/${ticket.ticketId}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      {ticket.equipmentName}
                    </Link>
                    <p className="text-xs text-gray-500">
                      Criticidade: {ticket.equipmentCriticality} | Urgência:{" "}
                      {ticket.urgency} | Aberto há {ticket.daysSinceOpened} dia
                      {ticket.daysSinceOpened !== 1 && "s"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${priorityColors[ticket.priorityLabel] || "bg-gray-400"}`}
                      />
                      <span className="text-xs font-semibold text-gray-700">
                        {ticket.priorityLabel}
                      </span>
                    </div>
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-gray-500">
                      {ticket.priorityScore}pts
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-600">
                  {ticket.description}
                </p>
                <p className="mt-1 text-xs text-gray-500 italic">
                  {ticket.reasoning}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Resultados: Análise Preditiva (Alertas MTBF)
// ============================================================

function PredictiveAlertResults({ data }: { data: PredictiveAlertInsight[] }) {
  if (data.length === 0) {
    return (
      <EmptyResults message="Nenhum equipamento se aproximando do MTBF do seu modelo. Dados insuficientes ou todos os equipamentos estão dentro da faixa segura." />
    );
  }

  const above = data.filter((d) => d.riskLevel === "above");
  const approaching = data.filter((d) => d.riskLevel === "approaching");

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="border-b px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Análise Preditiva — Alertas MTBF
        </h2>
        <p className="text-sm text-gray-500">
          {data.length} equipamento{data.length !== 1 ? "s" : ""} se aproximando
          do MTBF —{" "}
          <span className="font-medium text-red-600">
            {above.length} acima do MTBF
          </span>
          ,{" "}
          <span className="font-medium text-yellow-600">
            {approaching.length} aproximando
          </span>
        </p>
      </div>

      <div className="divide-y">
        {data.map((item) => (
          <PredictiveAlertCard key={item.equipmentId} item={item} />
        ))}
      </div>
    </div>
  );
}

function PredictiveAlertCard({ item }: { item: PredictiveAlertInsight }) {
  const barWidthPercent = Math.min(item.percentOfMtbf, 100);
  const barColor =
    item.riskLevel === "above" ? "bg-red-500" : "bg-yellow-500";

  return (
    <div className="px-6 py-4">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href={`/equipamentos/${item.equipmentId}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            {item.equipmentName}
          </Link>
          <p className="text-xs text-gray-500">
            {item.unitName}
            {item.patrimony && ` — Pat: ${item.patrimony}`}
          </p>
        </div>
        <Badge variant={item.riskLevel === "above" ? "danger" : "warning"}>
          {item.riskLevel === "above" ? "Acima do MTBF" : "Aproximando"}
        </Badge>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{Math.round(item.percentOfMtbf)}% do MTBF</span>
          <span>MTBF: {formatHours(item.modelMtbfHours)}</span>
        </div>
        <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
          <div
            className={`h-2 rounded-full ${barColor} transition-all`}
            style={{ width: `${barWidthPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-500">Modelo:</span>{" "}
          <span className="font-medium">{item.brand} {item.model}</span>
        </div>
        <div>
          <span className="text-gray-500">Desde último reparo:</span>{" "}
          <span className="font-medium">{formatHours(item.hoursSinceLastRepair)}</span>
        </div>
      </div>

      <p className="mt-2 text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
        {item.alertMessage}
      </p>
    </div>
  );
}

// ============================================================
// Estado vazio
// ============================================================

function EmptyResults({ message }: { message: string }) {
  return (
    <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
      <svg
        className="mx-auto h-12 w-12 text-gray-300"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
        />
      </svg>
      <p className="mt-3 text-sm text-gray-500">{message}</p>
    </div>
  );
}
