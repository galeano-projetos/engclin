"use server";

import { prisma } from "@/lib/db";
import { checkPermission } from "@/lib/auth/require-role";
import { generateText, generateTextAdvanced } from "@/lib/ai/openai";
import { manusGenerate } from "@/lib/ai/manus";

// ============================================================
// Tipos de retorno dos agentes
// ============================================================

export interface CostBenefitInsight {
  equipmentId: string;
  equipmentName: string;
  patrimony: string | null;
  unitName: string;
  acquisitionValue: number;
  totalMaintenanceCost: number;
  costRatio: number;
  ageYears: number;
  correctiveCount: number;
  recommendation: "substituir" | "monitorar" | "adequado";
  reasoning: string;
}

export interface PredictiveInsight {
  model: string;
  brand: string;
  equipmentCount: number;
  totalFailures: number;
  avgFailuresPerUnit: number;
  mostCommonIssues: string[];
  recommendation: string;
  affectedEquipments: { id: string; name: string; patrimony: string | null }[];
}

export interface PredictiveAlertInsight {
  equipmentId: string;
  equipmentName: string;
  patrimony: string | null;
  unitName: string;
  brand: string;
  model: string;
  modelMtbfHours: number;
  hoursSinceLastRepair: number;
  percentOfMtbf: number;
  riskLevel: "above" | "approaching";
  alertMessage: string;
}

export interface PrioritizationInsight {
  ticketId: string;
  equipmentName: string;
  equipmentCriticality: string;
  urgency: string;
  description: string;
  daysSinceOpened: number;
  priorityScore: number;
  priorityLabel: string;
  reasoning: string;
}

export interface RootCauseInsight {
  equipmentId: string;
  equipmentName: string;
  patrimony: string | null;
  unitName: string;
  ticketCount: number;
  descriptions: string[];
  rootCauseAnalysis: string;
  suggestedActions: string;
}

export interface LifecycleInsight {
  equipmentId: string;
  equipmentName: string;
  patrimony: string | null;
  unitName: string;
  ageYears: number;
  vidaUtilAnos: number;
  correctiveCount: number;
  costRatio: number;
  lifecycleAnalysis: string;
}

export interface DashboardSummary {
  summary: string;
}

export interface ReportInsightResult {
  insight: string;
}

export interface MarketResearchResult {
  equipmentName: string;
  brand: string;
  model: string;
  research: string;
}

export interface ComplianceResult {
  equipmentType: string;
  complianceAnalysis: string;
}

// ============================================================
// Helper: tenta LLM, fallback para texto fixo
// ============================================================

async function tryLLM(
  fn: () => Promise<string>,
  fallback: string
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return "Chave da OpenAI (OPENAI_API_KEY) nao configurada. Configure nas variaveis de ambiente.";
  }
  try {
    const result = await fn();
    return result || fallback;
  } catch (error) {
    console.error("[tryLLM] Erro na chamada LLM:", error instanceof Error ? error.message : error);
    return fallback;
  }
}

// ============================================================
// Agente 1: Custo-Benefício (GPT-4o-mini enriquecido)
// ============================================================

