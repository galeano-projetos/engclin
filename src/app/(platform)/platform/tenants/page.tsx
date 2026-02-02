import { listTenants } from "../actions";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function TenantsListPage() {
  const tenants = await listTenants();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
        <Link
          href="/platform/tenants/novo"
          className="inline-flex items-center rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
        >
          Novo Tenant
        </Link>
      </div>

      {tenants.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center text-gray-500">
          Nenhum tenant cadastrado.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">CNPJ</th>
                <th className="px-4 py-3 font-medium">Plano</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Usuarios</th>
                <th className="px-4 py-3 font-medium text-right">Equipamentos</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/platform/tenants/${tenant.id}`}
                      className="font-medium text-teal-600 hover:text-teal-700"
                    >
                      {tenant.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{tenant.cnpj}</td>
                  <td className="px-4 py-3">
                    <Badge variant="info">{tenant.plan}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={tenant.active ? "success" : "danger"}>
                      {tenant.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{tenant._count.users}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{tenant._count.equipments}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
