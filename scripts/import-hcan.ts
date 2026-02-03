import "dotenv/config";
import * as XLSX from "xlsx";
import { PrismaClient, Criticality, ServiceType, Periodicity } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from "fs";
import * as path from "path";
// import { hash } from "bcryptjs"; // Not needed - we use existing tenant/user

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const FILE_PATH = path.resolve(
  "C:\\Users\\diego\\Downloads\\Gerenciamento Parque Tecnológico Hcan 2025.xlsx"
);

// ============================================================
// HELPERS
// ============================================================

function str(v: unknown): string {
  if (v == null) return "";
  if (v instanceof Date) return "";
  return String(v).trim();
}

function parseDate(v: unknown): Date | null {
  if (!v) return null;
  if (v === "") return null;
  if (v instanceof Date) {
    if (isNaN(v.getTime())) return null;
    return v;
  }
  // If it's a number (Excel serial date), convert
  if (typeof v === "number") {
    const d = new Date((v - 25569) * 86400 * 1000);
    if (!isNaN(d.getTime())) return d;
    return null;
  }
  const s = String(v).trim();
  if (!s || s === "-" || s === "N/A" || s.toUpperCase().includes("VERIFICAR") || s.toUpperCase().includes("SEM INFO")) return null;

  // Try M/D/YY or M/D/YYYY (US format from xlsx)
  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (mdy) {
    let year = +mdy[3];
    if (year < 100) year += year < 50 ? 2000 : 1900;
    const d = new Date(year, +mdy[1] - 1, +mdy[2]);
    if (!isNaN(d.getTime())) return d;
  }

  // Try YYYY
  const yyyy = s.match(/^(\d{4})$/);
  if (yyyy) {
    return new Date(+yyyy[1], 0, 1);
  }

  return null;
}

function mapCriticality(v: unknown): Criticality {
  const s = str(v);
  if (s === "1" || s.toUpperCase() === "A") return "A";
  if (s === "2" || s.toUpperCase() === "B") return "B";
  return "C";
}

function mapPeriodicity(v: unknown): Periodicity {
  const s = str(v).toUpperCase();
  if (s.includes("TRIMESTRAL") || s === "3 MESES") return "TRIMESTRAL";
  if (s.includes("SEMESTRAL") || s === "6 MESES") return "SEMESTRAL";
  if (s.includes("ANUAL") || s === "12 MESES" || s === "1 ANO") return "ANUAL";
  if (s.includes("BIENAL") || s === "24 MESES" || s === "2 ANOS") return "BIENAL";
  if (s.includes("QUINQUENAL") || s === "5 ANOS") return "QUINQUENAL";
  if (s.includes("N/A") || s.includes("NÃO") || s === "-" || s === "") return "NAO_APLICAVEL";
  return "ANUAL"; // default
}

function periodicityMonths(p: Periodicity): number {
  const map: Record<Periodicity, number> = {
    TRIMESTRAL: 3, SEMESTRAL: 6, ANUAL: 12, BIENAL: 24, QUINQUENAL: 60, NAO_APLICAVEL: 0
  };
  return map[p];
}

/** Find a sheet by name, tolerant of accent differences */
function findSheet(wb: XLSX.WorkBook, name: string): string | null {
  // Try exact match first
  if (wb.Sheets[name]) return name;
  // Normalize: remove accents and compare
  const normalize = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  const target = normalize(name);
  for (const sn of wb.SheetNames) {
    if (normalize(sn) === target) return sn;
  }
  return null;
}

/** Read a sheet as array of arrays - keep raw types so dates remain Date objects */
function sheetToRows(wb: XLSX.WorkBook, name: string): unknown[][] {
  const realName = findSheet(wb, name);
  if (!realName) {
    console.warn(`  [WARN] Aba "${name}" nao encontrada. Abas disponiveis: ${wb.SheetNames.join(", ")}`);
    return [];
  }
  if (realName !== name) {
    console.log(`  [INFO] Aba "${name}" mapeada para "${realName}"`);
  }
  const sheet = wb.Sheets[realName];
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
  });
}

// ============================================================
// MAIN IMPORT
// ============================================================

