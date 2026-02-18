import { formatHours } from "@/lib/mtbf-mttr";

interface MtbfMttrProps {
  mtbf: number | null;
  mttr: number | null;
  ticketCount: number;
}

export function MtbfMttrSummary({ mtbf, mttr, ticketCount }: MtbfMttrProps) {
  if (ticketCount === 0) {
    return (
      <div className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          Indicadores de Confiabilidade
        </h2>
        <div className="rounded-lg border bg-white p-6 text-center text-sm text-gray-400 shadow-sm">
          Sem dados de chamados corretivos para calcular MTBF/MTTR.
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="mb-3 text-lg font-semibold text-gray-900">
        Indicadores de Confiabilidade
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            MTTR — Tempo Medio de Reparo
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {formatHours(mttr)}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Baseado em {ticketCount} chamado{ticketCount !== 1 ? "s" : ""} corretivo{ticketCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            MTBF — Tempo Medio Entre Falhas
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {formatHours(mtbf)}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {mtbf !== null
              ? `Baseado em ${ticketCount - 1} intervalo${ticketCount - 1 !== 1 ? "s" : ""}`
              : "Necessario 2+ chamados para calcular"}
          </p>
        </div>
      </div>
    </div>
  );
}
