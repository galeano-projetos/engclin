/**
 * Importa dados do Excel HCAN para o banco de producao.
 * Batches pequenos para evitar timeout na conexao Railway.
 */

import "dotenv/config";
import { PrismaClient, Criticality } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as XLSX from "xlsx";

function createPrisma() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

const TENANT_ID = "cml5dm8vb00001dqj18peomsc";
const FILE_PATH = "C:/Users/diego/Downloads/Gerenciamento Parque Tecnológico Hcan 2025.xlsx";

function normalizeSetor(raw: unknown): string | null {
  if (!raw || typeof raw !== "string") return null;
  let s = raw.trim().replace(/\s+/g, " ");
  if (s.length > 100) return null;
  const map: Record<string, string> = {
    "CENTRO CIRURGICO ": "CENTRO CIRURGICO",
    "UTI PEDIÁTRICA": "UTI PEDIATRICA",
    "CLINICA CIRURGICA": "CLÍNICA CIRÚRGICA",
    "CLINICA MEDICA": "CLÍNICA MÉDICA",
    "CLINICA MÉDICA": "CLÍNICA MÉDICA",
    "CLINICA PEDIATRICA": "CLÍNICA PEDIÁTRICA",
    "CLINICA CIRÚRGICA": "CLÍNICA CIRÚRGICA",
    "UTI ADULTO/PATRIMONIO": "UTI ADULTO",
    "UTI PEDIATRICA/P.A": "UTI PEDIATRICA",
    "UTI ADULTO/UTI PEDIÁTRICA": "UTI ADULTO",
    "PRONTO ATENDIMENTO/PATRIMONIO": "PRONTO ATENDIMENTO",
    "PATRIMÔNIO - BACKUP": "PATRIMÔNIO",
    "RADIOTERAPIA / EM MANUTENÇÃO": "RADIOTERAPIA",
    "CLÍNICA CIRÚRGICA/ MANUTENÇÃO EXTERNA": "CLÍNICA CIRÚRGICA",
    "FISIOTERAPIA / UTI ADULTO": "FISIOTERAPIA",
    "QUIMIOTERAPIA INFANTIL / UTI ADULTO": "QUIMIOTERAPIA INFANTIL",
    "CLÍNICA PEDIÁTRICA / CLÍNICA CIRÚRGICA": "CLÍNICA PEDIÁTRICA",
    "CENTRO CIRURGICO / CLÍNICA CIRÚRGICA": "CENTRO CIRURGICO",
    "MAMOGRAFIA / CENTRO CIRURGICO": "MAMOGRAFIA",
    "LAVANDERIA / ÁREA LIMPA": "LAVANDERIA",
    "LAVANDERIA / ÁREA SUJA": "LAVANDERIA",
  };
  if (map[s]) s = map[s];
  return s || null;
}

function mapCriticality(raw: unknown): Criticality {
  if (raw === 1 || raw === "1") return "A";
  if (raw === 2 || raw === "2") return "B";
  if (raw === 3 || raw === "3") return "C";
  return "C";
}

function parseExcelDate(raw: unknown): Date | null {
  if (!raw) return null;
  if (typeof raw === "number") {
    const date = XLSX.SSF.parse_date_code(raw);
    if (date) return new Date(date.y, date.m - 1, date.d);
  }
  return null;
}

function cleanString(raw: unknown): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  return s || null;
}

function cleanPatrimony(raw: unknown): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (["VERIFICAR", "VERIFICAR ", "COMODATO", "0", "-"].includes(s)) return null;
  return s.split("/")[0].trim() || null;
}

interface EquipRow {
  tenantId: string;
  unitId: string;
  equipmentTypeId: string | null;
  name: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  patrimony: string | null;
  criticality: Criticality;
  status: "ATIVO";
  ownershipType: "PROPRIO" | "COMODATO";
  loanProvider: string | null;
  acquisitionDate: Date | null;
}

