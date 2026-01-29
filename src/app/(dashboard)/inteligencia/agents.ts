"use server";

import { prisma } from "@/lib/db";
import { checkPermission } from "@/lib/auth/require-role";

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
  costRatio: number; // custo total / valor aquisição
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

// ============================================================
// Agente 1: Custo-Benefício
// ============================================================

export async function runCostBenefitAgent(): Promise<CostBenefitInsight[]> {
  const { tenantId } = await checkPermission("ai.view");

  // Buscar equipamentos com valor de aquisição
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
    const acquisitionValue = eq.acquisitionValue || 0;
    if (acquisitionValue <= 0) continue;

    const preventiveCost = eq.preventiveMaintenances.reduce(
      (sum, m) => sum + (m.cost || 0),
      0
    );
    const correctiveCost = eq.correctiveMaintenances.reduce(
      (sum, m) => sum + (m.cost || 0),
      0
    );
    const totalCost = preventiveCost + correctiveCost;
    const costRatio = totalCost / acquisitionValue;

    const ageYears = eq.acquisitionDate
      ? (Date.now() - eq.acquisitionDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      : 0;

    const correctiveCount = eq.correctiveMaintenances.length;

    let recommendation: CostBenefitInsight["recommendation"];
    let reasoning: string;

    if (costRatio >= 0.7) {
      recommendation = "substituir";
      reasoning = `O custo total de manutenção (R$ ${totalCost.toFixed(2)}) atingiu ${(costRatio * 100).toFixed(0)}% do valor de aquisição (R$ ${acquisitionValue.toFixed(2)}). Recomenda-se avaliar a substituição deste equipamento.`;
    } else if (costRatio >= 0.4 || correctiveCount >= 5) {
      recommendation = "monitorar";
      reasoning = `O custo de manutenção está em ${(costRatio * 100).toFixed(0)}% do valor de aquisição com ${correctiveCount} corretivas registradas. Manter monitoramento próximo.`;
    } else {
      recommendation = "adequado";
      reasoning = `Custo de manutenção em ${(costRatio * 100).toFixed(0)}% do valor de aquisição. Relação custo-benefício dentro do esperado.`;
    }

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

  // Ordenar: substituir primeiro, depois monitorar, depois adequado
  const order = { substituir: 0, monitorar: 1, adequado: 2 };
  insights.sort((a, b) => order[a.recommendation] - order[b.recommendation] || b.costRatio - a.costRatio);

  return insights;
}

// ============================================================
// Agente 2: Manutenção Preditiva
// ============================================================

export async function runPredictiveAgent(): Promise<PredictiveInsight[]> {
  const { tenantId } = await checkPermission("ai.view");

  // Agrupar equipamentos por modelo+marca
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

  // Agrupar por modelo+marca
  const groups = new Map<
    string,
    {
      model: string;
      brand: string;
      equipments: typeof equipments;
    }
  >();

  for (const eq of equipments) {
    const key = `${eq.brand || "N/A"}|||${eq.model || "N/A"}`;
    if (!groups.has(key)) {
      groups.set(key, {
        model: eq.model || "N/A",
        brand: eq.brand || "N/A",
        equipments: [],
      });
    }
    groups.get(key)!.equipments.push(eq);
  }

  const insights: PredictiveInsight[] = [];

  for (const [, group] of groups) {
    if (group.equipments.length < 2) continue; // precisa de pelo menos 2 unidades para identificar padrões

    const totalFailures = group.equipments.reduce(
      (sum, eq) => sum + eq.correctiveMaintenances.length,
      0
    );

    if (totalFailures === 0) continue;

    const avgFailures = totalFailures / group.equipments.length;

    // Identificar problemas mais comuns por palavras-chave nas descrições
    const descriptions = group.equipments.flatMap((eq) =>
      eq.correctiveMaintenances.map((m) => m.description.toLowerCase())
    );

    const issueKeywords = extractCommonIssues(descriptions);

    let recommendation: string;
    if (avgFailures >= 3) {
      recommendation = `Alta taxa de falhas (${avgFailures.toFixed(1)}/unidade). Recomenda-se criar plano de manutenção preventiva específico para este modelo, com foco em: ${issueKeywords.join(", ") || "problemas recorrentes"}.`;
    } else if (avgFailures >= 1.5) {
      recommendation = `Taxa moderada de falhas (${avgFailures.toFixed(1)}/unidade). Sugerido monitoramento mais frequente e inspeções periódicas.`;
    } else {
      recommendation = `Taxa aceitável de falhas (${avgFailures.toFixed(1)}/unidade). Manter plano preventivo atual.`;
    }

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

  // Ordenar por média de falhas (desc)
  insights.sort((a, b) => b.avgFailuresPerUnit - a.avgFailuresPerUnit);

  return insights;
}

/** Extrai temas/problemas comuns das descrições de chamados */
function extractCommonIssues(descriptions: string[]): string[] {
  const keywords: Record<string, number> = {};

  // Termos técnicos comuns em engenharia clínica
  const terms = [
    "não liga", "tela", "ruído", "vazamento", "aquecimento",
    "erro", "alarme", "sensor", "cabo", "bateria", "calibração",
    "pressão", "temperatura", "display", "motor", "bomba",
    "placa", "software", "travamento", "leitura", "desligando",
    "quebr", "desgast", "oxigênio", "fluxo", "válvula",
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
// Agente 3: Priorização de Chamados
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
    A: "Alta",
    B: "Média",
    C: "Baixa",
  };

  const urgencyLabels: Record<string, string> = {
    BAIXA: "Baixa",
    MEDIA: "Média",
    ALTA: "Alta",
    CRITICA: "Crítica",
  };

  const insights: PrioritizationInsight[] = openTickets.map((ticket) => {
    const daysSinceOpened = Math.floor(
      (now.getTime() - ticket.openedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calcular score de prioridade (0-100)
    let score = 0;

    // Urgência (0-40 pontos)
    const urgencyScores: Record<string, number> = {
      CRITICA: 40,
      ALTA: 30,
      MEDIA: 15,
      BAIXA: 5,
    };
    score += urgencyScores[ticket.urgency] || 0;

    // Criticidade do equipamento (0-30 pontos)
    const critScores: Record<string, number> = { A: 30, B: 15, C: 5 };
    score += critScores[ticket.equipment.criticality] || 0;

    // Tempo de espera (0-30 pontos, máximo em 15+ dias)
    score += Math.min(daysSinceOpened * 2, 30);

    // Classificar
    let priorityLabel: string;
    let reasoning: string;

    if (score >= 70) {
      priorityLabel = "Urgente";
      reasoning = `Prioridade máxima: equipamento de criticidade ${criticalityLabels[ticket.equipment.criticality]}, urgência ${urgencyLabels[ticket.urgency]}${daysSinceOpened > 3 ? `, aguardando há ${daysSinceOpened} dias` : ""}.`;
    } else if (score >= 45) {
      priorityLabel = "Alta";
      reasoning = `Prioridade alta: ${daysSinceOpened > 5 ? `aguardando há ${daysSinceOpened} dias, ` : ""}equipamento ${criticalityLabels[ticket.equipment.criticality]}, urgência ${urgencyLabels[ticket.urgency]}.`;
    } else if (score >= 25) {
      priorityLabel = "Moderada";
      reasoning = `Prioridade moderada. Atender conforme disponibilidade da equipe técnica.`;
    } else {
      priorityLabel = "Baixa";
      reasoning = `Prioridade baixa. Pode ser agendado para o próximo ciclo de atendimento.`;
    }

    return {
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
    };
  });

  // Ordenar por score (desc)
  insights.sort((a, b) => b.priorityScore - a.priorityScore);

  return insights;
}
