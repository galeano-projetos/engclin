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
  runRootCauseAgent,
  runLifecycleAgent,
  runDashboardSummaryAgent,
  runMarketResearchAgent,
  runComplianceAgent,
} from "./agents";
import type {
  CostBenefitInsight,
  PredictiveInsight,
  PrioritizationInsight,
  PredictiveAlertInsight,
  RootCauseInsight,
  LifecycleInsight,
  DashboardSummary,
  MarketResearchResult,
  ComplianceResult,
} from "./agents";
import { formatHours } from "@/lib/mtbf-mttr";

type ActiveAgent =
  | "cost"
  | "predictive"
  | "priority"
  | "predictive-alert"
  | "root-cause"
  | "lifecycle"
  | "dashboard-summary"
  | "market-research"
  | "compliance"
  | null;

export function IntelligencePanel() {
  const [activeAgent, setActiveAgent] = useState<ActiveAgent>(null);
  const [loading, setLoading] = useState(false);

  // Results state
  const [costData, setCostData] = useState<CostBenefitInsight[] | null>(null);
  const [predictiveData, setPredictiveData] = useState<PredictiveInsight[] | null>(null);
  const [priorityData, setPriorityData] = useState<PrioritizationInsight[] | null>(null);
  const [alertData, setAlertData] = useState<PredictiveAlertInsight[] | null>(null);
  const [rootCauseData, setRootCauseData] = useState<RootCauseInsight[] | null>(null);
  const [lifecycleData, setLifecycleData] = useState<LifecycleInsight[] | null>(null);
  const [summaryData, setSummaryData] = useState<DashboardSummary | null>(null);
  const [marketData, setMarketData] = useState<MarketResearchResult | null>(null);
  const [complianceData, setComplianceData] = useState<ComplianceResult | null>(null);

  // Input state for agents that require parameters
  const [marketInput, setMarketInput] = useState({ equipmentName: "", brand: "", model: "" });
  const [complianceInput, setComplianceInput] = useState("");

  async function handleRunAgent(agent: ActiveAgent) {
    if (!agent) return;
    setActiveAgent(agent);
    setLoading(true);

    try {
      if (agent === "cost") {
        setCostData(await runCostBenefitAgent());
      } else if (agent === "predictive") {
        setPredictiveData(await runPredictiveAgent());
      } else if (agent === "priority") {
        setPriorityData(await runPrioritizationAgent());
      } else if (agent === "predictive-alert") {
        setAlertData(await runPredictiveAlertAgent());
      } else if (agent === "root-cause") {
        setRootCauseData(await runRootCauseAgent());
      } else if (agent === "lifecycle") {
        setLifecycleData(await runLifecycleAgent());
      } else if (agent === "dashboard-summary") {
        setSummaryData(await runDashboardSummaryAgent());
      } else if (agent === "market-research") {
        if (!marketInput.equipmentName) return;
        setMarketData(
          await runMarketResearchAgent(
            marketInput.equipmentName,
            marketInput.brand,
            marketInput.model
          )
        );
      } else if (agent === "compliance") {
        if (!complianceInput) return;
        setComplianceData(await runComplianceAgent(complianceInput));
      }
    } catch {
      // Error handled silently - agent results are shown as empty
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 space-y-8">
      {/* ============== Chatbot Banner ============== */}
      <Link
        href="/inteligencia/assistente"
        className="flex items-center gap-4 rounded-lg border border-teal-200 bg-teal-50 p-4 transition-colors hover:bg-teal-100"
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-teal-600">
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-teal-800">
            Assistente de Chamados
          </h3>
          <p className="text-xs text-teal-600">
            Descreva um problema por conversa e o assistente abre o chamado automaticamente.
          </p>
        </div>
        <svg className="ml-auto h-5 w-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </Link>

      {/* ============== Secao 1: Analise Operacional ============== */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Analise Operacional
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Agentes que analisam custos, falhas e prioridades do parque tecnologico.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AgentCard
            title="Custo-Beneficio"
            description="Analisa custos acumulados de manutencao vs. valor de aquisicao e recomenda substituicao quando necessario."
            icon={
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            badge="GPT-4o-mini"
            active={activeAgent === "cost"}
            loading={loading && activeAgent === "cost"}
            onRun={() => handleRunAgent("cost")}
          />
          <AgentCard
            title="Manutencao Preditiva"
            description="Identifica padroes de falhas recorrentes em modelos de equipamentos e sugere planos preventivos."
            icon={
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
              </svg>
            }
            badge="GPT-4o-mini"
            active={activeAgent === "predictive"}
            loading={loading && activeAgent === "predictive"}
            onRun={() => handleRunAgent("predictive")}
          />
          <AgentCard
            title="Priorizacao de Chamados"
            description="Analisa criticidade do equipamento e urgencia para sugerir ordem de prioridade no atendimento."
            icon={
              <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
              </svg>
            }
            badge="GPT-4o-mini"
            active={activeAgent === "priority"}
            loading={loading && activeAgent === "priority"}
            onRun={() => handleRunAgent("priority")}
          />
          <AgentCard
            title="Alertas MTBF"
            description="Identifica equipamentos se aproximando do tempo medio entre falhas (MTBF) do seu modelo."
            icon={
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            }
            badge="GPT-4o-mini"
            active={activeAgent === "predictive-alert"}
            loading={loading && activeAgent === "predictive-alert"}
            onRun={() => handleRunAgent("predictive-alert")}
          />
        </div>
      </section>

      {/* ============== Secao 2: Analise Avancada ============== */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Analise Avancada
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Analises profundas com raciocinio avancado sobre causa raiz e ciclo de vida dos equipamentos.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AgentCard
            title="Causa Raiz"
            description="Analisa historico de chamados repetidos para identificar a causa raiz dos problemas e sugerir acoes definitivas."
            icon={
              <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z" />
              </svg>
            }
            badge="GPT-4o"
            active={activeAgent === "root-cause"}
            loading={loading && activeAgent === "root-cause"}
            onRun={() => handleRunAgent("root-cause")}
          />
          <AgentCard
            title="Ciclo de Vida"
            description="Avalia o estagio de vida util de cada equipamento considerando idade, custos e historico de manutencao."
            icon={
              <svg className="h-8 w-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            }
            badge="GPT-4o-mini"
            active={activeAgent === "lifecycle"}
            loading={loading && activeAgent === "lifecycle"}
            onRun={() => handleRunAgent("lifecycle")}
          />
          <AgentCard
            title="Resumo Executivo"
            description="Gera um resumo inteligente do estado atual do parque tecnologico para tomada de decisao rapida."
            icon={
              <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            }
            badge="GPT-4o-mini"
            active={activeAgent === "dashboard-summary"}
            loading={loading && activeAgent === "dashboard-summary"}
            onRun={() => handleRunAgent("dashboard-summary")}
          />
        </div>
      </section>

      {/* ============== Secao 3: Pesquisa Externa (Manus) ============== */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Pesquisa Externa
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Agentes com navegacao web para pesquisa de mercado e consulta de normas regulatorias.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Market Research Card with Input */}
          <div
            className={`rounded-lg border p-5 shadow-sm transition-colors ${
              activeAgent === "market-research" ? "border-blue-300 bg-blue-50" : "bg-white"
            }`}
          >
            <div className="flex items-start gap-3">
              <svg className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">Pesquisa de Mercado</h3>
                  <span className="rounded bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-700">Manus</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Pesquisa precos, fornecedores e alternativas de mercado para equipamentos medicos no Brasil.
                </p>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <input
                type="text"
                placeholder="Nome do equipamento *"
                value={marketInput.equipmentName}
                onChange={(e) => setMarketInput((p) => ({ ...p, equipmentName: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Marca"
                  value={marketInput.brand}
                  onChange={(e) => setMarketInput((p) => ({ ...p, brand: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Modelo"
                  value={marketInput.model}
                  onChange={(e) => setMarketInput((p) => ({ ...p, model: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-3">
              <Button
                onClick={() => handleRunAgent("market-research")}
                loading={loading && activeAgent === "market-research"}
                disabled={!marketInput.equipmentName}
                className="w-full"
              >
                {loading && activeAgent === "market-research" ? "Pesquisando..." : "Pesquisar Mercado"}
              </Button>
            </div>
          </div>

          {/* Compliance Card with Input */}
          <div
            className={`rounded-lg border p-5 shadow-sm transition-colors ${
              activeAgent === "compliance" ? "border-blue-300 bg-blue-50" : "bg-white"
            }`}
          >
            <div className="flex items-start gap-3">
              <svg className="h-8 w-8 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">Conformidade Regulatoria</h3>
                  <span className="rounded bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-700">Manus</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Consulta normas ANVISA, RDCs, ABNT e requisitos ONA aplicaveis ao tipo de equipamento.
                </p>
              </div>
            </div>
            <div className="mt-3">
              <input
                type="text"
                placeholder="Tipo de equipamento (ex: Monitor Multiparametro) *"
                value={complianceInput}
                onChange={(e) => setComplianceInput(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="mt-3">
              <Button
                onClick={() => handleRunAgent("compliance")}
                loading={loading && activeAgent === "compliance"}
                disabled={!complianceInput}
                className="w-full"
              >
                {loading && activeAgent === "compliance" ? "Consultando normas..." : "Consultar Normas"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ============== Resultados ============== */}
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
      {activeAgent === "root-cause" && rootCauseData && !loading && (
        <RootCauseResults data={rootCauseData} />
      )}
      {activeAgent === "lifecycle" && lifecycleData && !loading && (
        <LifecycleResults data={lifecycleData} />
      )}
      {activeAgent === "dashboard-summary" && summaryData && !loading && (
        <DashboardSummaryResults data={summaryData} />
      )}
      {activeAgent === "market-research" && marketData && !loading && (
        <MarketResearchResults data={marketData} />
      )}
      {activeAgent === "compliance" && complianceData && !loading && (
        <ComplianceResults data={complianceData} />
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
  badge,
  active,
  loading,
  onRun,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
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
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            {badge && (
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500">
                {badge}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <div className="mt-4">
        <Button onClick={onRun} loading={loading} className="w-full">
          {loading ? "Analisando..." : "Executar Analise"}
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
      <EmptyResults message="Nenhum equipamento com valor de aquisicao cadastrado para analise." />
    );
  }

  const substituir = data.filter((d) => d.recommendation === "substituir");
  const monitorar = data.filter((d) => d.recommendation === "monitorar");

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="border-b px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Analise de Custo-Beneficio
        </h2>
        <p className="text-sm text-gray-500">
          {data.length} equipamentos analisados —{" "}
          <span className="font-medium text-red-600">
            {substituir.length} para substituicao
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
            Recomendacao: Avaliar Substituicao
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
            Recomendacao: Monitorar de Perto
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
          <span className="text-gray-500">Aquisicao:</span>{" "}
          <span className="font-medium">
            R$ {item.acquisitionValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Manutencao total:</span>{" "}
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
      <EmptyResults message="Dados insuficientes para analise preditiva. E necessario ao menos 2 equipamentos do mesmo modelo com historico de chamados." />
    );
  }

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="border-b px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Analise Preditiva de Falhas
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
                  ? "Critico"
                  : insight.avgFailuresPerUnit >= 1.5
                    ? "Atencao"
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
      <EmptyResults message="Nenhum chamado aberto para priorizacao." />
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
                      Criticidade: {ticket.equipmentCriticality} | Urgencia:{" "}
                      {ticket.urgency} | Aberto ha {ticket.daysSinceOpened} dia
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
      <EmptyResults message="Nenhum equipamento se aproximando do MTBF do seu modelo. Dados insuficientes ou todos os equipamentos estao dentro da faixa segura." />
    );
  }

  const above = data.filter((d) => d.riskLevel === "above");
  const approaching = data.filter((d) => d.riskLevel === "approaching");

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="border-b px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Alertas MTBF
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
          <span className="text-gray-500">Desde ultimo reparo:</span>{" "}
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
// Resultados: Causa Raiz
// ============================================================

function RootCauseResults({ data }: { data: RootCauseInsight[] }) {
  if (data.length === 0) {
    return (
      <EmptyResults message="Nenhum equipamento com chamados suficientes para analise de causa raiz (minimo 2 chamados resolvidos)." />
    );
  }

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="border-b px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Analise de Causa Raiz
        </h2>
        <p className="text-sm text-gray-500">
          Top {data.length} equipamentos com mais chamados recorrentes
        </p>
      </div>

      <div className="divide-y">
        {data.map((item) => (
          <div key={item.equipmentId} className="px-6 py-4">
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
                  {" — "}{item.ticketCount} chamados
                </p>
              </div>
              <Badge variant={item.ticketCount >= 5 ? "danger" : "warning"}>
                {item.ticketCount} ocorrencias
              </Badge>
            </div>

            <div className="mt-3 rounded-md bg-purple-50 p-3">
              <h4 className="text-xs font-semibold text-purple-800 mb-1">
                Analise de Causa Raiz
              </h4>
              <p className="text-xs text-purple-700">{item.rootCauseAnalysis}</p>
            </div>

            <div className="mt-2 rounded-md bg-green-50 p-3">
              <h4 className="text-xs font-semibold text-green-800 mb-1">
                Acoes Corretivas Sugeridas
              </h4>
              <p className="text-xs text-green-700">{item.suggestedActions}</p>
            </div>

            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                Ver historico de chamados ({item.descriptions.length})
              </summary>
              <ul className="mt-1 space-y-1 pl-4">
                {item.descriptions.map((desc, i) => (
                  <li key={i} className="text-xs text-gray-500">{desc}</li>
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
// Resultados: Ciclo de Vida
// ============================================================

function LifecycleResults({ data }: { data: LifecycleInsight[] }) {
  if (data.length === 0) {
    return (
      <EmptyResults message="Nenhum equipamento com data de aquisicao cadastrada para analise de ciclo de vida." />
    );
  }

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="border-b px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Analise de Ciclo de Vida
        </h2>
        <p className="text-sm text-gray-500">
          {data.length} equipamentos analisados — ordenados por proximidade do fim de vida
        </p>
      </div>

      <div className="divide-y">
        {data.map((item) => {
          const lifePercent = Math.min((item.ageYears / item.vidaUtilAnos) * 100, 100);
          const barColor =
            lifePercent >= 90
              ? "bg-red-500"
              : lifePercent >= 70
                ? "bg-yellow-500"
                : "bg-green-500";

          return (
            <div key={item.equipmentId} className="px-6 py-4">
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
                <Badge
                  variant={
                    lifePercent >= 90
                      ? "danger"
                      : lifePercent >= 70
                        ? "warning"
                        : "success"
                  }
                >
                  {item.ageYears} / {item.vidaUtilAnos} anos
                </Badge>
              </div>

              {/* Life progress bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{lifePercent.toFixed(0)}% da vida util</span>
                  <span>{item.correctiveCount} corretivas | Custo: {item.costRatio}%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
                  <div
                    className={`h-2 rounded-full ${barColor} transition-all`}
                    style={{ width: `${lifePercent}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 rounded-md bg-teal-50 p-3">
                <p className="text-xs text-teal-700">{item.lifecycleAnalysis}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Resultados: Resumo Executivo
// ============================================================

function DashboardSummaryResults({ data }: { data: DashboardSummary }) {
  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="border-b px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Resumo Executivo
        </h2>
      </div>
      <div className="px-6 py-4">
        <div className="rounded-md bg-indigo-50 p-4">
          <p className="text-sm text-indigo-800 leading-relaxed">{data.summary}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Resultados: Pesquisa de Mercado
// ============================================================

function MarketResearchResults({ data }: { data: MarketResearchResult }) {
  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="border-b px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Pesquisa de Mercado
        </h2>
        <p className="text-sm text-gray-500">
          {data.equipmentName}
          {data.brand && ` — ${data.brand}`}
          {data.model && ` ${data.model}`}
        </p>
      </div>
      <div className="px-6 py-4">
        <div className="rounded-md bg-orange-50 p-4">
          <p className="text-sm text-orange-800 leading-relaxed whitespace-pre-line">
            {data.research}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Resultados: Conformidade Regulatoria
// ============================================================

function ComplianceResults({ data }: { data: ComplianceResult }) {
  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="border-b px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Conformidade Regulatoria
        </h2>
        <p className="text-sm text-gray-500">
          Tipo de equipamento: {data.equipmentType}
        </p>
      </div>
      <div className="px-6 py-4">
        <div className="rounded-md bg-sky-50 p-4">
          <p className="text-sm text-sky-800 leading-relaxed whitespace-pre-line">
            {data.complianceAnalysis}
          </p>
        </div>
      </div>
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
