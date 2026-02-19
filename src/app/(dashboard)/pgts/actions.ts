"use server";

import { prisma } from "@/lib/db";
import { checkPermission } from "@/lib/auth/require-role";
import { generateText } from "@/lib/ai/openai";
import { revalidatePath } from "next/cache";

const SYSTEM_PROMPT =
  "Voce e um engenheiro clinico senior especialista em gestao de equipamentos medicos. " +
  "Elabore textos tecnicos para o Plano de Gerenciamento de Tecnologias em Saude (PGTS) conforme a RDC 509/2021 da Anvisa. " +
  "Responda em portugues brasileiro, de forma clara e profissional. Nao use markdown. Nao use asteriscos ou caracteres especiais de formatacao. " +
  "IMPORTANTE: Refira-se ao estabelecimento sempre como 'empresa' ou pelo nome proprio, nunca como 'hospital' (pois nem todo estabelecimento e um hospital).";

interface TenantContext {
  name: string;
  cnpj: string;
  totalEquipments: number;
  totalUnits: number;
  totalUsers: number;
  criticalityA: number;
  criticalityB: number;
  criticalityC: number;
}

function buildUserPrompt(sectionKey: string, ctx: TenantContext): string {
  const base = `Empresa: ${ctx.name}\nCNPJ: ${ctx.cnpj}\nTotal de equipamentos: ${ctx.totalEquipments}\nTotal de unidades/setores: ${ctx.totalUnits}\nTotal de colaboradores: ${ctx.totalUsers}\nEquipamentos criticidade A (alta): ${ctx.criticalityA}\nEquipamentos criticidade B (media): ${ctx.criticalityB}\nEquipamentos criticidade C (baixa): ${ctx.criticalityC}\n\n`;

  const prompts: Record<string, string> = {
    objetivo:
      base +
      "Elabore um texto para a secao 'Objetivo do Plano' do PGTS. " +
      "O texto deve abordar a garantia de rastreabilidade, qualidade, eficacia, efetividade e seguranca das tecnologias em saude. " +
      "Mencione a conformidade com a RDC 509/2021 da Anvisa. Escreva 2-3 paragrafos.",

    estrutura_organizacional:
      base +
      "Elabore um texto para a secao 'Estrutura Organizacional' do PGTS. " +
      "Descreva a estrutura recomendada para o setor de engenharia clinica da empresa, " +
      "incluindo responsabilidades do engenheiro clinico, tecnicos e coordenadores. Escreva 2-3 paragrafos.",

    etapas_gerenciamento:
      base +
      "Elabore um texto para a secao 'Etapas do Gerenciamento' do PGTS. " +
      "Descreva as etapas do ciclo de vida das tecnologias: incorporacao, recebimento, instalacao, " +
      "utilizacao, manutencao preventiva e corretiva, calibracao e desativacao. Escreva 3-4 paragrafos.",

    gerenciamento_riscos:
      base +
      "Elabore um texto para a secao 'Gerenciamento de Riscos' do PGTS. " +
      "Aborde a classificacao de criticidade dos equipamentos (A, B, C), planos de contingencia, " +
      "indicadores de desempenho (MTBF, MTTR) e gestao de alertas tecnicos. Escreva 2-3 paragrafos.",

    rastreabilidade:
      base +
      "Elabore um texto para a secao 'Rastreabilidade' do PGTS. " +
      "Descreva o sistema de rastreabilidade de equipamentos medicos, incluindo registro patrimonial, " +
      "numero de serie, registro ANVISA e historico de manutencoes. Escreva 2-3 paragrafos.",

    capacitacao:
      base +
      "Elabore um texto para a secao 'Capacitacao e Treinamento' do PGTS. " +
      "Descreva o programa de treinamento para operadores de equipamentos medicos, " +
      "incluindo treinamentos iniciais, periodicos e de reciclagem. Escreva 2-3 paragrafos.",

    infraestrutura:
      base +
      "Elabore um texto para a secao 'Infraestrutura Fisica' do PGTS. " +
      "Descreva os requisitos de infraestrutura para operacao segura de equipamentos medicos, " +
      "incluindo instalacoes eletricas, climatizacao, aterramento e areas tecnicas. Escreva 2-3 paragrafos.",

    documentacao:
      base +
      "Elabore um texto para a secao 'Documentacao e Registros' do PGTS. " +
      "Descreva o sistema de documentacao e registros do setor de engenharia clinica, " +
      "incluindo ordens de servico, laudos, contratos e certificados de calibracao. Escreva 2-3 paragrafos.",

    avaliacao_anual:
      base +
      "Elabore um texto para a secao 'Avaliacao Anual' do PGTS. " +
      "Descreva os indicadores e metricas para avaliacao anual do plano, " +
      "incluindo taxa de conformidade de manutencoes, custos, disponibilidade dos equipamentos e metas. Escreva 2-3 paragrafos.",
  };

  return prompts[sectionKey] || base + `Elabore um texto para a secao '${sectionKey}' do PGTS. Escreva 2-3 paragrafos.`;
}

