import type { DepreciationResult } from "@/lib/depreciation";
import { formatBRL } from "@/lib/depreciation";
import Link from "next/link";

interface DepreciationSectionProps {
  showDepreciation: boolean;
  depreciationData: DepreciationResult | null;
  acquisitionValue: number | null;
  metodoDepreciacao?: string;
  vidaUtilAnos?: number | null;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
        {value || "—"}
      </dd>
    </div>
  );
}

export function DepreciationSection({
  showDepreciation,
  depreciationData,
  acquisitionValue,
  metodoDepreciacao,
  vidaUtilAnos,
}: DepreciationSectionProps) {
  if (!showDepreciation) {
    return (
      <div className="mt-6 rounded-lg border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Informacoes Financeiras
          </h2>
        </div>
        <div className="p-6 text-center">
          <div className="text-4xl mb-2">&#128274;</div>
          <p className="text-sm text-gray-500">
            Controle de depreciacao disponivel no plano Enterprise.
          </p>
          <Link
            href="/dashboard?upgrade=true"
            className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-800"
          >
            Conhecer plano Enterprise
          </Link>
        </div>
      </div>
    );
  }

  if (!depreciationData || !acquisitionValue) {
    return (
      <div className="mt-6 rounded-lg border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Informacoes Financeiras
          </h2>
        </div>
        <div className="p-6 text-center text-sm text-gray-400">
          Preencha os dados de aquisicao para calcular a depreciacao.
        </div>
      </div>
    );
  }

  const metodoLabel =
    metodoDepreciacao === "ACELERADA"
      ? "Depreciacao Acelerada"
      : "Depreciacao Linear";

  return (
    <div className="mt-6 rounded-lg border bg-white shadow-sm">
      <div className="border-b px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Informacoes Financeiras
        </h2>
      </div>
      <dl className="divide-y px-6">
        <InfoRow
          label="Valor de Aquisicao"
          value={formatBRL(acquisitionValue)}
        />
        <InfoRow label="Metodo" value={metodoLabel} />
        <InfoRow
          label="Vida Util"
          value={vidaUtilAnos ? `${vidaUtilAnos} anos` : "—"}
        />
        <InfoRow
          label="Depreciacao Anual"
          value={formatBRL(depreciationData.depreciationPerYear)}
        />
        <InfoRow
          label="Depreciacao Acumulada"
          value={formatBRL(depreciationData.accumulatedDepreciation)}
        />
        <InfoRow
          label="Valor Contabil Atual"
          value={
            <span className="font-semibold text-blue-600">
              {formatBRL(depreciationData.bookValue)}
            </span>
          }
        />
        <InfoRow
          label="Percentual Depreciado"
          value={`${depreciationData.percentDepreciated.toFixed(1)}%`}
        />
        <InfoRow
          label="Vida Util Restante"
          value={
            depreciationData.fullyDepreciated
              ? "Totalmente depreciado"
              : `${depreciationData.remainingYears.toFixed(1)} anos`
          }
        />
      </dl>

      {/* Barra de progresso */}
      <div className="px-6 pb-6 pt-2">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>0%</span>
          <span>
            {depreciationData.percentDepreciated.toFixed(1)}% depreciado
          </span>
          <span>100%</span>
        </div>
        <div className="h-3 w-full rounded-full bg-gray-200">
          <div
            className={`h-3 rounded-full transition-all ${
              depreciationData.percentDepreciated >= 90
                ? "bg-red-500"
                : depreciationData.percentDepreciated >= 70
                  ? "bg-yellow-500"
                  : "bg-green-500"
            }`}
            style={{
              width: `${Math.min(100, depreciationData.percentDepreciated)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
