"use server";

import { prisma } from "@/lib/db";
import { checkPermission } from "@/lib/auth/require-role";
import { parseExcel } from "@/lib/import/excel-parser";
import { mapRows, ImportPayload } from "@/lib/import/import-mapper";
import { revalidatePath } from "next/cache";

export async function parseExcelAction(base64: string): Promise<{
  error?: string;
  payload?: ImportPayload;
}> {
  await checkPermission("import.execute");

  try {
    const buffer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)).buffer;
    const rows = parseExcel(buffer);

    if (rows.length === 0) {
      return { error: "Planilha vazia ou formato nao reconhecido." };
    }

    const payload = mapRows(rows);
    return { payload };
  } catch {
    return { error: "Erro ao processar a planilha. Verifique o formato." };
  }
}

export async function executeImportAction(payload: ImportPayload): Promise<{
  error?: string;
  success?: boolean;
  counts?: { units: number; providers: number; equipments: number; maintenances: number; equipmentTypes: number };
}> {
  const { tenantId } = await checkPermission("import.execute");

  try {
    const counts = await prisma.$transaction(async (tx) => {
      // 1. Create/find units
      const unitMap = new Map<string, string>();
      for (const u of payload.units) {
        const existing = await tx.unit.findFirst({
          where: { tenantId, name: { equals: u.name, mode: "insensitive" } },
        });
        if (existing) {
          unitMap.set(u.name, existing.id);
        } else {
          const created = await tx.unit.create({
            data: { tenantId, name: u.name },
          });
          unitMap.set(u.name, created.id);
        }
      }

      // Ensure default unit
      if (!unitMap.has("Sem Setor")) {
        const existing = await tx.unit.findFirst({
          where: { tenantId, name: "Sem Setor" },
        });
        if (existing) {
          unitMap.set("Sem Setor", existing.id);
        } else {
          const created = await tx.unit.create({
            data: { tenantId, name: "Sem Setor" },
          });
          unitMap.set("Sem Setor", created.id);
        }
      }

      // 2. Create/find providers
      const providerMap = new Map<string, string>();
      for (const p of payload.providers) {
        const existing = await tx.provider.findFirst({
          where: { tenantId, name: { equals: p.name, mode: "insensitive" } },
        });
        if (existing) {
          providerMap.set(p.name, existing.id);
        } else {
          const created = await tx.provider.create({
            data: { tenantId, name: p.name },
          });
          providerMap.set(p.name, created.id);
        }
      }

      // 3. Create/find equipment types
      const equipmentTypeMap = new Map<string, string>();
      let eqTypeCount = 0;
      const typeNames = new Set(
        payload.equipments.map((eq) => eq.typeName).filter(Boolean) as string[]
      );
      for (const typeName of typeNames) {
        const existing = await tx.equipmentType.findFirst({
          where: { tenantId, name: { equals: typeName, mode: "insensitive" } },
        });
        if (existing) {
          equipmentTypeMap.set(typeName, existing.id);
        } else {
          const created = await tx.equipmentType.create({
            data: { tenantId, name: typeName },
          });
          equipmentTypeMap.set(typeName, created.id);
          eqTypeCount++;
        }
      }

      // 4. Create equipments
      const equipmentMap = new Map<string, string>();
      let eqCount = 0;
      for (const eq of payload.equipments) {
        const key = eq.patrimony || eq.name;
        const unitId = unitMap.get(eq.unitName) || unitMap.get("Sem Setor")!;
        const equipmentTypeId = eq.typeName ? equipmentTypeMap.get(eq.typeName) : undefined;

        // Check if equipment with same patrimony exists
        let existing = null;
        if (eq.patrimony) {
          existing = await tx.equipment.findFirst({
            where: { tenantId, patrimony: eq.patrimony },
          });
        }

        if (existing) {
          equipmentMap.set(key, existing.id);
        } else {
          const created = await tx.equipment.create({
            data: {
              tenantId,
              unitId,
              equipmentTypeId: equipmentTypeId || undefined,
              name: eq.name,
              criticality: eq.criticality,
              patrimony: eq.patrimony,
              brand: eq.brand,
              serialNumber: eq.serialNumber,
              model: eq.model,
              anvisaRegistry: eq.anvisaRegistry,
              ownershipType: eq.ownershipType || undefined,
              loanProvider: eq.loanProvider,
              acquisitionDate: eq.acquisitionDate,
              acquisitionValue: eq.acquisitionValue,
              contingencyPlan: eq.contingencyPlan,
              status: eq.status || "ATIVO",
            },
          });
          equipmentMap.set(key, created.id);
          eqCount++;
        }
      }

      // 5. Create maintenances
      let maintCount = 0;
      for (const m of payload.maintenances) {
        const equipmentId = equipmentMap.get(m.equipmentKey);
        if (!equipmentId) continue;

        const providerId = m.providerName ? providerMap.get(m.providerName) : undefined;
        const now = new Date();

        const scheduledDate = m.executionDate || m.dueDate || now;
        const dueDate = m.dueDate || m.executionDate || now;
        const isExecuted = !!m.executionDate;

        const typeMap: Record<string, string> = {
          PREVENTIVA: "Manutencao Preventiva Geral",
          CALIBRACAO: "Calibracao",
          TSE: "Teste de Seguranca Eletrica",
        };

        await tx.preventiveMaintenance.create({
          data: {
            tenantId,
            equipmentId,
            type: typeMap[m.serviceType],
            serviceType: m.serviceType,
            scheduledDate,
            dueDate,
            executionDate: m.executionDate || undefined,
            status: isExecuted ? "REALIZADA" : "AGENDADA",
            provider: m.providerName,
            providerId: providerId || undefined,
            periodicityMonths: 12,
          },
        });
        maintCount++;
      }

      return {
        units: payload.units.length,
        providers: payload.providers.length,
        equipments: eqCount,
        maintenances: maintCount,
        equipmentTypes: eqTypeCount,
      };
    }, { timeout: 60000 });

    revalidatePath("/equipamentos");
    revalidatePath("/manutencoes");
    revalidatePath("/admin");

    return { success: true, counts };
  } catch {
    return { error: "Erro na importacao. Nenhum dado foi salvo. Verifique a planilha e tente novamente." };
  }
}
