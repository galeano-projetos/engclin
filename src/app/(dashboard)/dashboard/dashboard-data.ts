"use server";

import { prisma } from "@/lib/db";
import { getTenantId } from "@/lib/tenant";

/**
 * Dados agregados para os gráficos do dashboard avançado.
 */

export interface EquipmentByStatusData {
  status: string;
  count: number;
}

export interface EquipmentByCriticalityData {
  criticality: string;
  count: number;
}

export interface MaintenanceByMonthData {
  month: string;
  preventivas: number;
  corretivas: number;
}

export interface TicketsByUrgencyData {
  urgency: string;
  count: number;
}

export interface CalibrationStatusData {
  status: string;
  count: number;
}

const statusLabels: Record<string, string> = {
  ATIVO: "Ativo",
  INATIVO: "Inativo",
  EM_MANUTENCAO: "Em Manutenção",
  DESCARTADO: "Descartado",
};

const criticalityLabels: Record<string, string> = {
  ALTA: "Alta",
  MEDIA: "Média",
  BAIXA: "Baixa",
};

const urgencyLabels: Record<string, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  CRITICA: "Crítica",
};

const monthNames = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export async function getEquipmentByStatus(): Promise<EquipmentByStatusData[]> {
  const tenantId = await getTenantId();

  const result = await prisma.equipment.groupBy({
    by: ["status"],
    where: { tenantId },
    _count: { id: true },
  });

  return result.map((r) => ({
    status: statusLabels[r.status] || r.status,
    count: r._count.id,
  }));
}

export async function getEquipmentByCriticality(): Promise<EquipmentByCriticalityData[]> {
  const tenantId = await getTenantId();

  const result = await prisma.equipment.groupBy({
    by: ["criticality"],
    where: { tenantId, status: { not: "DESCARTADO" } },
    _count: { id: true },
  });

  return result.map((r) => ({
    criticality: criticalityLabels[r.criticality] || r.criticality,
    count: r._count.id,
  }));
}

export async function getMaintenanceByMonth(): Promise<MaintenanceByMonthData[]> {
  const tenantId = await getTenantId();
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  // Preventivas realizadas nos últimos 6 meses
  const preventives = await prisma.preventiveMaintenance.findMany({
    where: {
      tenantId,
      status: "REALIZADA",
      executionDate: { gte: sixMonthsAgo },
    },
    select: { executionDate: true },
  });

  // Corretivas fechadas nos últimos 6 meses
  const correctives = await prisma.correctiveMaintenance.findMany({
    where: {
      tenantId,
      status: { in: ["RESOLVIDO", "FECHADO"] },
      closedAt: { gte: sixMonthsAgo },
    },
    select: { closedAt: true },
  });

  // Montar mapa dos últimos 6 meses
  const months: MaintenanceByMonthData[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = `${monthNames[d.getMonth()]}/${d.getFullYear().toString().slice(-2)}`;

    const prevCount = preventives.filter((p) => {
      if (!p.executionDate) return false;
      return (
        p.executionDate.getFullYear() === d.getFullYear() &&
        p.executionDate.getMonth() === d.getMonth()
      );
    }).length;

    const corrCount = correctives.filter((c) => {
      if (!c.closedAt) return false;
      return (
        c.closedAt.getFullYear() === d.getFullYear() &&
        c.closedAt.getMonth() === d.getMonth()
      );
    }).length;

    months.push({ month: label, preventivas: prevCount, corretivas: corrCount });
  }

  return months;
}

export async function getTicketsByUrgency(): Promise<TicketsByUrgencyData[]> {
  const tenantId = await getTenantId();

  const result = await prisma.correctiveMaintenance.groupBy({
    by: ["urgency"],
    where: {
      tenantId,
      status: { in: ["ABERTO", "EM_ATENDIMENTO"] },
    },
    _count: { id: true },
  });

  return result.map((r) => ({
    urgency: urgencyLabels[r.urgency] || r.urgency,
    count: r._count.id,
  }));
}

export async function getCalibrationStatus(): Promise<CalibrationStatusData[]> {
  const tenantId = await getTenantId();
  const now = new Date();

  const scheduled = await prisma.preventiveMaintenance.findMany({
    where: { tenantId, status: "AGENDADA" },
    select: { dueDate: true },
  });

  let emDia = 0;
  let vencendo = 0; // < 30 dias
  let vencida = 0;

  for (const s of scheduled) {
    const diff = Math.ceil(
      (s.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff < 0) {
      vencida++;
    } else if (diff <= 30) {
      vencendo++;
    } else {
      emDia++;
    }
  }

  const realized = await prisma.preventiveMaintenance.count({
    where: { tenantId, status: "REALIZADA" },
  });

  return [
    { status: "Em dia", count: emDia },
    { status: "Vencendo (30d)", count: vencendo },
    { status: "Vencida", count: vencida },
    { status: "Realizada", count: realized },
  ].filter((d) => d.count > 0);
}
