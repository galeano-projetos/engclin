import { Criticality, ServiceType } from "@prisma/client";
import type { RawRow } from "./excel-parser";

export interface ImportUnit {
  name: string;
}

export interface ImportProvider {
  name: string;
}

export interface ImportEquipment {
  name: string;
  unitName: string;
  criticality: Criticality;
  patrimony?: string;
  brand?: string;
  serialNumber?: string;
  model?: string;
  acquisitionDate?: Date;
  typeName?: string;
}

export interface ImportMaintenance {
  equipmentKey: string; // patrimony or name for matching
  serviceType: ServiceType;
  executionDate?: Date;
  dueDate?: Date;
  providerName?: string;
}

export interface ImportPayload {
  units: ImportUnit[];
  providers: ImportProvider[];
  equipments: ImportEquipment[];
  maintenances: ImportMaintenance[];
}

function parseCriticality(val?: string): Criticality {
  if (!val) return "C";
  const v = val.trim();
  if (v === "1" || v.toUpperCase() === "A") return "A";
  if (v === "2" || v.toUpperCase() === "B") return "B";
  return "C";
}

function parseDate(val?: string): Date | undefined {
  if (!val) return undefined;
  const d = new Date(val);
  return isNaN(d.getTime()) ? undefined : d;
}

export function mapRows(rows: RawRow[]): ImportPayload {
  const unitsSet = new Set<string>();
  const providersSet = new Set<string>();
  const equipments: ImportEquipment[] = [];
  const maintenances: ImportMaintenance[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    // Unit
    const unitName = row.setor?.trim();
    if (unitName) unitsSet.add(unitName);

    // Provider
    const providerName = row.quemRealizou?.trim();
    if (providerName) providersSet.add(providerName);

    // Equipment dedup key
    const eqKey = row.patrimonio?.trim() || row.equipamento?.trim() || "";
    if (!eqKey) continue;

    if (!seen.has(eqKey)) {
      seen.add(eqKey);
      equipments.push({
        name: row.equipamento?.trim() || eqKey,
        unitName: unitName || "Sem Setor",
        criticality: parseCriticality(row.criticidade),
        patrimony: row.patrimonio?.trim() || undefined,
        brand: row.marca?.trim() || undefined,
        serialNumber: row.numeroSerie?.trim() || undefined,
        model: row.modelo?.trim() || undefined,
        acquisitionDate: parseDate(row.aquisicao),
        typeName: row.equipamento?.trim() || undefined,
      });
    }

    // Maintenances - preventiva (from dataManutencao/proximaManutencao)
    if (row.dataManutencao || row.proximaManutencao) {
      maintenances.push({
        equipmentKey: eqKey,
        serviceType: "PREVENTIVA",
        executionDate: parseDate(row.dataManutencao),
        dueDate: parseDate(row.proximaManutencao),
        providerName: providerName || undefined,
      });
    }

    // Calibracao (from dataCalibracao/proximaCalibracao)
    if (row.dataCalibracao || row.proximaCalibracao) {
      maintenances.push({
        equipmentKey: eqKey,
        serviceType: "CALIBRACAO",
        executionDate: parseDate(row.dataCalibracao),
        dueDate: parseDate(row.proximaCalibracao),
        providerName: providerName || undefined,
      });
    }
  }

  return {
    units: Array.from(unitsSet).map((name) => ({ name })),
    providers: Array.from(providersSet).map((name) => ({ name })),
    equipments,
    maintenances,
  };
}
