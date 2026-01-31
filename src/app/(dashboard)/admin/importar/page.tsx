import { requirePermission } from "@/lib/auth/require-role";
import { ImportWizard } from "./import-wizard";

export default async function ImportarPage() {
  await requirePermission("import.execute");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Importar Dados</h1>
      <p className="mt-1 text-sm text-gray-500">
        Importe equipamentos e manutencoes a partir de planilha Excel (.xlsx).
      </p>
      <ImportWizard />
    </div>
  );
}
