import { Periodicity } from "@prisma/client";

export const PERIODICITY_MONTHS: Record<Periodicity, number> = {
  TRIMESTRAL: 3,
  SEMESTRAL: 6,
  ANUAL: 12,
  BIENAL: 24,
  QUINQUENAL: 60,
  NAO_APLICAVEL: 0,
};

export function periodicityLabel(p: Periodicity): string {
  const labels: Record<Periodicity, string> = {
    TRIMESTRAL: "Trimestral (3 meses)",
    SEMESTRAL: "Semestral (6 meses)",
    ANUAL: "Anual (12 meses)",
    BIENAL: "Bienal (24 meses)",
    QUINQUENAL: "Quinquenal (60 meses)",
    NAO_APLICAVEL: "N/A",
  };
  return labels[p];
}

export function periodicityShortLabel(p: Periodicity): string {
  const labels: Record<Periodicity, string> = {
    TRIMESTRAL: "Trimestral",
    SEMESTRAL: "Semestral",
    ANUAL: "Anual",
    BIENAL: "Bienal",
    QUINQUENAL: "Quinquenal",
    NAO_APLICAVEL: "N/A",
  };
  return labels[p];
}

export function monthsToDate(baseDate: Date, months: number): Date {
  const d = new Date(baseDate);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function monthsFromPeriodicity(p: Periodicity): number {
  return PERIODICITY_MONTHS[p];
}

/** Map criticality enum to display labels */
export const criticalityDisplay: Record<string, { label: string; variant: "danger" | "warning" | "success" }> = {
  A: { label: "1 - Critico", variant: "danger" },
  B: { label: "2 - Moderado", variant: "warning" },
  C: { label: "3 - Baixo", variant: "success" },
};

export function criticalityLabel(c: string): string {
  return criticalityDisplay[c]?.label ?? c;
}

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  PREVENTIVA: "Preventiva",
  CALIBRACAO: "Calibracao",
  TSE: "Teste Seg. Eletrica",
};

export function serviceTypeLabel(st: string): string {
  return SERVICE_TYPE_LABELS[st] ?? st;
}
