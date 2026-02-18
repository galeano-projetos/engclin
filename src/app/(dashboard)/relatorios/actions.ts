"use server";

import { prisma } from "@/lib/db";
import { getTenantId } from "@/lib/tenant";
import { checkPermission } from "@/lib/auth/require-role";
import { planAllows } from "@/lib/auth/plan-features";

export interface ReportRow {
  [key: string]: string | number | null;
}

export interface ReportData {
  title: string;
  columns: { key: string; label: string }[];
  rows: ReportRow[];
}

// =============================================
// 1. Inventário Completo
// =============================================
export async function getInventoryReport(): Promise<ReportData> {
  await checkPermission("report.view");
  const tenantId = await getTenantId();

  const equipments = await prisma.equipment.findMany({
    where: { tenantId },
    include: { unit: true },
    orderBy: { name: "asc" },
  });

  return {
    title: "Inventário Completo de Equipamentos",
    columns: [
      { key: "name", label: "Nome" },
      { key: "brand", label: "Marca" },
      { key: "model", label: "Modelo" },
      { key: "serialNumber", label: "Nº Série" },
      { key: "patrimony", label: "Patrimônio" },
      { key: "unit", label: "Setor" },
      { key: "criticality", label: "Criticidade" },
      { key: "status", label: "Status" },
      { key: "acquisitionDate", label: "Data Aquisição" },
      { key: "acquisitionValue", label: "Valor Aquisição (R$)" },
    ],
    rows: equipments.map((e) => ({
      name: e.name,
      brand: e.brand,
      model: e.model,
      serialNumber: e.serialNumber,
      patrimony: e.patrimony,
      unit: e.unit.name,
      criticality: e.criticality === "A" ? "1 - Critico" : e.criticality === "B" ? "2 - Moderado" : "3 - Baixo",
      status: statusLabel(e.status),
      acquisitionDate: e.acquisitionDate
        ? e.acquisitionDate.toLocaleDateString("pt-BR")
        : null,
      acquisitionValue: e.acquisitionValue ? Number(e.acquisitionValue) : null,
    })),
  };
}

