import { requirePermission } from "@/lib/auth/require-role";
import { getTenantId } from "@/lib/tenant";
import { getKpiTargets, saveKpiTarget } from "./actions";

const indicators = [
  { key: "preventive_compliance", label: "Cumprimento de Preventivas", unit: "%", description: "Percentual de preventivas executadas no prazo" },
  { key: "mttr_hours", label: "MTTR (Tempo Medio de Reparo)", unit: "horas", description: "Tempo medio para resolver chamados corretivos" },
  { key: "availability", label: "Disponibilidade", unit: "%", description: "Percentual de disponibilidade dos equipamentos" },
  { key: "overdue_max", label: "Maximo de Servicos Vencidos", unit: "numero", description: "Numero maximo aceitavel de servicos vencidos" },
];

async function handleSave(formData: FormData) {
  "use server";
  await saveKpiTarget(formData);
}

export default async function MetasPage() {
  await requirePermission("admin.units");
  const tenantId = await getTenantId();
  const year = new Date().getFullYear();
  const targets = await getKpiTargets(tenantId, year);

  const targetMap = new Map(targets.map((t) => [t.indicator, t]));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Metas de Indicadores</h1>
      <p className="mt-1 text-sm text-gray-500">
        Defina as metas anuais para os indicadores-chave de desempenho ({year}).
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {indicators.map((ind) => {
          const existing = targetMap.get(ind.key);
          return (
            <form key={ind.key} action={handleSave}>
              <input type="hidden" name="indicator" value={ind.key} />
              <input type="hidden" name="unit" value={ind.unit} />
              <input type="hidden" name="year" value={year} />

              <div className="rounded-lg border bg-white p-4 shadow-sm">
                <label className="block text-sm font-medium text-gray-900">
                  {ind.label}
                </label>
                <p className="mt-0.5 text-xs text-gray-500">{ind.description}</p>

                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="number"
                    name="targetValue"
                    step="any"
                    defaultValue={existing?.targetValue ?? ""}
                    placeholder="Valor da meta"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                    required
                  />
                  <span className="text-sm text-gray-500 whitespace-nowrap">{ind.unit}</span>
                </div>

                <button
                  type="submit"
                  className="mt-3 w-full rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                >
                  {existing ? "Atualizar Meta" : "Definir Meta"}
                </button>
              </div>
            </form>
          );
        })}
      </div>
    </div>
  );
}
