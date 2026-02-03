import { prisma } from "@/lib/db";
import { getTenantId } from "@/lib/tenant";
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

export default async function DashboardPage() {
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
  ]);

  // overdueCount is already a number from count()

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
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">
        Visao geral do parque tecnologico
      </p>

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