async function main() {
  const buffer = fs.readFileSync(FILE_PATH);
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });

  console.log("Sheets:", wb.SheetNames);

  // ---- Find existing Tenant by CNPJ or ID ----
  // Usage: npx tsx scripts/import-hcan.ts [CNPJ_OR_TENANT_ID]
  const targetArg = process.argv[2] || "24.672.792/0001-09"; // Default: HCAN real CNPJ
  let tenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { cnpj: targetArg },
        { id: targetArg },
      ],
    },
  });
  if (!tenant) {
    console.error(`Tenant nao encontrado com CNPJ/ID: ${targetArg}`);
    console.log("Tenants disponiveis:");
    const all = await prisma.tenant.findMany({ select: { id: true, name: true, cnpj: true } });
    all.forEach(t => console.log(`  ${t.id} | ${t.name} | ${t.cnpj}`));
    process.exit(1);
  }
  console.log("Tenant:", tenant.name, `(${tenant.id})`);

  // Find the first MASTER user in this tenant to associate units
  const admin = await prisma.user.findFirst({
    where: { tenantId: tenant.id, role: "MASTER" },
  });
  if (!admin) {
    console.error("Nenhum usuario MASTER encontrado no tenant.");
    process.exit(1);
  }
  console.log("Admin:", admin.name, admin.email);

  // Clean existing data (order matters for FK constraints)
  await prisma.contractEquipment.deleteMany({ where: { contract: { tenantId: tenant.id } } });
  await prisma.contract.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.correctiveMaintenance.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.medicalPhysicsTest.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.preventiveMaintenance.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.equipment.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.equipmentType.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.provider.deleteMany({ where: { tenantId: tenant.id } });
  // Delete units but keep user
  await prisma.userUnit.deleteMany({ where: { user: { tenantId: tenant.id } } });
  await prisma.unit.deleteMany({ where: { tenantId: tenant.id } });
  console.log("Dados antigos limpos.");

  // ============================================================
  // 1. Import "EQP E CRITICIDADE" -> EquipmentTypes + Providers
  // ============================================================
  const eqpRows = sheetToRows(wb, "EQP E CRITICIDADE");
  console.log(`\n=== EQP E CRITICIDADE: ${eqpRows.length} rows ===`);

  // Find the header row - the one where first cell is exactly "EQUIPAMENTO"
  let eqpHeaderIdx = 0;
  for (let i = 0; i < Math.min(10, eqpRows.length); i++) {
    const firstCell = str(eqpRows[i]?.[0]).toUpperCase();
    if (firstCell === "EQUIPAMENTO") {
      eqpHeaderIdx = i;
      break;
    }
  }
  console.log("Header row:", eqpHeaderIdx, eqpRows[eqpHeaderIdx]?.slice(0, 10));

  // Map providers (deduplicate)
  const providerMap = new Map<string, string>(); // name -> id

  async function getOrCreateProvider(name: string): Promise<string | null> {
    const clean = name.trim();
    if (!clean || clean === "-" || clean === "N/A") return null;

    // Split by / or , for multiple providers - take first one
    const firstName = clean.split(/[\/,]/)[0].trim();
    if (!firstName) return null;

    if (providerMap.has(firstName.toUpperCase())) {
      return providerMap.get(firstName.toUpperCase())!;
    }

    const p = await prisma.provider.create({
      data: { tenantId: tenant.id, name: firstName },
    });
    providerMap.set(firstName.toUpperCase(), p.id);
    return p.id;
  }

  // Map equipment types + their periodicities for maintenance creation
  const equipTypeMap = new Map<string, string>(); // name (uppercase) -> id
  const equipTypePeriodicities = new Map<string, { prev: Periodicity; cal: Periodicity; tse: Periodicity }>(); // id -> periodicities

  for (let i = eqpHeaderIdx + 1; i < eqpRows.length; i++) {
    const row = eqpRows[i];
    const equipName = str(row[0]);
    if (!equipName || equipName === "-") continue;
    // Skip footer/text rows (e.g. "ANEXO II", "Observacoes Tecnicas")
    if (equipName.toUpperCase().startsWith("ANEXO") || equipName.toUpperCase().startsWith("OBSERVA")) continue;

    const contrato = str(row[1]);
    const prevPeriod = mapPeriodicity(row[2]);
    const calPeriod = mapPeriodicity(row[3]);
    const tsePeriod = mapPeriodicity(row[4]);
    const empresas = str(row[5]);
    const crit = mapCriticality(row[6]);
    // row[7] is the formula text label (Critico/Moderado/Baixo), skip it
    const quant = parseInt(str(row[8])) || 0;
    const reserva = parseInt(str(row[9])) || 0;

    // Create provider from "EMPRESAS SERVIÇOS" column
    const providerId = await getOrCreateProvider(empresas);

    const et = await prisma.equipmentType.create({
      data: {
        tenantId: tenant.id,
        name: equipName,
        defaultCriticality: crit,
        preventivaPeriodicity: prevPeriod,
        calibracaoPeriodicity: calPeriod,
        tsePeriodicity: tsePeriod,
        reserveCount: reserva,
        defaultPreventivaProviderId: providerId,
        defaultCalibracaoProviderId: providerId,
        defaultTseProviderId: providerId,
      },
    });
    equipTypeMap.set(equipName.toUpperCase(), et.id);
    equipTypePeriodicities.set(et.id, { prev: prevPeriod, cal: calPeriod, tse: tsePeriod });
  }
  console.log(`Tipos de equipamento criados: ${equipTypeMap.size}`);
  console.log(`Fornecedores criados: ${providerMap.size}`);

  // ============================================================
  // 2. Import "PARQUE TECNOLÓGICO" -> Units, Equipment, Maintenances
  // ============================================================
  const ptRows = sheetToRows(wb, "PARQUE TECNOLÓGICO");
  console.log(`\n=== PARQUE TECNOLÓGICO: ${ptRows.length} rows ===`);

  // Find header row
  let ptHeaderIdx = 0;
  for (let i = 0; i < Math.min(5, ptRows.length); i++) {
    if (ptRows[i].some((c) => str(c).toUpperCase().includes("SETOR"))) {
      ptHeaderIdx = i;
      break;
    }
  }
  console.log("Header row:", ptHeaderIdx, ptRows[ptHeaderIdx]?.slice(0, 5));

  const unitMap = new Map<string, string>(); // name -> id

  async function getOrCreateUnit(name: string): Promise<string | null> {
    const clean = name.trim();
    if (!clean || clean === "-") return null;
    if (unitMap.has(clean.toUpperCase())) {
      return unitMap.get(clean.toUpperCase())!;
    }
    const u = await prisma.unit.create({
      data: { tenantId: tenant.id, name: clean },
    });
    unitMap.set(clean.toUpperCase(), u.id);
    return u.id;
  }

  let equipCount = 0;
  let maintCount = 0;
  let currentSetor = "";

  for (let i = ptHeaderIdx + 1; i < ptRows.length; i++) {
    const row = ptRows[i];

    // Column layout (0-based):
    // 0: SETOR, 1: EQUIPAMENTO, 2: CRITICIDADE, 3: PATRIMÔNIO,
    // 4: MARCA, 5: N/S, 6: MODELO, 7: AQUISIÇÃO,
    // 8: DATA DA MANUTENÇÃO/CALIBRAÇÃO E TSE, 9: PRÓXIMA MANUTENÇÃO/CALIBRAÇÃO E TSE,
    // 10: QUEM REALIZOU, 11: OBS. ADICIONAIS, 12: CONFERENCIA

    const setor = str(row[0]);
    const equipName = str(row[1]);
    const crit = str(row[2]);
    const patrimonio = str(row[3]);
    const marca = str(row[4]);
    const ns = str(row[5]);
    const modelo = str(row[6]);
    const aquisicao = row[7];
    const dataManut = row[8];  // DATA DA MANUTENÇÃO/CALIBRAÇÃO E TSE
    const proxManut = row[9];  // PRÓXIMA MANUTENÇÃO/CALIBRAÇÃO E TSE
    const quemRealizou = str(row[10]); // QUEM REALIZOU
    const obs = str(row[11]); // OBS. ADICIONAIS
    const conferencia = row[12]; // CONFERENCIA

    // Update current setor if provided
    if (setor) currentSetor = setor;

    // Skip rows without equipment name
    if (!equipName) continue;
    // Skip sub-header rows and footer text
    if (equipName.toUpperCase() === "EQUIPAMENTO") continue;
    if (equipName.toUpperCase().startsWith("TERMO DE")) continue;

    const unitId = await getOrCreateUnit(currentSetor || "SEM SETOR");
    if (!unitId) continue;

    // Match equipment type
    let equipmentTypeId: string | null = null;
    const nameUpper = equipName.toUpperCase();
    // Try exact match first, then partial
    if (equipTypeMap.has(nameUpper)) {
      equipmentTypeId = equipTypeMap.get(nameUpper)!;
    } else {
      for (const [key, id] of equipTypeMap) {
        if (nameUpper.includes(key) || key.includes(nameUpper)) {
          equipmentTypeId = id;
          break;
        }
      }
    }

    const equipment = await prisma.equipment.create({
      data: {
        tenantId: tenant.id,
        unitId,
        equipmentTypeId,
        name: equipName,
        brand: marca || null,
        model: modelo || null,
        serialNumber: ns || null,
        patrimony: patrimonio || null,
        criticality: crit ? mapCriticality(crit) : "C",
        status: "ATIVO",
        ownershipType: "PROPRIO",
        acquisitionDate: parseDate(aquisicao),
        lastConferenceDate: parseDate(conferencia),
        conferenceNotes: obs || null,
      },
    });
    equipCount++;

    // Create maintenance records for each applicable service type
    const execDate = parseDate(dataManut);
    const nextDate = parseDate(proxManut);
    const providerId = await getOrCreateProvider(quemRealizou);

    if (execDate || nextDate) {
      // Determine which service types apply based on equipment type periodicities
      const periods = equipmentTypeId ? equipTypePeriodicities.get(equipmentTypeId) : null;
      const serviceTypes: { svcType: ServiceType; label: string; months: number }[] = [];

      if (periods) {
        if (periods.prev !== "NAO_APLICAVEL") serviceTypes.push({ svcType: "PREVENTIVA", label: "Preventiva", months: periodicityMonths(periods.prev) });
        if (periods.cal !== "NAO_APLICAVEL") serviceTypes.push({ svcType: "CALIBRACAO", label: "Calibracao", months: periodicityMonths(periods.cal) });
        if (periods.tse !== "NAO_APLICAVEL") serviceTypes.push({ svcType: "TSE", label: "Teste de Seguranca Eletrica", months: periodicityMonths(periods.tse) });
      }

      // If no type matched or no applicable services, default to CALIBRACAO
      if (serviceTypes.length === 0) {
        serviceTypes.push({ svcType: "CALIBRACAO", label: "Calibracao", months: 12 });
      }

      for (const { svcType, label, months } of serviceTypes) {
        if (execDate) {
          await prisma.preventiveMaintenance.create({
            data: {
              tenantId: tenant.id,
              equipmentId: equipment.id,
              type: label,
              serviceType: svcType,
              scheduledDate: execDate,
              dueDate: nextDate || execDate,
              executionDate: execDate,
              status: "REALIZADA",
              providerId,
              provider: quemRealizou || null,
              periodicityMonths: months || 12,
              cost: null,
            },
          });
          maintCount++;
        }

        if (nextDate) {
          const now = new Date();
          const isOverdue = nextDate < now;
          await prisma.preventiveMaintenance.create({
            data: {
              tenantId: tenant.id,
              equipmentId: equipment.id,
              type: label,
              serviceType: svcType,
              scheduledDate: nextDate,
              dueDate: nextDate,
              status: isOverdue ? "VENCIDA" : "AGENDADA",
              providerId,
              provider: quemRealizou || null,
              periodicityMonths: months || 12,
            },
          });
          maintCount++;
        }
      }
    }
  }
  console.log(`Equipamentos (proprio): ${equipCount}`);
  console.log(`Manutencoes: ${maintCount}`);
  console.log(`Unidades: ${unitMap.size}`);

  // ============================================================
  // 3. Import "PARQUE TECN COMODATO" -> Equipment (COMODATO)
  // ============================================================
  const comodatoRows = sheetToRows(wb, "PARQUE TECN COMODATO");
  console.log(`\n=== PARQUE TECN COMODATO: ${comodatoRows.length} rows ===`);

  let comodatoHeaderIdx = 0;
  for (let i = 0; i < Math.min(5, comodatoRows.length); i++) {
    if (comodatoRows[i].some((c) => str(c).toUpperCase().includes("SETOR"))) {
      comodatoHeaderIdx = i;
      break;
    }
  }

  let comodatoCount = 0;
  let currentComodatoSetor = "";

  for (let i = comodatoHeaderIdx + 1; i < comodatoRows.length; i++) {
    const row = comodatoRows[i];
    // 0: SETOR, 1: EQUIPAMENTO, 2: MARCA, 3: N/S, 4: MODELO,
    // 5: DATA DA MANUTENÇÃO/CALIBRAÇÃO, 6: PRÓXIMA MANUTENÇÃO/CALIBRAÇÃO, 7: QUEM REALIZOU

    const setor = str(row[0]);
    const equipName = str(row[1]);
    const marca = str(row[2]);
    const ns = str(row[3]);
    const modelo = str(row[4]);
    const dataManut = row[5];
    const proxManut = row[6];
    const quemRealizou = str(row[7]);

    if (setor) currentComodatoSetor = setor;
    if (!equipName || equipName.toUpperCase() === "EQUIPAMENTO") continue;

    const unitId = await getOrCreateUnit(currentComodatoSetor || "SEM SETOR");
    if (!unitId) continue;

    let equipmentTypeId: string | null = null;
    const nameUpper = equipName.toUpperCase();
    if (equipTypeMap.has(nameUpper)) {
      equipmentTypeId = equipTypeMap.get(nameUpper)!;
    } else {
      for (const [key, id] of equipTypeMap) {
        if (nameUpper.includes(key) || key.includes(nameUpper)) {
          equipmentTypeId = id;
          break;
        }
      }
    }

    const equipment = await prisma.equipment.create({
      data: {
        tenantId: tenant.id,
        unitId: unitId,
        equipmentTypeId,
        name: equipName,
        brand: marca || null,
        model: modelo || null,
        serialNumber: ns || null,
        criticality: "B",
        status: "ATIVO",
        ownershipType: "COMODATO",
        loanProvider: marca || null,
      },
    });
    comodatoCount++;

    const execDate = parseDate(dataManut);
    const nextDate = parseDate(proxManut);
    const providerId = await getOrCreateProvider(quemRealizou);

    if (execDate) {
      await prisma.preventiveMaintenance.create({
        data: {
          tenantId: tenant.id,
          equipmentId: equipment.id,
          type: "Calibracao",
          serviceType: "CALIBRACAO",
          scheduledDate: execDate,
          dueDate: nextDate || execDate,
          executionDate: execDate,
          status: "REALIZADA",
          providerId,
          provider: quemRealizou || null,
          periodicityMonths: 12,
        },
      });
    }

    if (nextDate) {
      const now = new Date();
      await prisma.preventiveMaintenance.create({
        data: {
          tenantId: tenant.id,
          equipmentId: equipment.id,
          type: "Calibracao",
          serviceType: "CALIBRACAO",
          scheduledDate: nextDate,
          dueDate: nextDate,
          status: nextDate < now ? "VENCIDA" : "AGENDADA",
          providerId,
          provider: quemRealizou || null,
          periodicityMonths: 12,
        },
      });
    }
  }
  console.log(`Equipamentos comodato: ${comodatoCount}`);

  // ============================================================
  // 4. Import "BOMBAS BBRAUN" -> Equipment (COMODATO)
  // ============================================================
  const bombasRows = sheetToRows(wb, "BOMBAS BBRAUN");
  console.log(`\n=== BOMBAS BBRAUN: ${bombasRows.length} rows ===`);

  let bombasHeaderIdx = 0;
  for (let i = 0; i < Math.min(5, bombasRows.length); i++) {
    if (bombasRows[i].some((c) => str(c).toUpperCase().includes("SETOR"))) {
      bombasHeaderIdx = i;
      break;
    }
  }

  let bombasCount = 0;
  let currentBombasSetor = "";

  // Get or create BBraun provider
  const bbraunProviderId = await getOrCreateProvider("B. Braun");

  for (let i = bombasHeaderIdx + 1; i < bombasRows.length; i++) {
    const row = bombasRows[i];
    // 0: SETOR, 1: EQUIPAMENTO, 2: PATRIMÔNIO, 3: MARCA, 4: N/S, 5: MODELO,
    // 6: DATA DA CALIBRAÇÃO, 7: VALIDADE, 8: QUEM REALIZOU

    const setor = str(row[0]);
    const equipName = str(row[1]);
    const patrimonio = str(row[2]);
    const marca = str(row[3]);
    const ns = str(row[4]);
    const modelo = str(row[5]);
    const dataCal = row[6];
    const validade = row[7];
    const quemRealizou = str(row[8]);

    if (setor) currentBombasSetor = setor;
    if (!equipName || equipName.toUpperCase() === "EQUIPAMENTO") continue;

    const unitId = await getOrCreateUnit(currentBombasSetor || "SEM SETOR");
    if (!unitId) continue;

    let equipmentTypeId: string | null = null;
    const nameUpper = equipName.toUpperCase();
    for (const [key, id] of equipTypeMap) {
      if (nameUpper.includes(key) || key.includes(nameUpper)) {
        equipmentTypeId = id;
        break;
      }
    }

    const equipment = await prisma.equipment.create({
      data: {
        tenantId: tenant.id,
        unitId: unitId,
        equipmentTypeId,
        name: equipName,
        brand: marca || "B. Braun",
        model: modelo || null,
        serialNumber: ns || null,
        patrimony: patrimonio && patrimonio.toUpperCase() !== "COMODATO" ? patrimonio : null,
        criticality: "B",
        status: "ATIVO",
        ownershipType: "COMODATO",
        loanProvider: "B. Braun",
      },
    });
    bombasCount++;

    const execDate = parseDate(dataCal);
    const nextDate = parseDate(validade);
    const calProviderId = await getOrCreateProvider(quemRealizou) || bbraunProviderId;

    if (execDate) {
      await prisma.preventiveMaintenance.create({
        data: {
          tenantId: tenant.id,
          equipmentId: equipment.id,
          type: "Calibracao",
          serviceType: "CALIBRACAO",
          scheduledDate: execDate,
          dueDate: nextDate || execDate,
          executionDate: execDate,
          status: "REALIZADA",
          providerId: calProviderId,
          provider: quemRealizou || "B. Braun",
          periodicityMonths: 12,
        },
      });
    }

    if (nextDate) {
      const now = new Date();
      await prisma.preventiveMaintenance.create({
        data: {
          tenantId: tenant.id,
          equipmentId: equipment.id,
          type: "Calibracao",
          serviceType: "CALIBRACAO",
          scheduledDate: nextDate,
          dueDate: nextDate,
          status: nextDate < now ? "VENCIDA" : "AGENDADA",
          providerId: calProviderId,
          provider: quemRealizou || "B. Braun",
          periodicityMonths: 12,
        },
      });
    }
  }
  console.log(`Bombas BBraun: ${bombasCount}`);

  // ============================================================
  // 5. Import "CONTROLE RADIAÇÃO" -> Equipment + MedicalPhysicsTest
  // ============================================================
  const radRows = sheetToRows(wb, "CONTROLE RADIAÇÃO");
  console.log(`\n=== CONTROLE RADIAÇÃO: ${radRows.length} rows ===`);

  // Header at row 1: SETOR, EQUIPAMENTO, PATRIMÔNIO, MARCA, N/S, MODELO,
  //   TESTE DE ACEITAÇÃO(6), PROXIMA(7), RADIAÇÃO DE FUGA(8), PROXIMA(9),
  //   LEVANTAMENTO RADIOMÉTRICO(10?), PROXIMA(11?)
  let radHeaderIdx = 1;
  for (let i = 0; i < Math.min(5, radRows.length); i++) {
    if (str(radRows[i]?.[0]).toUpperCase() === "SETOR") {
      radHeaderIdx = i;
      break;
    }
  }
  console.log("Rad header:", radHeaderIdx);

  let radCount = 0;

  for (let i = radHeaderIdx + 1; i < radRows.length; i++) {
    const row = radRows[i];
    const setor = str(row[0]);
    const equipName = str(row[1]);
    if (!equipName || equipName.toUpperCase() === "EQUIPAMENTO") continue;

    const patrimonio = str(row[2]);
    const marca = str(row[3]);
    const ns = str(row[4]);
    const modelo = str(row[5]);
    // col 12: QUEM REALIZOU, col 13: OBS. ADICIONAIS
    const quemRealizouRad = str(row[12]);
    const obsRad = str(row[13]);

    const unitId = await getOrCreateUnit(setor || "RADIOLOGIA");
    if (!unitId) continue;

    // Match equipment type
    let radEquipTypeId: string | null = null;
    const radNameUpper = equipName.toUpperCase();
    if (equipTypeMap.has(radNameUpper)) {
      radEquipTypeId = equipTypeMap.get(radNameUpper)!;
    } else {
      for (const [key, id] of equipTypeMap) {
        if (radNameUpper.includes(key) || key.includes(radNameUpper)) {
          radEquipTypeId = id;
          break;
        }
      }
    }

    const radProviderId = await getOrCreateProvider(quemRealizouRad);

    const equipment = await prisma.equipment.create({
      data: {
        tenantId: tenant.id,
        unitId: unitId,
        equipmentTypeId: radEquipTypeId,
        name: equipName,
        brand: marca || null,
        model: modelo || null,
        serialNumber: ns || null,
        patrimony: patrimonio && !patrimonio.toUpperCase().includes("VERIFICAR") ? patrimonio : null,
        criticality: "A",
        status: "ATIVO",
        ownershipType: "PROPRIO",
        conferenceNotes: obsRad || null,
      },
    });
    radCount++;

    // Create medical physics tests:
    // col 6: TESTE DE ACEITACAO E CONTROLE DE QUALIDADE (exec), col 7: PROXIMA (due)
    // col 8: TESTE DE RADIACAO DE FUGA DO CABECOTE (exec), col 9: PROXIMA (due)
    // col 10: LEVANTAMENTO RADIOMETRICO (exec), col 11: PROXIMO (due)
    const testPairs: { execCol: number; dueCol: number; type: "CONTROLE_QUALIDADE" | "TESTE_RADIACAO_FUGA" | "LEVANTAMENTO_RADIOMETRICO" }[] = [
      { execCol: 6, dueCol: 7, type: "CONTROLE_QUALIDADE" },
      { execCol: 8, dueCol: 9, type: "TESTE_RADIACAO_FUGA" },
      { execCol: 10, dueCol: 11, type: "LEVANTAMENTO_RADIOMETRICO" },
    ];

    for (const { execCol, dueCol, type } of testPairs) {
      const execDate = parseDate(row[execCol]);
      const nextDate = parseDate(row[dueCol]);
      const cellVal = str(row[execCol]).toUpperCase();
      const isNA = cellVal === "N/A" || cellVal === "";

      if (isNA && !nextDate) continue;

      if (execDate) {
        const due = nextDate || new Date(execDate.getFullYear() + 1, execDate.getMonth(), execDate.getDate());
        const now = new Date();

        // Executed test
        await prisma.medicalPhysicsTest.create({
          data: {
            tenantId: tenant.id,
            equipmentId: equipment.id,
            type,
            scheduledDate: execDate,
            dueDate: due,
            executionDate: execDate,
            status: "REALIZADA",
            providerId: radProviderId,
            provider: quemRealizouRad || null,
            periodicityMonths: 12,
          },
        });

        // Next scheduled test
        if (nextDate) {
          await prisma.medicalPhysicsTest.create({
            data: {
              tenantId: tenant.id,
              equipmentId: equipment.id,
              type,
              scheduledDate: nextDate,
              dueDate: nextDate,
              status: nextDate < now ? "VENCIDA" : "AGENDADA",
              providerId: radProviderId,
              provider: quemRealizouRad || null,
              periodicityMonths: 12,
            },
          });
        }
      } else if (nextDate) {
        // Only a future date exists (no execution yet)
        const now = new Date();
        await prisma.medicalPhysicsTest.create({
          data: {
            tenantId: tenant.id,
            equipmentId: equipment.id,
            type,
            scheduledDate: nextDate,
            dueDate: nextDate,
            status: nextDate < now ? "VENCIDA" : "AGENDADA",
            providerId: radProviderId,
            provider: quemRealizouRad || null,
            periodicityMonths: 12,
          },
        });
      }
    }
  }
  console.log(`Equipamentos radiacao: ${radCount}`);

  // ============================================================
  // 6. Import "EQUIP DESATIVADO" -> Equipment (DESCARTADO)
  // ============================================================
  const desatRows = sheetToRows(wb, "EQUIP DESATIVADO");
  console.log(`\n=== EQUIP DESATIVADO: ${desatRows.length} rows ===`);

  let desatHeaderIdx = 0;
  for (let i = 0; i < Math.min(5, desatRows.length); i++) {
    if (desatRows[i].some((c) => str(c).toUpperCase().includes("SETOR"))) {
      desatHeaderIdx = i;
      break;
    }
  }

  let desatCount = 0;
  let currentDesatSetor = "";

  for (let i = desatHeaderIdx + 1; i < desatRows.length; i++) {
    const row = desatRows[i];
    // Same layout as PARQUE TECNOLÓGICO
    const setor = str(row[0]);
    const equipName = str(row[1]);
    const crit = str(row[2]);
    const patrimonio = str(row[3]);
    const marca = str(row[4]);
    const ns = str(row[5]);
    const modelo = str(row[6]);
    const aquisicaoDesat = row[7];
    const dataManutDesat = row[8];
    const proxManutDesat = row[9];
    const quemRealizouDesat = str(row[10]);
    const obsDesat = str(row[11]);

    if (setor) currentDesatSetor = setor;
    if (!equipName || equipName.toUpperCase() === "EQUIPAMENTO") continue;

    const unitId = await getOrCreateUnit(currentDesatSetor || "SEM SETOR");
    if (!unitId) continue;

    // Match equipment type
    let desatEquipTypeId: string | null = null;
    const desatNameUpper = equipName.toUpperCase();
    if (equipTypeMap.has(desatNameUpper)) {
      desatEquipTypeId = equipTypeMap.get(desatNameUpper)!;
    } else {
      for (const [key, id] of equipTypeMap) {
        if (desatNameUpper.includes(key) || key.includes(desatNameUpper)) {
          desatEquipTypeId = id;
          break;
        }
      }
    }

    // Build deactivation reason from OBS column
    const deactivationReason = obsDesat || "Equipamento desativado (importado da planilha HCAN)";

    const desatEquip = await prisma.equipment.create({
      data: {
        tenantId: tenant.id,
        unitId: unitId,
        equipmentTypeId: desatEquipTypeId,
        name: equipName,
        brand: marca || null,
        model: modelo || null,
        serialNumber: ns || null,
        patrimony: patrimonio || null,
        criticality: crit ? mapCriticality(crit) : "C",
        status: "DESCARTADO",
        ownershipType: "PROPRIO",
        acquisitionDate: parseDate(aquisicaoDesat),
        deactivationReason,
        conferenceNotes: obsDesat || null,
      },
    });
    desatCount++;

    // Create maintenance records for deactivated equipment too
    const execDateDesat = parseDate(dataManutDesat);
    const nextDateDesat = parseDate(proxManutDesat);
    const providerIdDesat = await getOrCreateProvider(quemRealizouDesat);

    if (execDateDesat) {
      await prisma.preventiveMaintenance.create({
        data: {
          tenantId: tenant.id,
          equipmentId: desatEquip.id,
          type: "Calibracao",
          serviceType: "CALIBRACAO",
          scheduledDate: execDateDesat,
          dueDate: nextDateDesat || execDateDesat,
          executionDate: execDateDesat,
          status: "REALIZADA",
          providerId: providerIdDesat,
          provider: quemRealizouDesat || null,
          periodicityMonths: 12,
        },
      });
      maintCount++;
    }
  }
  console.log(`Equipamentos desativados: ${desatCount}`);

  // ============================================================
  // 7. Associate admin to all units
  // ============================================================
  const allUnits = await prisma.unit.findMany({ where: { tenantId: tenant.id } });
  await prisma.userUnit.createMany({
    data: allUnits.map((u) => ({ userId: admin.id, unitId: u.id })),
    skipDuplicates: true,
  });

  // ============================================================
  // Summary
  // ============================================================
  const totals = {
    units: allUnits.length,
    providers: providerMap.size,
    equipmentTypes: equipTypeMap.size,
    equipments: await prisma.equipment.count({ where: { tenantId: tenant.id } }),
    maintenances: await prisma.preventiveMaintenance.count({ where: { tenantId: tenant.id } }),
    physicsTests: await prisma.medicalPhysicsTest.count({ where: { tenantId: tenant.id } }),
  };

  console.log("\n========================================");
  console.log("IMPORTACAO CONCLUIDA!");
  console.log("========================================");
  console.log(`Unidades:          ${totals.units}`);
  console.log(`Fornecedores:      ${totals.providers}`);
  console.log(`Tipos Equipamento: ${totals.equipmentTypes}`);
  console.log(`Equipamentos:      ${totals.equipments}`);
  console.log(`Manutencoes:       ${totals.maintenances}`);
  console.log(`Testes Fis.Med.:   ${totals.physicsTests}`);
  console.log("========================================");
  console.log("Login: admin@engclin.com / 123456");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