export async function suggestSectionText(
  sectionKey: string
): Promise<{ text?: string; error?: string }> {
  try {
    const { tenantId } = await checkPermission("pgts.create");

    if (!process.env.OPENAI_API_KEY) {
      return { error: "Chave da OpenAI nao configurada. Configure OPENAI_API_KEY nas variaveis de ambiente." };
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, cnpj: true },
    });

    if (!tenant) {
      return { error: "Tenant nao encontrado." };
    }

    const [totalEquipments, totalUnits, totalUsers, critA, critB, critC] =
      await Promise.all([
        prisma.equipment.count({ where: { tenantId } }),
        prisma.unit.count({ where: { tenantId } }),
        prisma.user.count({ where: { tenantId, active: true } }),
        prisma.equipment.count({ where: { tenantId, criticality: "A" } }),
        prisma.equipment.count({ where: { tenantId, criticality: "B" } }),
        prisma.equipment.count({ where: { tenantId, criticality: "C" } }),
      ]);

    const ctx: TenantContext = {
      name: tenant.name,
      cnpj: tenant.cnpj,
      totalEquipments,
      totalUnits,
      totalUsers,
      criticalityA: critA,
      criticalityB: critB,
      criticalityC: critC,
    };

    const text = await generateText(SYSTEM_PROMPT, buildUserPrompt(sectionKey, ctx));

    if (!text) {
      return { error: "A IA nao retornou texto. Tente novamente." };
    }

    return { text };
  } catch (error) {
    console.error("[suggestSectionText] Erro:", error instanceof Error ? error.message : error);
    return { error: "Erro ao gerar sugestao. Tente novamente." };
  }
}

// Sections that should be auto-filled with IA if empty
const TEXT_SECTION_KEYS = [
  "objetivo",
  "estrutura_organizacional",
  "etapas_gerenciamento",
  "gerenciamento_riscos",
  "rastreabilidade",
  "capacitacao",
  "infraestrutura",
  "documentacao",
  "avaliacao_anual",
];

async function autoFillEmptySections(
  sections: Record<string, string>,
  tenantId: string
): Promise<Record<string, string>> {
  if (!process.env.OPENAI_API_KEY) return sections;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true, cnpj: true },
  });
  if (!tenant) return sections;

  const [totalEquipments, totalUnits, totalUsers, critA, critB, critC] =
    await Promise.all([
      prisma.equipment.count({ where: { tenantId } }),
      prisma.unit.count({ where: { tenantId } }),
      prisma.user.count({ where: { tenantId, active: true } }),
      prisma.equipment.count({ where: { tenantId, criticality: "A" } }),
      prisma.equipment.count({ where: { tenantId, criticality: "B" } }),
      prisma.equipment.count({ where: { tenantId, criticality: "C" } }),
    ]);

  const ctx: TenantContext = {
    name: tenant.name,
    cnpj: tenant.cnpj,
    totalEquipments,
    totalUnits,
    totalUsers,
    criticalityA: critA,
    criticalityB: critB,
    criticalityC: critC,
  };

  const filled = { ...sections };

  // Generate text for all empty sections in parallel
  const emptyKeys = TEXT_SECTION_KEYS.filter((k) => !filled[k]?.trim());
  if (emptyKeys.length === 0) return filled;

  console.log(`[PGTS] Auto-preenchendo ${emptyKeys.length} se\u00e7\u00f5es com IA...`);

  const results = await Promise.allSettled(
    emptyKeys.map(async (key) => {
      const text = await generateText(SYSTEM_PROMPT, buildUserPrompt(key, ctx));
      return { key, text };
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled" && result.value.text) {
      filled[result.value.key] = result.value.text;
    }
  }

  return filled;
}

export async function generatePgts(
  sections: Record<string, string>
): Promise<{ id?: string; error?: string }> {
  try {
    const { tenantId, userId } = await checkPermission("pgts.create");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    // Auto-fill empty text sections with IA
    const filledSections = await autoFillEmptySections(sections, tenantId);

    // Calculate next version
    const lastVersion = await prisma.pgtsVersion.findFirst({
      where: { tenantId },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    const nextVersion = (lastVersion?.version ?? 0) + 1;

    // Generate PDF
    const { generatePgtsPdf } = await import("@/lib/pgts/generate-pdf");
    const pdfBuffer = await generatePgtsPdf(tenantId, filledSections, user?.name ?? "Usu\u00e1rio");

    const fileName = `PGTS_v${nextVersion}_${new Date().toISOString().slice(0, 10)}.pdf`;

    const pgts = await prisma.pgtsVersion.create({
      data: {
        tenantId,
        version: nextVersion,
        generatedBy: userId,
        fileName,
        fileData: Buffer.from(pdfBuffer),
        sections: filledSections,
      },
    });

    revalidatePath("/pgts");
    return { id: pgts.id };
  } catch (error) {
    console.error("[generatePgts] Erro:", error instanceof Error ? error.message : error);
    return { error: "Erro ao gerar PGTS. Tente novamente." };
  }
}