// =============================================
// 2. Calibrações Vencidas e a Vencer
// =============================================
export async function getCalibrationReport(): Promise<ReportData> {
  const { plan } = await checkPermission("report.view");
  if (!planAllows(plan, "report.calibracoes")) {
    throw new Error("Relatório não disponível no seu plano.");
  }
  const tenantId = await getTenantId();

  const now = new Date();
  const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const maintenances = await prisma.preventiveMaintenance.findMany({
    where: {
      tenantId,
      status: "AGENDADA",
      dueDate: { lte: sixtyDaysFromNow },
    },
    include: {
      equipment: { select: { name: true, patrimony: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  return {
    title: "Calibrações Vencidas e a Vencer (60 dias)",
    columns: [
      { key: "equipment", label: "Equipamento" },
      { key: "patrimony", label: "Patrimônio" },
      { key: "type", label: "Tipo" },
      { key: "provider", label: "Fornecedor" },
      { key: "scheduledDate", label: "Data Agendada" },
      { key: "dueDate", label: "Vencimento" },
      { key: "situation", label: "Situação" },
      { key: "daysRemaining", label: "Dias" },
    ],
    rows: maintenances.map((m) => {
      const daysRemaining = Math.ceil(
        (m.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        equipment: m.equipment.name,
        patrimony: m.equipment.patrimony,
        type: m.type,
        provider: m.provider,
        scheduledDate: m.scheduledDate.toLocaleDateString("pt-BR"),
        dueDate: m.dueDate.toLocaleDateString("pt-BR"),
        situation: daysRemaining < 0 ? "VENCIDA" : "A VENCER",
        daysRemaining,
      };
    }),
  };
}

// =============================================
// 3. Histórico de Custos por Equipamento
// =============================================
export async function getCostReport(): Promise<ReportData> {
  const { plan } = await checkPermission("report.view");
  if (!planAllows(plan, "report.custos")) {
    throw new Error("Relatório não disponível no seu plano.");
  }
  const tenantId = await getTenantId();

  const equipments = await prisma.equipment.findMany({
    where: { tenantId, status: { not: "DESCARTADO" } },
    include: {
      preventiveMaintenances: {
        where: { status: "REALIZADA" },
        select: { cost: true },
      },
      correctiveMaintenances: {
        where: { status: { in: ["RESOLVIDO", "FECHADO"] } },
        select: { cost: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return {
    title: "Histórico de Custos por Equipamento",
    columns: [
      { key: "name", label: "Equipamento" },
      { key: "patrimony", label: "Patrimônio" },
      { key: "acquisitionValue", label: "Valor Aquisição (R$)" },
      { key: "preventiveCost", label: "Custo Preventivas (R$)" },
      { key: "correctiveCost", label: "Custo Corretivas (R$)" },
      { key: "totalCost", label: "Custo Total Manutenção (R$)" },
      { key: "costRatio", label: "% do Valor Aquisição" },
    ],
    rows: equipments.map((e) => {
      const preventiveCost = e.preventiveMaintenances.reduce(
        (sum, m) => sum + (m.cost ? Number(m.cost) : 0),
        0
      );
      const correctiveCost = e.correctiveMaintenances.reduce(
        (sum, m) => sum + (m.cost ? Number(m.cost) : 0),
        0
      );
      const totalCost = preventiveCost + correctiveCost;
      const acqVal = e.acquisitionValue ? Number(e.acquisitionValue) : null;
      const costRatio =
        acqVal && acqVal > 0
          ? ((totalCost / acqVal) * 100).toFixed(1) + "%"
          : "—";

      return {
        name: e.name,
        patrimony: e.patrimony,
        acquisitionValue: acqVal,
        preventiveCost: round2(preventiveCost),
        correctiveCost: round2(correctiveCost),
        totalCost: round2(totalCost),
        costRatio,
      };
    }),
  };
}

// =============================================
// 4. Indicadores de Chamados
// =============================================
export async function getTicketIndicatorsReport(): Promise<ReportData> {
  const { plan } = await checkPermission("report.view");
  if (!planAllows(plan, "report.chamados")) {
    throw new Error("Relatório não disponível no seu plano.");
  }
  const tenantId = await getTenantId();

  const tickets = await prisma.correctiveMaintenance.findMany({
    where: {
      tenantId,
      status: { in: ["RESOLVIDO", "FECHADO"] },
    },
    include: {
      equipment: { select: { name: true, patrimony: true } },
    },
  });

  // Agrupar por equipamento
  const byEquipment: Record<
    string,
    {
      name: string;
      patrimony: string | null;
      count: number;
      totalTimeMinutes: number;
      ticketsWithTime: number;
    }
  > = {};

  for (const t of tickets) {
    const key = t.equipmentId;
    if (!byEquipment[key]) {
      byEquipment[key] = {
        name: t.equipment.name,
        patrimony: t.equipment.patrimony,
        count: 0,
        totalTimeMinutes: 0,
        ticketsWithTime: 0,
      };
    }
    byEquipment[key].count++;
    if (t.timeSpent) {
      byEquipment[key].totalTimeMinutes += t.timeSpent;
      byEquipment[key].ticketsWithTime++;
    }
  }

  const rows = Object.values(byEquipment)
    .sort((a, b) => b.count - a.count)
    .map((eq) => {
      const avgTime =
        eq.ticketsWithTime > 0
          ? Math.round(eq.totalTimeMinutes / eq.ticketsWithTime)
          : null;
      return {
        name: eq.name,
        patrimony: eq.patrimony,
        ticketCount: eq.count,
        avgTimeMinutes: avgTime,
        avgTimeFormatted: avgTime != null ? formatMinutes(avgTime) : "—",
        reincidence: eq.count > 1 ? "Sim" : "Não",
      };
    });

  // Indicadores gerais
  const totalTickets = tickets.length;
  const ticketsWithTime = tickets.filter((t) => t.timeSpent).length;
  const totalTime = tickets.reduce((s, t) => s + (t.timeSpent || 0), 0);
  const overallAvg =
    ticketsWithTime > 0 ? Math.round(totalTime / ticketsWithTime) : 0;

  return {
    title: `Indicadores de Chamados — ${totalTickets} chamados resolvidos, tempo médio: ${formatMinutes(overallAvg)}`,
    columns: [
      { key: "name", label: "Equipamento" },
      { key: "patrimony", label: "Patrimônio" },
      { key: "ticketCount", label: "Nº Chamados" },
      { key: "avgTimeFormatted", label: "Tempo Médio Atendimento" },
      { key: "reincidence", label: "Reincidência" },
    ],
    rows,
  };
}

// Helpers
function statusLabel(status: string): string {
  const map: Record<string, string> = {
    ATIVO: "Ativo",
    INATIVO: "Inativo",
    EM_MANUTENCAO: "Em manutenção",
    DESCARTADO: "Descartado",
  };
  return map[status] || status;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}