export async function runCostBenefitAgent(): Promise<CostBenefitInsight[]> {
  const { tenantId } = await checkPermission("ai.view");

  const equipments = await prisma.equipment.findMany({
    where: {
      tenantId,
      status: { not: "DESCARTADO" },
      acquisitionValue: { not: null },
    },
    include: {
      unit: { select: { name: true } },
      preventiveMaintenances: {
        where: { status: "REALIZADA", cost: { not: null } },
        select: { cost: true },
      },
      correctiveMaintenances: {
        where: { status: { in: ["RESOLVIDO", "FECHADO"] } },
        select: { cost: true, description: true },
      },
    },
  });

  const insights: CostBenefitInsight[] = [];

  for (const eq of equipments) {
    const acquisitionValue = Number(eq.acquisitionValue) || 0;
    if (acquisitionValue <= 0) continue;

    const preventiveCost = eq.preventiveMaintenances.reduce(
      (sum, m) => sum + (m.cost ? Number(m.cost) : 0),
      0
    );
    const correctiveCost = eq.correctiveMaintenances.reduce(
      (sum, m) => sum + (m.cost ? Number(m.cost) : 0),
      0
    );
    const totalCost = preventiveCost + correctiveCost;
    const costRatio = totalCost / acquisitionValue;

    const ageYears = eq.acquisitionDate
      ? (Date.now() - eq.acquisitionDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      : 0;

    const correctiveCount = eq.correctiveMaintenances.length;

    let recommendation: CostBenefitInsight["recommendation"];
    if (costRatio >= 0.7) {
      recommendation = "substituir";
    } else if (costRatio >= 0.4 || correctiveCount >= 5) {
      recommendation = "monitorar";
    } else {
      recommendation = "adequado";
    }

    const fallbackReasoning =
      recommendation === "substituir"
        ? `Custo de manutencao atingiu ${(costRatio * 100).toFixed(0)}% do valor de aquisicao. Avaliar substituicao.`
        : recommendation === "monitorar"
          ? `Custo em ${(costRatio * 100).toFixed(0)}% com ${correctiveCount} corretivas. Monitorar.`
          : `Custo em ${(costRatio * 100).toFixed(0)}%. Relacao custo-beneficio adequada.`;

    const reasoning = await tryLLM(
      () =>
        generateText(
          "Voce e um engenheiro clinico especialista em gestao de equipamentos hospitalares. Responda em portugues brasileiro, de forma concisa (2-3 frases). Nao use markdown.",
          `Equipamento: ${eq.name} (${eq.brand || ""} ${eq.model || ""})
Setor: ${eq.unit.name}
Valor aquisicao: R$ ${acquisitionValue.toFixed(2)}
Custo total manutencao: R$ ${totalCost.toFixed(2)} (${(costRatio * 100).toFixed(0)}% do valor)
Preventivas: R$ ${preventiveCost.toFixed(2)} | Corretivas: R$ ${correctiveCost.toFixed(2)}
Quantidade de corretivas: ${correctiveCount}
Idade: ${ageYears.toFixed(1)} anos
Recomendacao calculada: ${recommendation}

Gere uma analise breve e contextualizada sobre a relacao custo-beneficio deste equipamento e justifique a recomendacao.`
        ),
      fallbackReasoning
    );

    insights.push({
      equipmentId: eq.id,
      equipmentName: eq.name,
      patrimony: eq.patrimony,
      unitName: eq.unit.name,
      acquisitionValue,
      totalMaintenanceCost: totalCost,
      costRatio,
      ageYears: Math.round(ageYears * 10) / 10,
      correctiveCount,
      recommendation,
      reasoning,
    });
  }

  const order = { substituir: 0, monitorar: 1, adequado: 2 };
  insights.sort((a, b) => order[a.recommendation] - order[b.recommendation] || b.costRatio - a.costRatio);

  return insights;
}

// ============================================================
// Agente 2: Manutenção Preditiva (GPT-4o-mini enriquecido)
// ============================================================

export async function runPredictiveAgent(): Promise<PredictiveInsight[]> {
  const { tenantId } = await checkPermission("ai.view");

  const equipments = await prisma.equipment.findMany({
    where: {
      tenantId,
      status: { not: "DESCARTADO" },
      model: { not: null },
    },
    include: {
      correctiveMaintenances: {
        select: { description: true, solution: true },
      },
    },
  });

  const groups = new Map<
    string,
    { model: string; brand: string; equipments: typeof equipments }
  >();

  for (const eq of equipments) {
    const key = `${eq.brand || "N/A"}|||${eq.model || "N/A"}`;
    if (!groups.has(key)) {
      groups.set(key, { model: eq.model || "N/A", brand: eq.brand || "N/A", equipments: [] });
    }
    groups.get(key)!.equipments.push(eq);
  }

  const insights: PredictiveInsight[] = [];

  for (const [, group] of groups) {
    if (group.equipments.length < 2) continue;

    const totalFailures = group.equipments.reduce(
      (sum, eq) => sum + eq.correctiveMaintenances.length,
      0
    );
    if (totalFailures === 0) continue;

    const avgFailures = totalFailures / group.equipments.length;

    const descriptions = group.equipments.flatMap((eq) =>
      eq.correctiveMaintenances.map((m) => m.description.toLowerCase())
    );
    const issueKeywords = extractCommonIssues(descriptions);

    const allDescriptions = group.equipments
      .flatMap((eq) =>
        eq.correctiveMaintenances.map(
          (m) => `Problema: ${m.description}${m.solution ? ` | Solucao: ${m.solution}` : ""}`
        )
      )
      .slice(0, 20);

    const fallbackRecommendation =
      avgFailures >= 3
        ? `Alta taxa de falhas. Criar plano preventivo especifico.`
        : avgFailures >= 1.5
          ? `Taxa moderada. Monitoramento mais frequente sugerido.`
          : `Taxa aceitavel. Manter plano atual.`;

    const recommendation = await tryLLM(
      () =>
        generateText(
          "Voce e um engenheiro clinico especialista em manutencao preditiva. Responda em portugues brasileiro, de forma concisa (3-4 frases). Nao use markdown.",
          `Modelo: ${group.brand} ${group.model}
Unidades: ${group.equipments.length}
Total de falhas: ${totalFailures} (media: ${avgFailures.toFixed(1)}/unidade)
Problemas frequentes: ${issueKeywords.join(", ") || "nao identificados"}

Historico de chamados (amostra):
${allDescriptions.join("\n")}

Analise os padroes de falha e sugira acoes preventivas concretas para reduzir a taxa de chamados corretivos neste modelo.`
        ),
      fallbackRecommendation
    );

    insights.push({
      model: group.model,
      brand: group.brand,
      equipmentCount: group.equipments.length,
      totalFailures,
      avgFailuresPerUnit: Math.round(avgFailures * 10) / 10,
      mostCommonIssues: issueKeywords,
      recommendation,
      affectedEquipments: group.equipments.map((eq) => ({
        id: eq.id,
        name: eq.name,
        patrimony: eq.patrimony,
      })),
    });
  }

  insights.sort((a, b) => b.avgFailuresPerUnit - a.avgFailuresPerUnit);
  return insights;
}

function extractCommonIssues(descriptions: string[]): string[] {
  const keywords: Record<string, number> = {};
  const terms = [
    "nao liga", "tela", "ruido", "vazamento", "aquecimento",
    "erro", "alarme", "sensor", "cabo", "bateria", "calibracao",
    "pressao", "temperatura", "display", "motor", "bomba",
    "placa", "software", "travamento", "leitura", "desligando",
    "quebr", "desgast", "oxigenio", "fluxo", "valvula",
  ];

  for (const desc of descriptions) {
    for (const term of terms) {
      if (desc.includes(term)) {
        keywords[term] = (keywords[term] || 0) + 1;
      }
    }
  }

  return Object.entries(keywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([term]) => term);
}

// ============================================================
// Agente 3: Priorização de Chamados (GPT-4o-mini enriquecido)
// ============================================================

export async function runPrioritizationAgent(): Promise<PrioritizationInsight[]> {
  const { tenantId } = await checkPermission("ai.view");

  const openTickets = await prisma.correctiveMaintenance.findMany({
    where: {
      tenantId,
      status: { in: ["ABERTO", "EM_ATENDIMENTO"] },
    },
    include: {
      equipment: {
        select: { name: true, criticality: true, patrimony: true },
      },
    },
    orderBy: { openedAt: "asc" },
  });

  const now = new Date();

  const criticalityLabels: Record<string, string> = {
    A: "1 - Critico",
    B: "2 - Moderado",
    C: "3 - Baixo",
  };

  const urgencyLabels: Record<string, string> = {
    BAIXA: "Baixa",
    MEDIA: "Media",
    ALTA: "Alta",
    CRITICA: "Critica",
  };

  const insights: PrioritizationInsight[] = [];

  for (const ticket of openTickets) {
    const daysSinceOpened = Math.floor(
      (now.getTime() - ticket.openedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    let score = 0;
    const urgencyScores: Record<string, number> = { CRITICA: 40, ALTA: 30, MEDIA: 15, BAIXA: 5 };
    score += urgencyScores[ticket.urgency] || 0;
    const critScores: Record<string, number> = { A: 30, B: 15, C: 5 };
    score += critScores[ticket.equipment.criticality] || 0;
    score += Math.min(daysSinceOpened * 2, 30);

    let priorityLabel: string;
    if (score >= 70) priorityLabel = "Urgente";
    else if (score >= 45) priorityLabel = "Alta";
    else if (score >= 25) priorityLabel = "Moderada";
    else priorityLabel = "Baixa";

    const fallbackReasoning = `Prioridade ${priorityLabel.toLowerCase()}: criticidade ${criticalityLabels[ticket.equipment.criticality]}, urgencia ${urgencyLabels[ticket.urgency]}.`;

    const reasoning = await tryLLM(
      () =>
        generateText(
          "Voce e um coordenador de engenharia clinica. Responda em portugues brasileiro, 1-2 frases concisas. Nao use markdown.",
          `Chamado aberto ha ${daysSinceOpened} dias para: ${ticket.equipment.name}
Criticidade do equipamento: ${criticalityLabels[ticket.equipment.criticality]}
Urgencia reportada: ${urgencyLabels[ticket.urgency]}
Descricao: ${ticket.description}
Score calculado: ${score}/100 (${priorityLabel})

Justifique brevemente a priorizacao considerando o impacto assistencial.`
        ),
      fallbackReasoning
    );

    insights.push({
      ticketId: ticket.id,
      equipmentName: ticket.equipment.name,
      equipmentCriticality: criticalityLabels[ticket.equipment.criticality] || ticket.equipment.criticality,
      urgency: urgencyLabels[ticket.urgency] || ticket.urgency,
      description:
        ticket.description.length > 100
          ? ticket.description.slice(0, 100) + "..."
          : ticket.description,
      daysSinceOpened,
      priorityScore: Math.min(score, 100),
      priorityLabel,
      reasoning,
    });
  }

  insights.sort((a, b) => b.priorityScore - a.priorityScore);
  return insights;
}

// ============================================================
// Agente 4: Análise Preditiva MTBF (GPT-4o-mini enriquecido)
// ============================================================

const MS_TO_HOURS = 1000 * 60 * 60;

export async function runPredictiveAlertAgent(): Promise<PredictiveAlertInsight[]> {
  const { tenantId } = await checkPermission("ai.view");

  const equipments = await prisma.equipment.findMany({
    where: {
      tenantId,
      status: { not: "DESCARTADO" },
      model: { not: null },
    },
    include: {
      unit: { select: { name: true } },
      correctiveMaintenances: {
        where: { closedAt: { not: null } },
        select: { openedAt: true, closedAt: true },
        orderBy: { openedAt: "asc" },
      },
    },
  });

  const groups = new Map<
    string,
    { brand: string; model: string; equipments: typeof equipments }
  >();

  for (const eq of equipments) {
    const key = `${eq.brand || "N/A"}|||${eq.model || "N/A"}`;
    if (!groups.has(key)) {
      groups.set(key, { brand: eq.brand || "N/A", model: eq.model || "N/A", equipments: [] });
    }
    groups.get(key)!.equipments.push(eq);
  }

  const now = new Date();
  const alerts: PredictiveAlertInsight[] = [];

  for (const [, group] of groups) {
    const allIntervals: number[] = [];

    for (const eq of group.equipments) {
      const tickets = eq.correctiveMaintenances;
      for (let i = 0; i < tickets.length - 1; i++) {
        const gap =
          (tickets[i + 1].openedAt.getTime() - tickets[i].closedAt!.getTime()) / MS_TO_HOURS;
        if (gap > 0) allIntervals.push(gap);
      }
    }

    if (allIntervals.length < 2) continue;

    const modelMtbf = allIntervals.reduce((a, b) => a + b, 0) / allIntervals.length;

    for (const eq of group.equipments) {
      const tickets = eq.correctiveMaintenances;
      if (tickets.length === 0) continue;

      const lastClosedAt = tickets[tickets.length - 1].closedAt!;
      const hoursSinceLastRepair = (now.getTime() - lastClosedAt.getTime()) / MS_TO_HOURS;
      const percentOfMtbf = (hoursSinceLastRepair / modelMtbf) * 100;

      if (percentOfMtbf < 70) continue;

      const riskLevel: "above" | "approaching" = percentOfMtbf >= 100 ? "above" : "approaching";

      const fallbackMessage =
        riskLevel === "above"
          ? `Equipamento ultrapassou o MTBF do modelo ${group.brand} ${group.model}. Preventiva imediata recomendada.`
          : `Equipamento se aproximando do MTBF do modelo ${group.brand} ${group.model}. Considere preventiva antecipada.`;

      const alertMessage = await tryLLM(
        () =>
          generateText(
            "Voce e um engenheiro clinico. Responda em portugues brasileiro, 1-2 frases. Nao use markdown.",
            `Equipamento: ${eq.name} no setor ${eq.unit.name}
Modelo: ${group.brand} ${group.model}
MTBF do modelo: ${Math.round(modelMtbf)} horas
Horas desde ultimo reparo: ${Math.round(hoursSinceLastRepair)}
Percentual do MTBF: ${Math.round(percentOfMtbf)}%
Nivel de risco: ${riskLevel === "above" ? "ACIMA do MTBF" : "APROXIMANDO do MTBF"}

Gere um alerta contextualizado com acao sugerida.`
          ),
        fallbackMessage
      );

      alerts.push({
        equipmentId: eq.id,
        equipmentName: eq.name,
        patrimony: eq.patrimony,
        unitName: eq.unit.name,
        brand: group.brand,
        model: group.model,
        modelMtbfHours: Math.round(modelMtbf),
        hoursSinceLastRepair: Math.round(hoursSinceLastRepair),
        percentOfMtbf: Math.round(percentOfMtbf),
        riskLevel,
        alertMessage,
      });
    }
  }

  const riskOrder = { above: 0, approaching: 1 };
  alerts.sort(
    (a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel] || b.percentOfMtbf - a.percentOfMtbf
  );

  return alerts;
}

// ============================================================
// Agente 5: Análise de Causa Raiz (GPT-4o)
// ============================================================

export async function runRootCauseAgent(): Promise<RootCauseInsight[]> {
  const { tenantId } = await checkPermission("ai.view");

  const equipments = await prisma.equipment.findMany({
    where: {
      tenantId,
      status: { not: "DESCARTADO" },
    },
    include: {
      unit: { select: { name: true } },
      correctiveMaintenances: {
        where: { status: { in: ["RESOLVIDO", "FECHADO"] } },
        select: { description: true, solution: true },
        orderBy: { openedAt: "desc" },
      },
    },
  });

  const insights: RootCauseInsight[] = [];

  for (const eq of equipments) {
    if (eq.correctiveMaintenances.length < 2) continue;

    const descriptions = eq.correctiveMaintenances
      .slice(0, 15)
      .map(
        (m, i) =>
          `#${i + 1}: ${m.description}${m.solution ? ` → Solucao: ${m.solution}` : ""}`
      );

    const rootCauseAnalysis = await tryLLM(
      () =>
        generateTextAdvanced(
          `Voce e um engenheiro clinico senior especialista em analise de causa raiz (RCA) de equipamentos medicos.
Analise o historico de chamados corretivos e identifique:
1. Padroes recorrentes de falha
2. Provavel causa raiz
3. Se os reparos anteriores trataram a causa ou apenas o sintoma
Responda em portugues brasileiro, de forma estruturada e concisa (4-6 frases). Nao use markdown.`,
          `Equipamento: ${eq.name} (${eq.brand || ""} ${eq.model || ""})
Setor: ${eq.unit.name}
Total de chamados resolvidos: ${eq.correctiveMaintenances.length}

Historico de chamados:
${descriptions.join("\n")}`
        ),
      "Dados insuficientes para analise de causa raiz automatizada."
    );

    const suggestedActions = await tryLLM(
      () =>
        generateTextAdvanced(
          "Voce e um engenheiro clinico. Com base na analise de causa raiz, sugira 2-3 acoes corretivas definitivas. Portugues brasileiro, conciso. Nao use markdown.",
          `Equipamento: ${eq.name}
Analise de causa raiz: ${rootCauseAnalysis}
Sugira acoes corretivas definitivas para eliminar a causa raiz.`
        ),
      "Realizar inspecao tecnica detalhada para identificar causa raiz definitiva."
    );

    insights.push({
      equipmentId: eq.id,
      equipmentName: eq.name,
      patrimony: eq.patrimony,
      unitName: eq.unit.name,
      ticketCount: eq.correctiveMaintenances.length,
      descriptions: descriptions.slice(0, 5),
      rootCauseAnalysis,
      suggestedActions,
    });
  }

  insights.sort((a, b) => b.ticketCount - a.ticketCount);
  return insights.slice(0, 10);
}

// ============================================================
// Agente 6: Previsão de Vida Útil (GPT-4o-mini)
// ============================================================

export async function runLifecycleAgent(): Promise<LifecycleInsight[]> {
  const { tenantId } = await checkPermission("ai.view");

  const equipments = await prisma.equipment.findMany({
    where: {
      tenantId,
      status: { not: "DESCARTADO" },
      acquisitionDate: { not: null },
    },
    include: {
      unit: { select: { name: true } },
      preventiveMaintenances: {
        where: { status: "REALIZADA", cost: { not: null } },
        select: { cost: true },
      },
      correctiveMaintenances: {
        where: { status: { in: ["RESOLVIDO", "FECHADO"] } },
        select: { cost: true, description: true },
      },
    },
  });

  const insights: LifecycleInsight[] = [];

  for (const eq of equipments) {
    const ageYears =
      (Date.now() - eq.acquisitionDate!.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    const vidaUtilAnos = eq.vidaUtilAnos ?? 10;
    const acquisitionValue = Number(eq.acquisitionValue) || 0;

    const totalCost =
      eq.preventiveMaintenances.reduce((s, m) => s + (m.cost ? Number(m.cost) : 0), 0) +
      eq.correctiveMaintenances.reduce((s, m) => s + (m.cost ? Number(m.cost) : 0), 0);

    const costRatio = acquisitionValue > 0 ? totalCost / acquisitionValue : 0;
    const correctiveCount = eq.correctiveMaintenances.length;

    const recentIssues = eq.correctiveMaintenances
      .slice(0, 5)
      .map((m) => m.description)
      .join("; ");

    const lifecycleAnalysis = await tryLLM(
      () =>
        generateText(
          "Voce e um engenheiro clinico especialista em gestao de ciclo de vida de equipamentos medicos. Responda em portugues brasileiro, 3-4 frases. Nao use markdown.",
          `Equipamento: ${eq.name} (${eq.brand || ""} ${eq.model || ""})
Setor: ${eq.unit.name}
Idade: ${ageYears.toFixed(1)} anos | Vida util estimada: ${vidaUtilAnos} anos
Valor aquisicao: R$ ${acquisitionValue.toFixed(2)}
Custo total manutencao: R$ ${totalCost.toFixed(2)} (${(costRatio * 100).toFixed(0)}% do valor)
Chamados corretivos: ${correctiveCount}
Problemas recentes: ${recentIssues || "nenhum"}

Analise o estagio do ciclo de vida deste equipamento e recomende se a vida util estimada e realista ou deve ser ajustada.`
        ),
      `Equipamento com ${ageYears.toFixed(1)} anos de ${vidaUtilAnos} estimados. ${correctiveCount} corretivas registradas.`
    );

    insights.push({
      equipmentId: eq.id,
      equipmentName: eq.name,
      patrimony: eq.patrimony,
      unitName: eq.unit.name,
      ageYears: Math.round(ageYears * 10) / 10,
      vidaUtilAnos,
      correctiveCount,
      costRatio: Math.round(costRatio * 1000) / 10,
      lifecycleAnalysis,
    });
  }

  // Priorizar equipamentos mais proximos do fim de vida
  insights.sort((a, b) => b.ageYears / b.vidaUtilAnos - a.ageYears / a.vidaUtilAnos);
  return insights.slice(0, 15);
}

// ============================================================
// Agente 7: Resumo Executivo do Dashboard (GPT-4o-mini)
// ============================================================

export async function runDashboardSummaryAgent(): Promise<DashboardSummary> {
  const { tenantId } = await checkPermission("ai.view");

  const [
    totalEquipments,
    activeEquipments,
    openTickets,
    overdueCount,
    recentTickets,
  ] = await Promise.all([
    prisma.equipment.count({ where: { tenantId } }),
    prisma.equipment.count({ where: { tenantId, status: "ATIVO" } }),
    prisma.correctiveMaintenance.count({
      where: { tenantId, status: { in: ["ABERTO", "EM_ATENDIMENTO"] } },
    }),
    prisma.preventiveMaintenance.count({
      where: { tenantId, status: "AGENDADA", dueDate: { lt: new Date() } },
    }),
    prisma.correctiveMaintenance.findMany({
      where: { tenantId, status: { in: ["ABERTO", "EM_ATENDIMENTO"] } },
      include: { equipment: { select: { name: true, criticality: true } } },
      orderBy: { openedAt: "desc" },
      take: 5,
    }),
  ]);

  const criticalTickets = recentTickets.filter(
    (t) => t.urgency === "CRITICA" || t.equipment.criticality === "A"
  );

  const summary = await tryLLM(
    () =>
      generateText(
        "Voce e um assistente de gestao hospitalar. Gere um resumo executivo conciso (3-4 frases) sobre o estado atual do parque tecnologico. Portugues brasileiro, tom profissional. Nao use markdown nem emojis.",
        `Dados atuais do parque tecnologico:
- Total de equipamentos: ${totalEquipments} (${activeEquipments} ativos)
- Chamados abertos: ${openTickets}
- Servicos vencidos: ${overdueCount}
- Chamados criticos: ${criticalTickets.length}${criticalTickets.length > 0 ? ` (${criticalTickets.map((t) => t.equipment.name).join(", ")})` : ""}

Gere um resumo executivo para o gestor sobre a situacao atual, destacando pontos de atencao.`
      ),
    `Parque com ${totalEquipments} equipamentos, ${openTickets} chamados abertos e ${overdueCount} servicos vencidos.`
  );

  return { summary };
}

// ============================================================
// Agente 8: Insights de Relatório (GPT-4o-mini)
// ============================================================

export async function runReportInsightAgent(
  reportTitle: string,
  reportData: string
): Promise<ReportInsightResult> {
  const insight = await tryLLM(
    () =>
      generateText(
        "Voce e um analista de dados em engenharia clinica hospitalar. Analise os dados do relatorio e gere 2-3 insights acionaveis. Portugues brasileiro, conciso. Nao use markdown.",
        `Relatorio: ${reportTitle}

Dados:
${reportData}

Gere insights sobre tendencias, outliers ou pontos de atencao nos dados acima.`
      ),
    "Erro ao gerar insights. Verifique se a chave OPENAI_API_KEY esta configurada."
  );

  return { insight };
}

// ============================================================
// Agente 9: Pesquisa de Mercado (Manus)
// ============================================================

export async function runMarketResearchAgent(
  equipmentName: string,
  brand: string,
  model: string
): Promise<MarketResearchResult> {
  const research = await tryLLM(
    () =>
      manusGenerate(
        "Voce e um consultor de equipamentos medicos hospitalares no Brasil. IMPORTANTE: Escreva o relatorio COMPLETO diretamente na sua resposta de texto. NAO crie arquivos, documentos ou anexos separados. Inclua TODAS as informacoes diretamente no texto da resposta. Responda em portugues brasileiro, de forma estruturada e concisa. Nao use markdown.",
        `Pesquise informacoes de mercado para:
Equipamento: ${equipmentName}
Marca: ${brand}
Modelo: ${model}

Forneca diretamente no texto da sua resposta (sem criar documentos separados):
1) Faixa de preco estimada no mercado brasileiro (novos e recondicionados)
2) Principais fornecedores e distribuidores no Brasil
3) Modelos alternativos e substitutos de outras marcas
4) Pontos de atencao e recomendacoes para compra`
      ),
    "Pesquisa de mercado indisponivel no momento. Tente novamente mais tarde."
  );

  return { equipmentName, brand, model, research };
}

// ============================================================
// Agente 10: Conformidade e Normas (Manus)
// ============================================================

export async function runComplianceAgent(
  equipmentType: string
): Promise<ComplianceResult> {
  const complianceAnalysis = await tryLLM(
    () =>
      manusGenerate(
        "Voce e um especialista em regulamentacao sanitaria brasileira para equipamentos medicos. Conhece as normas da ANVISA, RDCs, normas ABNT e requisitos ONA. IMPORTANTE: Escreva o relatorio COMPLETO diretamente na sua resposta de texto. NAO crie arquivos, documentos ou anexos separados. Responda em portugues brasileiro, de forma estruturada. Nao use markdown.",
        `Para equipamentos do tipo "${equipmentType}" em ambiente hospitalar brasileiro, forneca diretamente no texto da sua resposta (sem criar documentos separados):
1) Normas e RDCs da ANVISA aplicaveis
2) Requisitos de manutencao preventiva obrigatoria
3) Requisitos de calibracao e testes
4) Requisitos ONA relacionados
5) Periodicidade recomendada para cada tipo de servico

Seja especifico e cite os numeros das normas quando possivel.`
      ),
    "Consulta de conformidade indisponivel no momento. Tente novamente mais tarde."
  );

  return { equipmentType, complianceAnalysis };
}

// ============================================================
// Agente 11: Otimização de Cronograma (GPT-4o-mini)
// ============================================================

export interface ScheduleOptimizationInsight {
  equipmentTypeName: string;
  serviceType: string;
  currentPeriodicity: number;
  suggestedPeriodicity: number;
  reasoning: string;
  affectedCount: number;
}

export async function runScheduleOptimizationAgent(): Promise<ScheduleOptimizationInsight[]> {
  const { tenantId } = await checkPermission("ai.view");

  // Get equipment types with their periodicities and failure data
  const types = await prisma.equipmentType.findMany({
    where: { tenantId },
    include: {
      equipments: {
        where: { status: { not: "DESCARTADO" } },
        include: {
          correctiveMaintenances: {
            where: { status: { in: ["RESOLVIDO", "FECHADO"] } },
            select: { openedAt: true },
          },
          preventiveMaintenances: {
            where: { status: "REALIZADA" },
            select: { executionDate: true },
          },
        },
      },
    },
  });

  const insights: ScheduleOptimizationInsight[] = [];

  for (const type of types) {
    if (type.equipments.length === 0) continue;

    const totalCorrectivas = type.equipments.reduce(
      (sum, eq) => sum + eq.correctiveMaintenances.length, 0
    );
    const totalPreventivas = type.equipments.reduce(
      (sum, eq) => sum + eq.preventiveMaintenances.length, 0
    );
    const avgCorrectivasPerUnit = totalCorrectivas / type.equipments.length;

    const periodicityMap: Record<string, number> = {
      TRIMESTRAL: 3, SEMESTRAL: 6, ANUAL: 12, BIENAL: 24, QUINQUENAL: 60, NAO_APLICAVEL: 0,
    };
    const currentMonths = periodicityMap[type.preventivaPeriodicity] || 12;

    if (currentMonths === 0) continue;

    let suggestedMonths = currentMonths;
    let reasoning = "";

    if (avgCorrectivasPerUnit >= 3 && totalPreventivas > 0) {
      suggestedMonths = Math.max(3, Math.floor(currentMonths * 0.5));
      reasoning = `Alta taxa de corretivas (${avgCorrectivasPerUnit.toFixed(1)}/unidade). Reduzir periodicidade para prevenir falhas.`;
    } else if (avgCorrectivasPerUnit < 0.5 && totalPreventivas >= type.equipments.length * 2) {
      suggestedMonths = Math.min(24, Math.floor(currentMonths * 1.5));
      reasoning = `Baixa taxa de corretivas (${avgCorrectivasPerUnit.toFixed(1)}/unidade). Possivel esticar periodicidade com economia.`;
    } else {
      reasoning = `Periodicidade atual adequada para o perfil de falhas.`;
    }

    if (suggestedMonths !== currentMonths) {
      const enrichedReasoning = await tryLLM(
        () => generateText(
          "Voce e um engenheiro clinico. Responda em portugues, 2-3 frases. Nao use markdown.",
          `Tipo: ${type.name}\nPeriodicidade atual: ${currentMonths} meses\nSugerida: ${suggestedMonths} meses\nCorretivas/unidade: ${avgCorrectivasPerUnit.toFixed(1)}\nTotal unidades: ${type.equipments.length}\nJustifique a mudanca de periodicidade.`
        ),
        reasoning
      );

      insights.push({
        equipmentTypeName: type.name,
        serviceType: "PREVENTIVA",
        currentPeriodicity: currentMonths,
        suggestedPeriodicity: suggestedMonths,
        reasoning: enrichedReasoning,
        affectedCount: type.equipments.length,
      });
    }
  }

  return insights;
}

// ============================================================
// Agente 12: Análise de Gap ONA (GPT-4o-mini)
// ============================================================

export interface ONAGapItem {
  requirement: string;
  level: string;
  status: "conforme" | "parcial" | "nao_conforme";
  score: number;
  detail: string;
}

export interface ONAGapAnalysis {
  overallScore: number;
  level1Score: number;
  level2Score: number;
  items: ONAGapItem[];
  summary: string;
}

export async function runONAGapAgent(): Promise<ONAGapAnalysis> {
  const { tenantId } = await checkPermission("ai.view");

  const now = new Date();

  // Gather all data needed for ONA gap analysis
  const [
    totalEquipments,
    equipmentsWithPhoto,
    totalPreventives,
    executedPreventives,
    overduePreventives,
    totalTickets,
    resolvedTickets,
    trainings,
    completedTrainings,
    adverseEvents,
    nonConformities,
    kpiTargets,
    checklistResults,
    nonConformeItems,
  ] = await Promise.all([
    prisma.equipment.count({ where: { tenantId, status: { not: "DESCARTADO" } } }),
    prisma.equipment.count({ where: { tenantId, status: { not: "DESCARTADO" }, photoData: { not: null } } }),
    prisma.preventiveMaintenance.count({ where: { tenantId } }),
    prisma.preventiveMaintenance.count({ where: { tenantId, status: "REALIZADA" } }),
    prisma.preventiveMaintenance.count({ where: { tenantId, status: "AGENDADA", dueDate: { lt: now } } }),
    prisma.correctiveMaintenance.count({ where: { tenantId } }),
    prisma.correctiveMaintenance.count({ where: { tenantId, status: { in: ["RESOLVIDO", "FECHADO"] } } }),
    prisma.training.count({ where: { tenantId } }),
    prisma.trainingCompletion.count({ where: { tenantId } }),
    prisma.adverseEvent.count({ where: { tenantId } }),
    prisma.nonConformity.count({ where: { tenantId } }),
    prisma.kpiTarget.count({ where: { tenantId } }),
    prisma.checklistResult.count({ where: { tenantId } }),
    prisma.checklistResultItem.count({ where: { result: { tenantId }, status: "NAO_CONFORME" } }),
  ]);

  const preventiveCompliance = totalPreventives > 0 ? (executedPreventives / totalPreventives * 100) : 0;

  const items: ONAGapItem[] = [];

  // Level 1 checks
  items.push({
    requirement: "Inventario completo de equipamentos",
    level: "1",
    status: totalEquipments > 0 ? "conforme" : "nao_conforme",
    score: totalEquipments > 0 ? 100 : 0,
    detail: `${totalEquipments} equipamentos cadastrados`,
  });

  items.push({
    requirement: "Planos de manutencao preventiva",
    level: "1",
    status: totalPreventives > 0 ? (overduePreventives === 0 ? "conforme" : "parcial") : "nao_conforme",
    score: totalPreventives > 0 ? Math.max(0, 100 - (overduePreventives / Math.max(totalPreventives, 1) * 100)) : 0,
    detail: `${executedPreventives} executadas, ${overduePreventives} vencidas de ${totalPreventives} total`,
  });

  items.push({
    requirement: "Registros de manutencao corretiva",
    level: "1",
    status: totalTickets > 0 ? "conforme" : "parcial",
    score: totalTickets > 0 ? 100 : 50,
    detail: `${resolvedTickets} resolvidos de ${totalTickets} total`,
  });

  items.push({
    requirement: "Registros de treinamento",
    level: "1",
    status: trainings > 0 && completedTrainings > 0 ? "conforme" : trainings > 0 ? "parcial" : "nao_conforme",
    score: trainings > 0 ? (completedTrainings > 0 ? 100 : 50) : 0,
    detail: `${trainings} treinamentos, ${completedTrainings} conclusoes`,
  });

  items.push({
    requirement: "Tecnovigilancia (eventos adversos)",
    level: "1",
    status: adverseEvents > 0 ? "conforme" : "parcial",
    score: adverseEvents >= 0 ? 80 : 40,
    detail: adverseEvents > 0 ? `${adverseEvents} eventos registrados` : "Modulo disponivel, nenhum evento registrado",
  });

  items.push({
    requirement: "Indicadores de qualidade (MTBF/MTTR)",
    level: "1",
    status: resolvedTickets >= 2 ? "conforme" : "parcial",
    score: resolvedTickets >= 2 ? 100 : 50,
    detail: `MTBF/MTTR calculados a partir de ${resolvedTickets} chamados`,
  });

  // Level 2 checks
  items.push({
    requirement: "Melhoria continua (PDCA)",
    level: "2",
    status: nonConformities > 0 ? "conforme" : "nao_conforme",
    score: nonConformities > 0 ? 100 : 0,
    detail: nonConformities > 0 ? `${nonConformities} nao-conformidades registradas` : "Nenhum registro de PDCA",
  });

  items.push({
    requirement: "Metas de indicadores",
    level: "2",
    status: kpiTargets > 0 ? "conforme" : "nao_conforme",
    score: kpiTargets > 0 ? 100 : 0,
    detail: kpiTargets > 0 ? `${kpiTargets} metas definidas` : "Nenhuma meta configurada",
  });

  items.push({
    requirement: "Checklists de manutencao",
    level: "2",
    status: checklistResults > 0 ? "conforme" : "parcial",
    score: checklistResults > 0 ? 100 : 30,
    detail: `${checklistResults} checklists preenchidos, ${nonConformeItems} itens nao conformes`,
  });

  items.push({
    requirement: "Taxa de cumprimento preventivas",
    level: "2",
    status: preventiveCompliance >= 80 ? "conforme" : preventiveCompliance >= 50 ? "parcial" : "nao_conforme",
    score: Math.round(preventiveCompliance),
    detail: `${preventiveCompliance.toFixed(1)}% das preventivas executadas`,
  });

  const level1Items = items.filter(i => i.level === "1");
  const level2Items = items.filter(i => i.level === "2");
  const level1Score = level1Items.reduce((s, i) => s + i.score, 0) / level1Items.length;
  const level2Score = level2Items.reduce((s, i) => s + i.score, 0) / level2Items.length;
  const overallScore = items.reduce((s, i) => s + i.score, 0) / items.length;

  const dataForAI = items.map(i => `${i.requirement}: ${i.status} (${i.score}%) - ${i.detail}`).join("\n");

  const summary = await tryLLM(
    () => generateText(
      "Voce e um consultor de acreditacao ONA hospitalar. Analise os dados e gere um resumo executivo de 3-4 frases sobre o estado de conformidade. Portugues brasileiro. Nao use markdown.",
      `Dados de conformidade ONA:\n${dataForAI}\n\nScore Nivel 1: ${level1Score.toFixed(0)}%\nScore Nivel 2: ${level2Score.toFixed(0)}%\n\nGere um resumo com os principais gaps e prioridades.`
    ),
    `Score geral: ${overallScore.toFixed(0)}%. Nivel 1: ${level1Score.toFixed(0)}%, Nivel 2: ${level2Score.toFixed(0)}%.`
  );

  return { overallScore: Math.round(overallScore), level1Score: Math.round(level1Score), level2Score: Math.round(level2Score), items, summary };
}

// ============================================================
// Agente 13: Projeção TCO (GPT-4o-mini)
// ============================================================

export interface TCOInsight {
  equipmentId: string;
  equipmentName: string;
  patrimony: string | null;
  acquisitionValue: number;
  totalMaintenanceCost: number;
  currentBookValue: number;
  projectedCost5Years: number;
  replacementRecommended: boolean;
  analysis: string;
}

export async function runTCOAgent(): Promise<TCOInsight[]> {
  const { tenantId } = await checkPermission("ai.view");

  const equipments = await prisma.equipment.findMany({
    where: {
      tenantId,
      status: { not: "DESCARTADO" },
      acquisitionValue: { not: null },
      acquisitionDate: { not: null },
    },
    include: {
      preventiveMaintenances: { where: { status: "REALIZADA", cost: { not: null } }, select: { cost: true } },
      correctiveMaintenances: { where: { status: { in: ["RESOLVIDO", "FECHADO"] } }, select: { cost: true } },
    },
  });

  const insights: TCOInsight[] = [];

  for (const eq of equipments) {
    const acqVal = Number(eq.acquisitionValue) || 0;
    if (acqVal <= 0) continue;

    const prevCost = eq.preventiveMaintenances.reduce((s, m) => s + (m.cost ? Number(m.cost) : 0), 0);
    const corrCost = eq.correctiveMaintenances.reduce((s, m) => s + (m.cost ? Number(m.cost) : 0), 0);
    const totalMaint = prevCost + corrCost;

    const ageYears = (Date.now() - eq.acquisitionDate!.getTime()) / (365.25 * 24 * 3600000);
    const annualMaintCost = ageYears > 0 ? totalMaint / ageYears : 0;
    const projected5Years = annualMaintCost * 5;

    const vidaUtil = eq.vidaUtilAnos || 10;
    const depRate = 1 / vidaUtil;
    const residual = eq.valorResidual ? Number(eq.valorResidual) : 0;
    const depreciableAmount = acqVal - residual;
    const accumulated = Math.min(depRate * ageYears * depreciableAmount, depreciableAmount);
    const bookValue = Math.max(acqVal - accumulated, residual);

    const replacementRecommended = projected5Years > acqVal * 0.6 || (ageYears > vidaUtil && totalMaint > acqVal * 0.5);

    const analysis = await tryLLM(
      () => generateText(
        "Voce e um engenheiro clinico. Responda em portugues, 2-3 frases. Nao use markdown.",
        `Equipamento: ${eq.name} (${eq.brand || ""} ${eq.model || ""})\nValor aquisicao: R$${acqVal.toFixed(0)}\nIdade: ${ageYears.toFixed(1)} anos (vida util: ${vidaUtil})\nCusto manutencao total: R$${totalMaint.toFixed(0)}\nCusto anual medio: R$${annualMaintCost.toFixed(0)}\nProjecao 5 anos: R$${projected5Years.toFixed(0)}\nValor contabil: R$${bookValue.toFixed(0)}\nAnalise o TCO e recomende manter ou substituir.`
      ),
      replacementRecommended ? "Custo projetado elevado. Avaliar substituicao." : "TCO dentro do aceitavel."
    );

    insights.push({
      equipmentId: eq.id,
      equipmentName: eq.name,
      patrimony: eq.patrimony,
      acquisitionValue: acqVal,
      totalMaintenanceCost: totalMaint,
      currentBookValue: bookValue,
      projectedCost5Years: projected5Years,
      replacementRecommended,
      analysis,
    });
  }

  insights.sort((a, b) => (b.projectedCost5Years / b.acquisitionValue) - (a.projectedCost5Years / a.acquisitionValue));
  return insights.slice(0, 15);
}