async function insertBatch(rows: EquipRow[], label: string) {
  const BATCH = 20;
  for (let i = 0; i < rows.length; i += BATCH) {
    const prisma = createPrisma();
    try {
      const batch = rows.slice(i, i + BATCH);
      await prisma.equipment.createMany({ data: batch });
      console.log(`  ${label}: ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
    } finally {
      await prisma.$disconnect();
    }
  }
}

async function main() {
  const wb = XLSX.readFile(FILE_PATH);

  // Verify tenant
  let prisma = createPrisma();
  const tenant = await prisma.tenant.findUnique({ where: { id: TENANT_ID } });
  if (!tenant) throw new Error("Tenant nao encontrado");
  console.log(`Tenant: ${tenant.name}`);
  await prisma.$disconnect();

  // ============================================================
  // 1. Collect setores
  // ============================================================
  const allSetores = new Set<string>();
  function collectSetores(sheetName: string, col: number, start: number) {
    const ws = wb.Sheets[sheetName];
    if (!ws) return;
    const data: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
    for (let i = start; i < data.length; i++) {
      const s = normalizeSetor(data[i]?.[col]);
      if (s) allSetores.add(s);
    }
  }
  collectSetores("PARQUE TECNOLÓGICO", 0, 2);
  collectSetores("PARQUE TECN COMODATO", 0, 2);
  collectSetores("CONTROLE RADIAÇÃO", 0, 2);
  collectSetores("BOMBAS BBRAUN", 0, 2);
  console.log(`Setores: ${allSetores.size}`);

  // Create units in small batches
  prisma = createPrisma();
  const existingUnits = await prisma.unit.findMany({ where: { tenantId: TENANT_ID } });
  const existingUnitNames = new Set(existingUnits.map((u) => u.name));
  const newUnitNames = [...allSetores].filter((s) => !existingUnitNames.has(s));
  await prisma.$disconnect();

  for (let i = 0; i < newUnitNames.length; i += 10) {
    prisma = createPrisma();
    await prisma.unit.createMany({
      data: newUnitNames.slice(i, i + 10).map((name) => ({ tenantId: TENANT_ID, name })),
      skipDuplicates: true,
    });
    await prisma.$disconnect();
  }

  prisma = createPrisma();
  const allUnits = await prisma.unit.findMany({ where: { tenantId: TENANT_ID } });
  const unitMap = new Map(allUnits.map((u) => [u.name, u.id]));
  console.log(`Unidades criadas: ${unitMap.size}`);
  await prisma.$disconnect();

  // ============================================================
  // 2. Equipment types from EQP E CRITICIDADE
  // ============================================================
  const wsTypes = wb.Sheets["EQP E CRITICIDADE"];
  const typesData: unknown[][] = XLSX.utils.sheet_to_json(wsTypes, { header: 1 });

  const typeEntries: { name: string; criticality: Criticality; reserveCount: number }[] = [];
  for (let i = 3; i < typesData.length; i++) {
    const row = typesData[i];
    if (!row?.[0]) continue;
    const name = cleanString(row[0]);
    if (!name) continue;
    typeEntries.push({
      name,
      criticality: mapCriticality(row[6]),
      reserveCount: typeof row[9] === "number" ? row[9] : 0,
    });
  }

  prisma = createPrisma();
  const existingTypes = await prisma.equipmentType.findMany({ where: { tenantId: TENANT_ID } });
  const existingTypeNames = new Set(existingTypes.map((t) => t.name));
  await prisma.$disconnect();

  const newTypes = typeEntries.filter((t) => !existingTypeNames.has(t.name));
  for (let i = 0; i < newTypes.length; i += 10) {
    prisma = createPrisma();
    await prisma.equipmentType.createMany({
      data: newTypes.slice(i, i + 10).map((t) => ({
        tenantId: TENANT_ID,
        name: t.name,
        defaultCriticality: t.criticality,
        reserveCount: t.reserveCount,
      })),
      skipDuplicates: true,
    });
    await prisma.$disconnect();
    console.log(`  Tipos: ${Math.min(i + 10, newTypes.length)}/${newTypes.length}`);
  }

  prisma = createPrisma();
  const allTypes = await prisma.equipmentType.findMany({ where: { tenantId: TENANT_ID } });
  await prisma.$disconnect();

  const typeMapUpper = new Map(allTypes.map((t) => [t.name.toUpperCase(), t.id]));
  console.log(`Tipos de equipamento: ${allTypes.length}`);

  function findTypeId(equipName: string): string | null {
    const upper = equipName.toUpperCase();
    if (typeMapUpper.has(upper)) return typeMapUpper.get(upper)!;
    for (const [k, v] of typeMapUpper) {
      if (upper.includes(k) || k.includes(upper)) return v;
    }
    return null;
  }

  // ============================================================
  // 3. PARQUE TECNOLOGICO
  // ============================================================
  const mainData: unknown[][] = XLSX.utils.sheet_to_json(wb.Sheets["PARQUE TECNOLÓGICO"], { header: 1 });
  const ownEquips: EquipRow[] = [];
  for (let i = 2; i < mainData.length; i++) {
    const row = mainData[i];
    if (!row?.[1]) continue;
    const setor = normalizeSetor(row[0]);
    if (!setor) continue;
    const unitId = unitMap.get(setor);
    if (!unitId) continue;
    const name = cleanString(row[1]);
    if (!name) continue;

    ownEquips.push({
      tenantId: TENANT_ID, unitId, equipmentTypeId: findTypeId(name),
      name, brand: cleanString(row[4]), model: cleanString(row[6]),
      serialNumber: cleanString(row[5]), patrimony: cleanPatrimony(row[3]),
      criticality: mapCriticality(row[2]), status: "ATIVO",
      ownershipType: "PROPRIO", loanProvider: null,
      acquisitionDate: parseExcelDate(row[7]),
    });
  }
  await insertBatch(ownEquips, "Proprios");
  console.log(`Equipamentos proprios: ${ownEquips.length}`);

  // ============================================================
  // 4. PARQUE TECN COMODATO
  // ============================================================
  const comodatoData: unknown[][] = XLSX.utils.sheet_to_json(wb.Sheets["PARQUE TECN COMODATO"], { header: 1 });
  const comodatoEquips: EquipRow[] = [];
  for (let i = 2; i < comodatoData.length; i++) {
    const row = comodatoData[i];
    if (!row?.[1]) continue;
    const setor = normalizeSetor(row[0]);
    if (!setor) continue;
    const unitId = unitMap.get(setor);
    if (!unitId) continue;
    const name = cleanString(row[1]);
    if (!name) continue;

    comodatoEquips.push({
      tenantId: TENANT_ID, unitId, equipmentTypeId: findTypeId(name),
      name, brand: cleanString(row[2]), model: cleanString(row[4]),
      serialNumber: cleanString(row[3]), patrimony: null,
      criticality: "B", status: "ATIVO",
      ownershipType: "COMODATO", loanProvider: cleanString(row[2]),
      acquisitionDate: null,
    });
  }
  await insertBatch(comodatoEquips, "Comodato");
  console.log(`Equipamentos comodato: ${comodatoEquips.length}`);

  // ============================================================
  // 5. CONTROLE RADIACAO (skip duplicates by serial)
  // ============================================================
  const allSerials = new Set([
    ...ownEquips.filter((e) => e.serialNumber).map((e) => e.serialNumber),
    ...comodatoEquips.filter((e) => e.serialNumber).map((e) => e.serialNumber),
  ]);

  const radData: unknown[][] = XLSX.utils.sheet_to_json(wb.Sheets["CONTROLE RADIAÇÃO"], { header: 1 });
  const radEquips: EquipRow[] = [];
  for (let i = 2; i < radData.length; i++) {
    const row = radData[i];
    if (!row?.[1]) continue;
    const setor = normalizeSetor(row[0]);
    if (!setor) continue;
    const unitId = unitMap.get(setor);
    if (!unitId) continue;
    const name = cleanString(row[1]);
    if (!name) continue;
    const sn = cleanString(row[4]);
    if (sn && allSerials.has(sn)) continue;
    if (sn) allSerials.add(sn);

    radEquips.push({
      tenantId: TENANT_ID, unitId, equipmentTypeId: findTypeId(name),
      name, brand: cleanString(row[3]), model: cleanString(row[5]),
      serialNumber: sn, patrimony: cleanPatrimony(row[2]),
      criticality: "A", status: "ATIVO",
      ownershipType: "PROPRIO", loanProvider: null,
      acquisitionDate: null,
    });
  }
  await insertBatch(radEquips, "Radiacao");
  console.log(`Equipamentos radiacao: ${radEquips.length}`);

  // ============================================================
  // 6. BOMBAS BBRAUN (skip duplicates by serial)
  // ============================================================
  const bbData: unknown[][] = XLSX.utils.sheet_to_json(wb.Sheets["BOMBAS BBRAUN"], { header: 1 });
  const bbEquips: EquipRow[] = [];
  for (let i = 2; i < bbData.length; i++) {
    const row = bbData[i];
    if (!row?.[1]) continue;
    const setor = normalizeSetor(row[0]);
    if (!setor) continue;
    const unitId = unitMap.get(setor);
    if (!unitId) continue;
    const name = cleanString(row[1]);
    if (!name) continue;
    const sn = cleanString(row[4]);
    if (sn && allSerials.has(sn)) continue;
    if (sn) allSerials.add(sn);

    bbEquips.push({
      tenantId: TENANT_ID, unitId, equipmentTypeId: findTypeId(name),
      name, brand: cleanString(row[3]), model: cleanString(row[5]),
      serialNumber: sn, patrimony: cleanPatrimony(row[2]),
      criticality: "A", status: "ATIVO",
      ownershipType: "COMODATO", loanProvider: "BBRAUN",
      acquisitionDate: null,
    });
  }
  await insertBatch(bbEquips, "BBraun");
  console.log(`Bombas BBraun: ${bbEquips.length}`);

  // ============================================================
  // Summary
  // ============================================================
  prisma = createPrisma();
  const total = await prisma.equipment.count({ where: { tenantId: TENANT_ID } });
  const totalU = await prisma.unit.count({ where: { tenantId: TENANT_ID } });
  const totalT = await prisma.equipmentType.count({ where: { tenantId: TENANT_ID } });
  await prisma.$disconnect();

  console.log(`\n=== RESUMO ===`);
  console.log(`Unidades: ${totalU}`);
  console.log(`Tipos de equipamento: ${totalT}`);
  console.log(`Equipamentos total: ${total}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
