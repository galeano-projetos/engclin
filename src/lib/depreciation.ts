/**
 * Depreciacao de ativos (ONA / NBR)
 *
 * Metodo LINEAR: depreciacao = (valorAquisicao - valorResidual) / vidaUtilAnos
 * Metodo ACELERADA: vida util efetiva = vidaUtilAnos / 2
 */

export interface DepreciationInput {
  acquisitionValue: number;
  acquisitionDate: Date;
  vidaUtilAnos: number;
  metodoDepreciacao: "LINEAR" | "ACELERADA";
  valorResidual: number;
}

export interface DepreciationResult {
  depreciationPerYear: number;
  accumulatedDepreciation: number;
  bookValue: number;
  percentDepreciated: number;
  fullyDepreciated: boolean;
  remainingYears: number;
}

export function computeDepreciation(input: DepreciationInput): DepreciationResult {
  const {
    acquisitionValue,
    acquisitionDate,
    vidaUtilAnos,
    metodoDepreciacao,
    valorResidual,
  } = input;

  const depreciableValue = acquisitionValue - valorResidual;
  if (depreciableValue <= 0 || vidaUtilAnos <= 0) {
    return {
      depreciationPerYear: 0,
      accumulatedDepreciation: 0,
      bookValue: acquisitionValue,
      percentDepreciated: 0,
      fullyDepreciated: false,
      remainingYears: vidaUtilAnos,
    };
  }

  const effectiveLifeYears =
    metodoDepreciacao === "ACELERADA" ? vidaUtilAnos / 2 : vidaUtilAnos;

  const depreciationPerYear = depreciableValue / effectiveLifeYears;

  const now = new Date();
  const elapsedMs = now.getTime() - acquisitionDate.getTime();
  const elapsedYears = elapsedMs / (365.25 * 24 * 60 * 60 * 1000);

  const rawAccumulated = depreciationPerYear * Math.max(0, elapsedYears);
  const accumulatedDepreciation = Math.min(rawAccumulated, depreciableValue);

  const bookValue = acquisitionValue - accumulatedDepreciation;
  const percentDepreciated = (accumulatedDepreciation / depreciableValue) * 100;
  const fullyDepreciated = accumulatedDepreciation >= depreciableValue;
  const remainingYears = fullyDepreciated
    ? 0
    : Math.max(0, effectiveLifeYears - elapsedYears);

  return {
    depreciationPerYear: round2(depreciationPerYear),
    accumulatedDepreciation: round2(accumulatedDepreciation),
    bookValue: round2(bookValue),
    percentDepreciated: Math.min(100, round2(percentDepreciated)),
    fullyDepreciated,
    remainingYears: round1(remainingYears),
  };
}

export interface EquipmentForDepreciation {
  id: string;
  name: string;
  patrimony: string | null;
  acquisitionValue: number | null;
  acquisitionDate: Date | null;
  vidaUtilAnos: number | null;
  metodoDepreciacao: "LINEAR" | "ACELERADA";
  valorResidual: number | null;
}

export interface DepreciationSummary {
  totalAcquisitionValue: number;
  totalBookValue: number;
  totalAccumulatedDepreciation: number;
}

export function computeDepreciationSummary(
  equipments: EquipmentForDepreciation[]
): DepreciationSummary {
  let totalAcquisitionValue = 0;
  let totalBookValue = 0;
  let totalAccumulatedDepreciation = 0;

  for (const eq of equipments) {
    if (!eq.acquisitionValue || !eq.acquisitionDate) continue;

    const result = computeDepreciation({
      acquisitionValue: eq.acquisitionValue,
      acquisitionDate: eq.acquisitionDate,
      vidaUtilAnos: eq.vidaUtilAnos ?? 10,
      metodoDepreciacao: eq.metodoDepreciacao,
      valorResidual: eq.valorResidual ?? 0,
    });

    totalAcquisitionValue += eq.acquisitionValue;
    totalBookValue += result.bookValue;
    totalAccumulatedDepreciation += result.accumulatedDepreciation;
  }

  return {
    totalAcquisitionValue: round2(totalAcquisitionValue),
    totalBookValue: round2(totalBookValue),
    totalAccumulatedDepreciation: round2(totalAccumulatedDepreciation),
  };
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
