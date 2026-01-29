import { requirePermission } from "@/lib/auth/require-role";
import { getAdminData } from "./actions";
import { AdminPanel } from "./admin-panel";

export default async function AdminPage() {
  await requirePermission("admin.users");
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
    active: u.active,
    createdAt: u.createdAt.toLocaleDateString("pt-BR"),
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Administração</h1>
      <p className="mt-1 text-sm text-gray-500">
        Gerencie usuários, unidades e configurações do tenant{" "}
        <span className="font-medium">{tenant?.name}</span>.
      </p>

      <AdminPanel units={serializedUnits} users={serializedUsers} />
    </div>
  );
}
