import { requirePermission } from "@/lib/auth/require-role";
import { IntelligencePanel } from "./intelligence-panel";

export default async function InteligenciaPage() {
  await requirePermission("ai.view");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        Inteligência Artificial
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Agentes de análise que processam os dados do sistema e fornecem insights
        estratégicos para tomada de decisão.
      </p>

      <IntelligencePanel />
    </div>
  );
}
