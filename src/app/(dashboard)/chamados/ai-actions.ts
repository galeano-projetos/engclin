"use server";

import { prisma } from "@/lib/db";
import { checkPermission } from "@/lib/auth/require-role";
import { generateText } from "@/lib/ai/openai";
import { Urgency } from "@prisma/client";

export interface AISuggestion {
  diagnosis: string;
  solution: string;
  partsUsed: string;
  confidence: string;
}

export async function suggestSolution(
  ticketId: string
): Promise<{ error?: string; suggestion?: AISuggestion }> {
  try {
    const { tenantId } = await checkPermission("ticket.view");

    // Fetch the current ticket
    const ticket = await prisma.correctiveMaintenance.findFirst({
      where: { id: ticketId, tenantId },
      include: {
        equipment: {
          select: { name: true, brand: true, model: true, criticality: true },
        },
      },
    });

    if (!ticket) {
      return { error: "Chamado nao encontrado." };
    }

    // Fetch similar resolved tickets for this equipment model/brand
    const similarTickets = await prisma.correctiveMaintenance.findMany({
      where: {
        tenantId,
        status: { in: ["RESOLVIDO", "FECHADO"] },
        solution: { not: null },
        equipment: {
          ...(ticket.equipment.brand ? { brand: ticket.equipment.brand } : {}),
          ...(ticket.equipment.model ? { model: ticket.equipment.model } : {}),
        },
      },
      select: {
        description: true,
        diagnosis: true,
        solution: true,
        partsUsed: true,
        equipment: { select: { name: true } },
      },
      orderBy: { closedAt: "desc" },
      take: 10,
    });

    // Build context
    const historicalContext = similarTickets.length > 0
      ? similarTickets
          .map(
            (t, i) =>
              `Chamado ${i + 1}: Equipamento: ${t.equipment.name}\nProblema: ${t.description}\nDiagnostico: ${t.diagnosis || "N/A"}\nSolucao: ${t.solution}\nPecas: ${t.partsUsed || "N/A"}`
          )
          .join("\n\n")
      : "Nenhum historico de chamados similares encontrado.";

    const systemPrompt = `Voce e um assistente de engenharia clinica hospitalar. Analise o chamado aberto e sugira um diagnostico e solucao baseado no historico de chamados anteriores similares. Responda APENAS em JSON valido com o formato:
{"diagnosis": "texto do diagnostico sugerido", "solution": "texto da solucao sugerida", "partsUsed": "pecas que podem ser necessarias", "confidence": "alta|media|baixa"}`;

    const userPrompt = `CHAMADO ATUAL:
Equipamento: ${ticket.equipment.name} (${ticket.equipment.brand || ""} ${ticket.equipment.model || ""})
Criticidade: ${ticket.equipment.criticality}
Problema reportado: ${ticket.description}

HISTORICO DE CHAMADOS SIMILARES:
${historicalContext}

Com base no historico, sugira diagnostico e solucao para o chamado atual.`;

    const response = await generateText(systemPrompt, userPrompt);

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { error: "Nao foi possivel gerar sugestao. Tente novamente." };
    }

    const suggestion = JSON.parse(jsonMatch[0]) as AISuggestion;
    return { suggestion };
  } catch (error) {
    console.error("[suggestSolution] Erro:", error);
    return { error: "Erro ao gerar sugestao. Verifique se a API de IA esta configurada." };
  }
}

export async function autoTriageTicket(
  ticketId: string,
  tenantId: string,
  equipmentCriticality: string,
  description: string
): Promise<void> {
  if (!process.env.OPENAI_API_KEY) return;

  try {
    const response = await generateText(
      "Voce e um triador de chamados de engenharia clinica. Classifique a urgencia do chamado: BAIXA (nao afeta atendimento), MEDIA (impacto parcial), ALTA (risco ao atendimento), CRITICA (risco imediato a seguranca). Responda APENAS com a classificacao: BAIXA, MEDIA, ALTA ou CRITICA.",
      `Criticidade do equipamento: ${equipmentCriticality === "A" ? "Critico" : equipmentCriticality === "B" ? "Moderado" : "Baixo"}\nDescricao do problema: ${description}`
    );

    const suggested = response.trim().toUpperCase();
    const valid = ["BAIXA", "MEDIA", "ALTA", "CRITICA"];
    if (valid.includes(suggested)) {
      // Only upgrade urgency, never downgrade
      const urgencyOrder: Record<string, number> = { BAIXA: 0, MEDIA: 1, ALTA: 2, CRITICA: 3 };
      const current = await prisma.correctiveMaintenance.findFirst({
        where: { id: ticketId, tenantId },
        select: { urgency: true },
      });
      if (current && urgencyOrder[suggested] > urgencyOrder[current.urgency]) {
        await prisma.correctiveMaintenance.update({
          where: { id: ticketId },
          data: { urgency: suggested as Urgency },
        });
      }
    }
  } catch (error) {
    console.error("[autoTriage] Error:", error);
  }
}
