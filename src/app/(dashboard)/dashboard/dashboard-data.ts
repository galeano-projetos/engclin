"use server";

import { prisma } from "@/lib/db";

/**
 * Dados agregados para os graficos do dashboard avancado.
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

export interface ServiceTypeStatusData {
  serviceType: string;
  label: string;
  emDia: number;
  vencendo: number;
  vencida: number;
  realizada: number;
}

const statusLabels: Record<string, string> = {
  ATIVO: "Ativo",
  INATIVO: "Inativo",
  EM_MANUTENCAO: "Em Manutencao",
  DESCARTADO: "Descartado",
};

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

const monthNames = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export async function getEquipmentByStatus(tenantId: string): Promise<EquipmentByStatusData[]> {
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

export async function getEquipmentByCriticality(tenantId: string): Promise<EquipmentByCriticalityData[]> {
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

export async function getMaintenanceByMonth(tenantId: string): Promise<MaintenanceByMonthData[]> {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  // Preventivas realizadas nos ultimos 6 meses
  const preventives = await prisma.preventiveMaintenance.findMany({
    where: {
      tenantId,
      status: "REALIZADA",
      executionDate: { gte: sixMonthsAgo },
    },
    select: { executionDate: true },
  });

  // Corretivas fechadas nos ultimos 6 meses
  const correctives = await prisma.correctiveMaintenance.findMany({
    where: {
      tenantId,
      status: { in: ["RESOLVIDO", "FECHADO"] },
      closedAt: { gte: sixMonthsAgo },
    },
    select: { closedAt: true },
  });

  // Montar mapa dos ultimos 6 meses
  const months: MaintenanceByMonthData[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
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

export async function getTicketsByUrgency(tenantId: string): Promise<TicketsByUrgencyData[]> {
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

export async function getCalibrationStatus(tenantId: string): Promise<CalibrationStatusData[]> {
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

export async function getServiceTypeStatus(tenantId: string): Promise<ServiceTypeStatusData[]> {
  const now = new Date();

  const types = [
    { type: "PREVENTIVA" as const, label: "Preventiva" },
    { type: "CALIBRACAO" as const, label: "Calibracao" },
    { type: "TSE" as const, label: "TSE" },
  ];

  // 2 queries instead of 6 (was N+1 per service type)
  const [allScheduled, realizedCounts] = await Promise.all([
    prisma.preventiveMaintenance.findMany({
      where: { tenantId, status: "AGENDADA" },
      select: { serviceType: true, dueDate: true },
    }),
    prisma.preventiveMaintenance.groupBy({
      by: ["serviceType"],
      where: { tenantId, status: "REALIZADA" },
      _count: { id: true },
    }),
  ]);

  const realizedMap = new Map(
    realizedCounts.map((r) => [r.serviceType, r._count.id])
  );

  return types.map(({ type, label }) => {
    let emDia = 0;
    let vencendo = 0;
    let vencida = 0;

    for (const s of allScheduled) {
      if (s.serviceType !== type) continue;
      const diff = Math.ceil(
        (s.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diff < 0) vencida++;
      else if (diff <= 30) vencendo++;
      else emDia++;
    }

    return {
      serviceType: type,
      label,
      emDia,
      vencendo,
      vencida,
      realizada: realizedMap.get(type) || 0,
    };
  });
}
