import { requirePermission } from "@/lib/auth/require-role";
import { getIntegrationConfig } from "./actions";
import { IntegrationPanel } from "./integration-panel";

export default async function IntegracoesPage() {
  await requirePermission("integration.view");
  const config = await getIntegrationConfig();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Integracoes ERP</h1>
      <p className="mt-1 text-sm text-gray-500">
        Configure a integracao com o sistema Tasy para sincronizar equipamentos
        automaticamente.
      </p>
      <IntegrationPanel config={config} />
    </div>
  );
}
