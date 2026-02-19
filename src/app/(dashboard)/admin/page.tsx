import { requirePermission } from "@/lib/auth/require-role";
import { getAdminData } from "./actions";
import { AdminPanel } from "./admin-panel";
import { planAllows } from "@/lib/auth/plan-features";
import Link from "next/link";

const allAdminLinks = [
  { href: "/admin/fornecedores", label: "Fornecedores", description: "Cadastro de empresas prestadoras de servicos", permission: "provider.view" },
  { href: "/admin/tipos-equipamento", label: "Tipos de Equipamento", description: "Periodicidades padrao por tipo", permission: "equipmentType.view" },
  { href: "/admin/checklists", label: "Checklists", description: "Templates de checklist para manutencao preventiva", permission: "checklist.view" },
  { href: "/admin/contratos", label: "Contratos", description: "Contratos com fornecedores", permission: "contract.view" },
  { href: "/admin/importar", label: "Importar Dados", description: "Importacao via planilha Excel", permission: "import.execute" },
  { href: "/admin/integracoes", label: "Integracoes ERP", description: "Conecte ao Tasy e sincronize equipamentos", permission: "integration.view" },
];

export default async function AdminPage() {
  const { plan } = await requirePermission("admin.users");
  const adminLinks = allAdminLinks.filter(link => planAllows(plan, link.permission));
  const { units, users, tenant } = await getAdminData();

  const serializedUnits = units.map((u) => ({
    id: u.id,
    name: u.name,
    equipmentCount: u._count.equipments,
  }));

  const serializedUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    specialty: u.specialty,
    active: u.active,
    createdAt: u.createdAt.toLocaleDateString("pt-BR"),
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Administracao</h1>
      <p className="mt-1 text-sm text-gray-500">
        Gerencie usuarios, unidades e configuracoes do tenant{" "}
        <span className="font-medium">{tenant?.name}</span>.
      </p>

      {/* Admin quick links */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {adminLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <div className="rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <p className="font-medium text-gray-900">{link.label}</p>
              <p className="mt-1 text-xs text-gray-500">{link.description}</p>
            </div>
          </Link>
        ))}
      </div>

      <AdminPanel units={serializedUnits} users={serializedUsers} />
    </div>
  );
}
