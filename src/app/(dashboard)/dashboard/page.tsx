import { prisma } from "@/lib/db";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/auth/require-role";
import { planAllows } from "@/lib/auth/plan-features";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  getEquipmentByStatus,
  getEquipmentByCriticality,
  getMaintenanceByMonth,
  getTicketsByUrgency,
  getCalibrationStatus,
  getServiceTypeStatus,
} from "./dashboard-data";
import {
  EquipmentByStatusChart,
  EquipmentByCriticalityChart,
  MaintenanceByMonthChart,
  TicketsByUrgencyChart,
  CalibrationStatusChart,
} from "./dashboard-charts";
import { serviceTypeLabel } from "@/lib/utils/periodicity";
import { computeGlobalMtbfMttr, formatHours } from "@/lib/mtbf-mttr";
import { computeDepreciationSummary, formatBRL } from "@/lib/depreciation";
import { PgtsExportButton } from "./pgts-export-button";

interface PageProps {
  searchParams: Promise<{ upgrade?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { plan } = await requirePermission("dashboard.view");
  const tenantId = await getTenantId();
  const now = new Date();

  // Queries em paralelo
  const [
    totalEquipments,
    activeEquipments,
    openTickets,
    overdueCount,
    upcomingPreventives,
    recentTickets,
    chartEquipByStatus,
    chartEquipByCrit,
    chartMaintByMonth,
    chartTicketsByUrg,
    chartCalibStatus,
    serviceTypeStats,
    allClosedTickets,
    equipmentsForDepreciation,
    latestPgts,
  ] = await Promise.all([
    prisma.equipment.count({
      where: { tenantId },
    }),
    prisma.equipment.count({
      where: { tenantId, status: "ATIVO" },
    }),
    prisma.correctiveMaintenance.count({
      where: {
        tenantId,
        status: { in: ["ABERTO", "EM_ATENDIMENTO"] },
      },
    }),
    prisma.preventiveMaintenance.count({
      where: {
        tenantId,
        status: "AGENDADA",
        dueDate: { lt: now },
      },
    }),
    prisma.preventiveMaintenance.findMany({
      where: {
        tenantId,
        status: "AGENDADA",
        dueDate: {
          gte: now,
          lte: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        equipment: { select: { name: true, patrimony: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),
    prisma.correctiveMaintenance.findMany({
      where: {
        tenantId,
        status: { in: ["ABERTO", "EM_ATENDIMENTO"] },
      },
      include: {
        equipment: { select: { name: true } },
        openedBy: { select: { name: true } },
      },
      orderBy: { openedAt: "desc" },
      take: 5,
    }),
    getEquipmentByStatus(),
    getEquipmentByCriticality(),
    getMaintenanceByMonth(),
    getTicketsByUrgency(),
    getCalibrationStatus(),
    getServiceTypeStatus(),
    prisma.correctiveMaintenance.findMany({
      where: {
        tenantId,
        closedAt: { not: null, gte: new Date(now.getFullYear() - 1, now.getMonth(), 1) },
      },
      select: { equipmentId: true, openedAt: true, closedAt: true },
      orderBy: [{ equipmentId: "asc" }, { openedAt: "asc" }],
    }),
    prisma.equipment.findMany({
      where: { tenantId, status: { not: "DESCARTADO" } },
      select: {
        id: true,
        name: true,
        patrimony: true,
        acquisitionValue: true,
        acquisitionDate: true,
        vidaUtilAnos: true,
        metodoDepreciacao: true,
        valorResidual: true,
      },
    }),
    prisma.pgtsVersion.findFirst({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    }),
  ]);

  // overdueCount is already a number from count()

  const globalMtbfMttr = computeGlobalMtbfMttr(
    allClosedTickets.map((t) => ({
      equipmentId: t.equipmentId,
      openedAt: t.openedAt,
      closedAt: t.closedAt!,
    }))
  );

  // Depreciacao (Enterprise only)
  const showDepreciation = planAllows(plan, "depreciation.view");
  const depreciationSummary = showDepreciation
    ? computeDepreciationSummary(
        equipmentsForDepreciation.map((e) => ({
          ...e,
          acquisitionValue: e.acquisitionValue ? Number(e.acquisitionValue) : null,
          valorResidual: e.valorResidual ? Number(e.valorResidual) : null,
        }))
      )
    : null;

  const stats = [
    {
      label: "Total de Equipamentos",
      value: totalEquipments,
      color: "bg-blue-500",
      href: "/equipamentos",
    },
    {
      label: "Servicos Vencidos",
      value: overdueCount,
      color: overdueCount > 0 ? "bg-red-500" : "bg-green-500",
      href: "/manutencoes?status=VENCIDA",
    },
    {
      label: "Chamados Abertos",
      value: openTickets,
      color: openTickets > 0 ? "bg-yellow-500" : "bg-green-500",
      href: "/chamados?status=ABERTO",
    },
    {
      label: "Equipamentos Ativos",
      value: activeEquipments,
      color: "bg-green-500",
      href: "/equipamentos?status=ATIVO",
    },
  ];

  const urgencyVariant: Record<string, "muted" | "info" | "warning" | "danger"> = {
    BAIXA: "muted",
    MEDIA: "info",
    ALTA: "warning",
    CRITICA: "danger",
  } as const;

  const urgencyLabels: Record<string, string> = {
    BAIXA: "Baixa",
    MEDIA: "Media",
    ALTA: "Alta",
    CRITICA: "Critica",
  } as const;

  return (
    <div>
      {params.upgrade && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Este recurso não está disponível no seu plano atual. Entre em contato para fazer upgrade.
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Visao geral do parque tecnologico
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/chamados/novo"
            className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Chamado
          </Link>
          <Link
            href="/manutencoes/nova"
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Preventiva
          </Link>
          <Link
            href="/equipamentos/novo"
            className="inline-flex items-center gap-1.5 rounded-md bg-gray-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-700 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Equipamento
          </Link>
        </div>
      </div>

      {/* Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <div className="rounded-lg border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${stat.color}`} />
                <p className="text-sm font-medium text-gray-500">
                  {stat.label}
                </p>
              </div>
              <p className="mt-3 text-3xl font-bold text-gray-900">
                {stat.value}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Indicadores de Confiabilidade */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <p className="text-sm font-medium text-gray-500">
              MTTR — Tempo Medio de Reparo
            </p>
          </div>
          <p className="mt-3 text-3xl font-bold text-gray-900">
            {formatHours(globalMtbfMttr.mttr)}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {globalMtbfMttr.totalTickets > 0
              ? `Baseado em ${globalMtbfMttr.totalTickets} chamado${globalMtbfMttr.totalTickets !== 1 ? "s" : ""}`
              : "Sem dados de chamados corretivos"}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <p className="text-sm font-medium text-gray-500">
              MTBF — Tempo Medio Entre Falhas
            </p>
          </div>
          <p className="mt-3 text-3xl font-bold text-gray-900">
            {formatHours(globalMtbfMttr.mtbf)}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {globalMtbfMttr.mtbf !== null
              ? "Media global do parque tecnologico"
              : "Necessario 2+ chamados por equipamento"}
          </p>
        </div>
      </div>

      {/* Patrimonio Total - Depreciacao */}
      <div className="mt-6">
        {showDepreciation && depreciationSummary ? (
          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Patrimonio Total
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Valor de Aquisicao
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {formatBRL(depreciationSummary.totalAcquisitionValue)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Valor Contabil Atual
                </p>
                <p className="mt-1 text-2xl font-bold text-blue-600">
                  {formatBRL(depreciationSummary.totalBookValue)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Depreciacao Acumulada
                </p>
                <p className="mt-1 text-2xl font-bold text-red-600">
                  {formatBRL(depreciationSummary.totalAccumulatedDepreciation)}
                  {depreciationSummary.totalAcquisitionValue > 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-400">
                      ({((depreciationSummary.totalAccumulatedDepreciation / depreciationSummary.totalAcquisitionValue) * 100).toFixed(1)}%)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Patrimonio Total
                </h3>
                <p className="mt-1 text-xs text-gray-400">
                  Controle de depreciacao
                </p>
              </div>
              <span className="text-2xl">&#128274;</span>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              Disponivel no plano Enterprise.
            </p>
          </div>
        )}
      </div>

      {/* PGTS Export */}
      <div className="mt-6">
        <PgtsExportButton
          latestPgtsId={latestPgts?.id ?? null}
          canExport={planAllows(plan, "pgts.create")}
        />
      </div>

      {/* Service type breakdown */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {serviceTypeStats.map((svc) => (
          <Link
            key={svc.serviceType}
            href={`/manutencoes?serviceType=${svc.serviceType}`}
          >
            <div className="rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <h3 className="text-sm font-semibold text-gray-900">
                {serviceTypeLabel(svc.serviceType)}
              </h3>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-green-600 font-medium">{svc.emDia}</span>
                  <span className="text-gray-500"> em dia</span>
                </div>
                <div>
                  <span className="text-yellow-600 font-medium">{svc.vencendo}</span>
                  <span className="text-gray-500"> vencendo</span>
                </div>
                <div>
                  <span className="text-red-600 font-medium">{svc.vencida}</span>
                  <span className="text-gray-500"> vencido{svc.vencida !== 1 ? "s" : ""}</span>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">{svc.realizada}</span>
                  <span className="text-gray-500"> realizada{svc.realizada !== 1 ? "s" : ""}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Proximos vencimentos */}
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Proximos Vencimentos
            </h2>
            <Link
              href="/manutencoes"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Ver todos
            </Link>
          </div>
          {upcomingPreventives.length === 0 ? (
            <div className="p-5 text-center text-sm text-gray-400">
              Nenhum vencimento nos proximos 60 dias.
            </div>
          ) : (
            <ul className="divide-y">
              {upcomingPreventives.map((p) => {
                const daysLeft = Math.ceil(
                  (p.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <li key={p.id} className="px-5 py-3">
                    <Link
                      href={`/manutencoes/${p.id}`}
                      className="flex items-center justify-between hover:bg-gray-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {p.equipment.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {p.type} — vence em{" "}
                          {p.dueDate.toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <Badge
                        variant={daysLeft <= 15 ? "danger" : daysLeft <= 30 ? "warning" : "info"}
                      >
                        {daysLeft} dia{daysLeft !== 1 && "s"}
                      </Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Chamados abertos */}
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Chamados Abertos
            </h2>
            <Link
              href="/chamados"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Ver todos
            </Link>
          </div>
          {recentTickets.length === 0 ? (
            <div className="p-5 text-center text-sm text-gray-400">
              Nenhum chamado aberto no momento.
            </div>
          ) : (
            <ul className="divide-y">
              {recentTickets.map((t) => (
                <li key={t.id} className="px-5 py-3">
                  <Link
                    href={`/chamados/${t.id}`}
                    className="flex items-center justify-between hover:bg-gray-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {t.equipment.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t.description.length > 60
                          ? t.description.slice(0, 60) + "..."
                          : t.description}
                      </p>
                      <p className="text-xs text-gray-400">
                        Por {t.openedBy.name} —{" "}
                        {t.openedAt.toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <Badge variant={urgencyVariant[t.urgency]}>
                      {urgencyLabels[t.urgency]}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Graficos avancados */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          Indicadores Visuais
        </h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <EquipmentByStatusChart data={chartEquipByStatus} />
          <EquipmentByCriticalityChart data={chartEquipByCrit} />
          <CalibrationStatusChart data={chartCalibStatus} />
          <div className="lg:col-span-2">
            <MaintenanceByMonthChart data={chartMaintByMonth} />
          </div>
          <TicketsByUrgencyChart data={chartTicketsByUrg} />
        </div>
      </div>
    </div>
  );
}
