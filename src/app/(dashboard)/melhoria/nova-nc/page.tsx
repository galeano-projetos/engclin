import { requirePermission } from "@/lib/auth/require-role";
import { NewNonConformityForm } from "./new-nc-form";

export default async function NovaNaoConformidadePage() {
  await requirePermission("ticket.create");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Nova Nao Conformidade</h1>
      <p className="mt-1 text-sm text-gray-500">
        Registre uma nao conformidade para iniciar o processo de melhoria continua.
      </p>
      <div className="mt-6">
        <NewNonConformityForm />
      </div>
    </div>
  );
}
