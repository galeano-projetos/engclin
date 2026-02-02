import { getPlatformStats } from "./actions";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function PlatformDashboardPage() {
  const stats = await getPlatformStats();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard da Plataforma</h1>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Tenants" value={stats.totalTenants} />
        <StatCard label="Tenants Ativos" value={stats.activeTenants} />
        <StatCard label="Total Usuarios" value={stats.totalUsers} />
        <StatCard label="Total Equipamentos" value={stats.totalEquipments} />
      </div>

      {/* Recent tenants */}
      <div className="rounded-lg border bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Tenants Recentes</h2>
          <Link
            href="/platform/tenants"
            className="text-sm font-medium text-teal-600 hover:text-teal-700"
          >
            Ver todos
          </Link>
        </div>

        {stats.recentTenants.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum tenant cadastrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">Nome</th>
                  <th className="pb-2 font-medium">CNPJ</th>
                  <th className="pb-2 font-medium">Plano</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Usuarios</th>
                  <th className="pb-2 font-medium text-right">Equipamentos</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentTenants.map((tenant) => (
                  <tr key={tenant.id} className="border-b last:border-0">
                    <td className="py-2">
                      <Link
                        href={`/platform/tenants/${tenant.id}`}
                        className="font-medium text-teal-600 hover:text-teal-700"
                      >
                        {tenant.name}
                      </Link>
                    </td>
                    <td className="py-2 text-gray-600">{tenant.cnpj}</td>
                    <td className="py-2">
                      <Badge variant="info">{tenant.plan}</Badge>
                    </td>
                    <td className="py-2">
                      <Badge variant={tenant.active ? "success" : "danger"}>
                        {tenant.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td className="py-2 text-right text-gray-600">{tenant._count.users}</td>
                    <td className="py-2 text-right text-gray-600">{tenant._count.equipments}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-white p-6">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
