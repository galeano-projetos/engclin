"use server";

import { prisma } from "@/lib/db";
import { checkPermission } from "@/lib/auth/require-role";
import { chatCompletion } from "@/lib/ai/openai";
import { createServiceOrderInTx } from "@/lib/service-order";
import { revalidatePath } from "next/cache";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface EquipmentOption {
  id: string;
  name: string;
  patrimony: string | null;
  unitName: string;
}

const SYSTEM_PROMPT = `Voce e um assistente virtual de engenharia clinica do sistema Vitalis.
Seu papel e ajudar o usuario a abrir um chamado corretivo (ticket de manutencao) para um equipamento com defeito.

Voce precisa coletar as seguintes informacoes:
1. EQUIPAMENTO: Qual equipamento esta com problema (o usuario pode descrever pelo nome, patrimonio ou setor)
2. DESCRICAO: Uma descricao clara do problema
3. URGENCIA: A urgencia do chamado (BAIXA, MEDIA, ALTA ou CRITICA)

Instrucoes:
- Seja cordial e profissional. Fale em portugues brasileiro.
- Faca perguntas uma por vez para coletar as informacoes necessarias.
- Quando o usuario descrever o equipamento, tente identificar qual dos equipamentos disponiveis ele se refere.
- Ajude o usuario a classificar a urgencia com base no impacto clinico:
  - BAIXA: nao afeta atendimento, pode esperar
  - MEDIA: atendimento impactado parcialmente
  - ALTA: risco ao atendimento de pacientes
  - CRITICA: risco imediato a seguranca do paciente
- Quando tiver todas as informacoes, apresente um resumo e pergunte se o usuario confirma.
- Quando o usuario confirmar, responda EXATAMENTE neste formato na ultima linha da sua resposta:
  [CRIAR_CHAMADO: equipmentId="ID_AQUI" description="DESCRICAO_AQUI" urgency="URGENCIA_AQUI"]
- Nao invente informacoes. Se o usuario for vago, peca mais detalhes.
- Nao use markdown. Responda em texto simples.`;

export async function getEquipmentOptions(): Promise<EquipmentOption[]> {
  const { tenantId } = await checkPermission("ticket.create");

  const equipments = await prisma.equipment.findMany({
    where: { tenantId, status: { not: "DESCARTADO" } },
    include: { unit: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  return equipments.map((e) => ({
    id: e.id,
    name: e.name,
    patrimony: e.patrimony,
    unitName: e.unit.name,
  }));
}

export async function sendChatMessage(
  messages: ChatMessage[],
  equipmentList: EquipmentOption[]
): Promise<string> {
  await checkPermission("ticket.create");

  const equipmentContext = equipmentList
    .map(
      (e) =>
        `- ID: ${e.id} | Nome: ${e.name}${e.patrimony ? ` | Pat: ${e.patrimony}` : ""} | Setor: ${e.unitName}`
    )
    .join("\n");

  const fullSystem = `${SYSTEM_PROMPT}\n\nEquipamentos disponiveis:\n${equipmentContext}`;

  const chatMessages = [
    { role: "system" as const, content: fullSystem },
    ...messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  return chatCompletion(chatMessages);
}

export async function createTicketFromChat(
  equipmentId: string,
  description: string,
  urgency: string
): Promise<{ success: boolean; ticketId?: string; error?: string }> {
  try {
    const { tenantId, userId } = await checkPermission("ticket.create");

    const equipment = await prisma.equipment.findFirst({
      where: { id: equipmentId, tenantId },
    });

    if (!equipment) {
      return { success: false, error: "Equipamento nao encontrado." };
    }

    const validUrgencies = ["BAIXA", "MEDIA", "ALTA", "CRITICA"];
    const finalUrgency = validUrgencies.includes(urgency) ? urgency : "MEDIA";

    const ticket = await prisma.$transaction(async (tx) => {
      const created = await tx.correctiveMaintenance.create({
        data: {
          tenantId,
          equipmentId,
          openedById: userId,
          description,
          urgency: finalUrgency as "BAIXA" | "MEDIA" | "ALTA" | "CRITICA",
          status: "ABERTO",
        },
      });

      await tx.equipment.update({
        where: { id: equipmentId },
        data: { status: "EM_MANUTENCAO" },
      });

      await createServiceOrderInTx(tx, tenantId, {
        correctiveMaintenanceId: created.id,
      });

      return created;
    });

    revalidatePath("/chamados");
    return { success: true, ticketId: ticket.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao criar chamado.",
    };
  }
}
