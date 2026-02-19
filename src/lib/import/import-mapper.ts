import { Criticality, EquipmentStatus, OwnershipType, ServiceType } from "@prisma/client";
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
  acquisitionValue?: number;
  typeName?: string;
  anvisaRegistry?: string;
  ownershipType?: OwnershipType;
  loanProvider?: string;
  contingencyPlan?: string;
  status?: EquipmentStatus;
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
  const v = val.trim().toUpperCase();
  if (v === "1" || v === "A" || v === "ALTA" || v === "CRITICA") return "A";
  if (v === "2" || v === "B" || v === "MEDIA") return "B";
  return "C";
}

function parseOwnershipType(val?: string): OwnershipType | undefined {
  if (!val) return undefined;
  const v = val.trim().toUpperCase();
  if (v === "COMODATO") return "COMODATO";
  if (v === "PROPRIO" || v === "PRÓPRIO") return "PROPRIO";
  return undefined;
}

function parseStatus(val?: string): EquipmentStatus | undefined {
  if (!val) return undefined;
  const v = val.trim().toUpperCase().replace(/\s+/g, "_");
  if (v === "ATIVO") return "ATIVO";
  if (v === "INATIVO") return "INATIVO";
  if (v === "EM_MANUTENCAO" || v === "EM MANUTENCAO" || v === "EM MANUTENÇÃO") return "EM_MANUTENCAO";
  if (v === "DESCARTADO") return "DESCARTADO";
  return undefined;
}

function parseDecimal(val?: string): number | undefined {
  if (!val) return undefined;
  // Remove currency symbols, dots as thousands separator, replace comma with dot
  const cleaned = val.replace(/[R$\s]/g, "").replace(/\./g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
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
        acquisitionValue: parseDecimal(row.valorAquisicao),
        typeName: row.tipoEquipamento?.trim() || undefined,
        anvisaRegistry: row.registroAnvisa?.trim() || undefined,
        ownershipType: parseOwnershipType(row.tipoPropriedade),
        loanProvider: row.fornecedorComodato?.trim() || undefined,
        contingencyPlan: row.planoContingencia?.trim() || undefined,
        status: parseStatus(row.status),
      });
    }

    // Maintenances - preventiva
    if (row.dataManutencao || row.proximaManutencao) {
      maintenances.push({
        equipmentKey: eqKey,
        serviceType: "PREVENTIVA",
        executionDate: parseDate(row.dataManutencao),
        dueDate: parseDate(row.proximaManutencao),
        providerName: providerName || undefined,
      });
    }

    // Calibracao
    if (row.dataCalibracao || row.proximaCalibracao) {
      maintenances.push({
        equipmentKey: eqKey,
        serviceType: "CALIBRACAO",
        executionDate: parseDate(row.dataCalibracao),
        dueDate: parseDate(row.proximaCalibracao),
        providerName: providerName || undefined,
      });
    }

    // TSE
    if (row.dataTse || row.proximaTse) {
      maintenances.push({
        equipmentKey: eqKey,
        serviceType: "TSE",
        executionDate: parseDate(row.dataTse),
        dueDate: parseDate(row.proximaTse),
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
