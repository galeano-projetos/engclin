import { prisma } from "@/lib/db";

// ============================================================
// Tipos
// ============================================================

export interface TasySyncResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

/** Equipamento retornado pela API do Tasy */
interface TasyEquipment {
  id: string;
  nome: string;
  marca?: string;
  modelo?: string;
  numeroSerie?: string;
  patrimonio?: string;
  setor?: string;
  status?: string;
  tipoPropriedade?: string;
  fornecedorComodato?: string;
  dataAquisicao?: string;
  valorAquisicao?: number;
}

// ============================================================
// Client da API Tasy
// ============================================================

async function fetchTasyEquipments(
  apiUrl: string,
  apiToken: string
): Promise<TasyEquipment[]> {
  const url = `${apiUrl.replace(/\/+$/, "")}/api/equipamentos`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Tasy API retornou erro ${response.status}: ${response.statusText}`
    );
  }

  const data = await response.json();
  return Array.isArray(data) ? data : (data.data ?? data.items ?? []);
}

// ============================================================
// Mapeamento de campos
// ============================================================

function mapTasyStatus(
  tasyStatus?: string
): "ATIVO" | "INATIVO" {
  if (!tasyStatus) return "ATIVO";
  const upper = tasyStatus.toUpperCase();
  if (upper.includes("INATIVO") || upper.includes("DESATIVADO"))
    return "INATIVO";
  return "ATIVO";
}

function mapOwnershipType(
  tipo?: string
): "PROPRIO" | "COMODATO" {
  if (!tipo) return "PROPRIO";
  if (tipo.toUpperCase().includes("COMODATO")) return "COMODATO";
  return "PROPRIO";
}

// ============================================================
// Sync principal
// ============================================================

export async function syncTasyEquipments(
  tenantId: string,
  apiUrl: string,
  apiToken: string
): Promise<TasySyncResult> {
  const result: TasySyncResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  // 1. Buscar equipamentos da API Tasy
  let tasyEquipments: TasyEquipment[];
  try {
    tasyEquipments = await fetchTasyEquipments(apiUrl, apiToken);
  } catch (error) {
    return {
      ...result,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }

  if (tasyEquipments.length === 0) {
    return result;
  }

  // 2. Mapa de dedup: externalId → dbId para equipamentos ja importados
  const existingEquipments = await prisma.equipment.findMany({
    where: { tenantId, externalSource: "TASY" },
    select: { id: true, externalId: true },
  });
  const externalIdToDbId = new Map<string, string>();
  for (const eq of existingEquipments) {
    if (eq.externalId) {
      externalIdToDbId.set(eq.externalId, eq.id);
    }
  }

  // 3. Mapa de setores: nome (lowercase) → unitId
  const existingUnits = await prisma.unit.findMany({
    where: { tenantId },
    select: { id: true, name: true },
  });
  const unitNameToId = new Map<string, string>();
  for (const u of existingUnits) {
    unitNameToId.set(u.name.toLowerCase(), u.id);
  }

  // Setor fallback
  const fallbackName = "Sem Setor";
  if (!unitNameToId.has(fallbackName.toLowerCase())) {
    const created = await prisma.unit.create({
      data: { tenantId, name: fallbackName },
    });
    unitNameToId.set(fallbackName.toLowerCase(), created.id);
  }

  // 4. Processar cada equipamento
  for (const tasyEq of tasyEquipments) {
    try {
      if (!tasyEq.id || !tasyEq.nome) {
        result.skipped++;
        continue;
      }

      // Resolver setor
      let unitId: string | undefined;
      if (tasyEq.setor) {
        const sectorLower = tasyEq.setor.trim().toLowerCase();
        unitId = unitNameToId.get(sectorLower);
        if (!unitId) {
          const newUnit = await prisma.unit.create({
            data: { tenantId, name: tasyEq.setor.trim() },
          });
          unitId = newUnit.id;
          unitNameToId.set(sectorLower, newUnit.id);
        }
      }
      if (!unitId) {
        unitId = unitNameToId.get(fallbackName.toLowerCase())!;
      }

      // Payload do equipamento
      const equipmentData = {
        name: tasyEq.nome.trim(),
        brand: tasyEq.marca?.trim() || null,
        model: tasyEq.modelo?.trim() || null,
        serialNumber: tasyEq.numeroSerie?.trim() || null,
        patrimony: tasyEq.patrimonio?.trim() || null,
        status: mapTasyStatus(tasyEq.status),
        ownershipType: mapOwnershipType(tasyEq.tipoPropriedade),
        loanProvider: tasyEq.fornecedorComodato?.trim() || null,
        acquisitionDate: tasyEq.dataAquisicao
          ? new Date(tasyEq.dataAquisicao)
          : null,
        acquisitionValue: tasyEq.valorAquisicao ?? null,
        unitId,
      };

      const existingDbId = externalIdToDbId.get(tasyEq.id);

      if (existingDbId) {
        // UPDATE
        await prisma.equipment.update({
          where: { id: existingDbId },
          data: equipmentData,
        });
        result.updated++;
      } else {
        // CREATE
        await prisma.equipment.create({
          data: {
            tenantId,
            externalId: tasyEq.id,
            externalSource: "TASY",
            ...equipmentData,
          },
        });
        result.created++;
      }
    } catch (error) {
      result.errors.push(
        `Erro ao processar "${tasyEq.nome}" (ID: ${tasyEq.id}): ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  return result;
}
