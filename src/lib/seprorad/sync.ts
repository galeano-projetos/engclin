import { Client } from "pg";
import { prisma } from "@/lib/db";
import { MedicalPhysicsType } from "@prisma/client";

interface SyncResult {
  updated: number;
  created: number;
  skipped: number;
  errors: string[];
}

interface SeproradDocument {
  id: string;
  nome: string;
  tipo_equipamento: string | null;
  numero_serie: string | null;
  data_emissao: Date | null;
  data_validade: Date | null;
  status: string;
  arquivo_url: string;
}

/**
 * Maps a Seprorad document name to the corresponding MedicalPhysicsType.
 * Returns null if the document is not a physics test report.
 */
function mapDocumentType(nome: string): MedicalPhysicsType | null {
  const upper = nome.toUpperCase();

  if (upper.includes("RADIAÇÃO DE FUGA") || upper.includes("RADIACAO DE FUGA")) {
    return "TESTE_RADIACAO_FUGA";
  }
  if (upper.includes("LEVANTAMENTO RADIOMÉTRICO") || upper.includes("LEVANTAMENTO RADIOMETRICO")) {
    return "LEVANTAMENTO_RADIOMETRICO";
  }
  if (upper.includes("CONSTÂNCIA") || upper.includes("CONSTANCIA")) {
    return "TESTE_CONSTANCIA";
  }
  if (
    upper.includes("CONTROLE DE QUALIDADE") ||
    upper.includes("TESTES DE ACEITAÇÃO") ||
    upper.includes("TESTES DE ACEITACAO")
  ) {
    return "CONTROLE_QUALIDADE";
  }

  return null;
}

/**
 * Normalizes serial numbers for comparison by stripping leading zeros.
 */
function normalizeSerial(serial: string): string {
  return serial.replace(/^0+/, "");
}

/**
 * Computes periodicity in months based on test type.
 * LEVANTAMENTO_RADIOMETRICO / TESTE_RADIACAO_FUGA: 48 months (4 years)
 * Others: 12 months (1 year)
 */
function defaultPeriodicity(type: MedicalPhysicsType): number {
  if (type === "LEVANTAMENTO_RADIOMETRICO" || type === "TESTE_RADIACAO_FUGA") {
    return 48;
  }
  return 12;
}

// Documents are served via proxy route in the engclin app
// GET /api/seprorad-doc/{docId} fetches the PDF from Seprorad DB

export async function syncSeproradDocuments(
  tenantId: string,
  tenantCnpj: string
): Promise<SyncResult> {
  const seproradUrl = process.env.SEPRORAD_DATABASE_URL;
  if (!seproradUrl) {
    return { updated: 0, created: 0, skipped: 0, errors: ["SEPRORAD_DATABASE_URL not configured"] };
  }

  const result: SyncResult = { updated: 0, created: 0, skipped: 0, errors: [] };

  const client = new Client({ connectionString: seproradUrl });

  try {
    await client.connect();

    // 1. Find client in Seprorad by CNPJ (normalize: digits only)
    const cnpjDigits = tenantCnpj.replace(/\D/g, "");
    const clientResult = await client.query(
      "SELECT id FROM clientes WHERE REPLACE(REPLACE(REPLACE(documento, '.', ''), '/', ''), '-', '') = $1 LIMIT 1",
      [cnpjDigits]
    );

    if (clientResult.rows.length === 0) {
      return { ...result, errors: [`Cliente com CNPJ ${tenantCnpj} nao encontrado no portal Seprorad`] };
    }

    const seproradClientId = clientResult.rows[0].id;

    // 2. Fetch published documents with equipment info
    const docsResult = await client.query<SeproradDocument>(
      `SELECT id, nome, tipo_equipamento, numero_serie, data_emissao, data_validade, status, arquivo_url
       FROM documentos
       WHERE cliente_id = $1 AND status = 'publicado' AND numero_serie IS NOT NULL
       ORDER BY data_emissao DESC`,
      [seproradClientId]
    );

    if (docsResult.rows.length === 0) {
      return { ...result, skipped: 0, errors: [] };
    }

    // 3. Load all equipment for this tenant (build serial → id map)
    const equipments = await prisma.equipment.findMany({
      where: { tenantId },
      select: { id: true, serialNumber: true },
    });

    const serialToEquipmentId = new Map<string, string>();
    for (const eq of equipments) {
      if (eq.serialNumber) {
        serialToEquipmentId.set(normalizeSerial(eq.serialNumber), eq.id);
      }
    }

    // 4. Load existing physics tests to avoid duplicates (by seprorad doc ID in notes)
    const existingTests = await prisma.medicalPhysicsTest.findMany({
      where: { tenantId },
      select: { id: true, equipmentId: true, type: true, status: true, notes: true },
    });

    // Track which seprorad doc IDs are already synced
    const syncedDocIds = new Set<string>();
    for (const test of existingTests) {
      if (test.notes) {
        const match = test.notes.match(/seprorad:([a-z0-9]+)/);
        if (match) syncedDocIds.add(match[1]);
      }
    }

    // 5. Process each document
    for (const doc of docsResult.rows) {
      // Skip if already synced
      if (syncedDocIds.has(doc.id)) {
        result.skipped++;
        continue;
      }

      // Map document type
      const testType = mapDocumentType(doc.nome);
      if (!testType) {
        result.skipped++;
        continue;
      }

      // Find equipment by serial
      if (!doc.numero_serie) {
        result.skipped++;
        continue;
      }

      const equipmentId = serialToEquipmentId.get(normalizeSerial(doc.numero_serie));
      if (!equipmentId) {
        result.errors.push(`Equipamento com serie "${doc.numero_serie}" nao encontrado no engclin`);
        continue;
      }

      const reportUrl = `/api/seprorad-doc/${doc.id}`;
      const executionDate = doc.data_emissao || new Date();
      const dueDate = doc.data_validade || new Date();
      const syncNote = `seprorad:${doc.id}`;

      // Try to find an existing AGENDADA test for this equipment+type
      const pendingTest = existingTests.find(
        (t) => t.equipmentId === equipmentId && t.type === testType && t.status === "AGENDADA"
      );

      if (pendingTest) {
        // Update existing test
        await prisma.medicalPhysicsTest.update({
          where: { id: pendingTest.id },
          data: {
            status: "REALIZADA",
            executionDate,
            dueDate,
            reportUrl,
            notes: `Sincronizado do portal Seprorad. ${syncNote}`,
            provider: "Seprorad",
          },
        });
        // Remove from existingTests so it won't match again
        pendingTest.status = "REALIZADA";
        result.updated++;
      } else {
        // Create new test
        await prisma.medicalPhysicsTest.create({
          data: {
            tenantId,
            equipmentId,
            type: testType,
            scheduledDate: executionDate,
            dueDate,
            executionDate,
            status: "REALIZADA",
            provider: "Seprorad",
            reportUrl,
            periodicityMonths: defaultPeriodicity(testType),
            notes: `Sincronizado do portal Seprorad. ${syncNote}`,
          },
        });
        result.created++;
      }
    }
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
  } finally {
    await client.end();
  }

  return result;
}
