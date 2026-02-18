"use server";

import { prisma } from "@/lib/db";
import { checkPermission } from "@/lib/auth/require-role";
import { revalidatePath } from "next/cache";
import { syncTasyEquipments } from "@/lib/integrations/tasy";
import type { TasySyncResult } from "@/lib/integrations/tasy";

// ============================================================
// Ler configuracao
// ============================================================

export async function getIntegrationConfig() {
  const { tenantId } = await checkPermission("integration.view");

  const config = await prisma.integrationConfig.findUnique({
    where: { tenantId_provider: { tenantId, provider: "TASY" } },
  });

  if (!config) return null;

  return {
    id: config.id,
    provider: config.provider,
    apiUrl: config.apiUrl,
    apiTokenMasked: config.apiToken
      ? "****" + config.apiToken.slice(-4)
      : "",
    hasToken: !!config.apiToken,
    enabled: config.enabled,
    lastSyncAt: config.lastSyncAt?.toISOString() ?? null,
    lastSyncResult: config.lastSyncResult as TasySyncResult | null,
  };
}

// ============================================================
// Salvar / atualizar configuracao
// ============================================================

export async function saveIntegrationConfig(formData: FormData) {
  const { tenantId } = await checkPermission("integration.manage");

  const apiUrl = (formData.get("apiUrl") as string)?.trim();
  const apiToken = (formData.get("apiToken") as string)?.trim();

  if (!apiUrl) {
    return { error: "URL da API e obrigatoria." };
  }

  try {
    new URL(apiUrl);
  } catch {
    return {
      error:
        "URL invalida. Informe uma URL completa (ex: https://tasy.hospital.com.br).",
    };
  }

  // Se ja existe config e token veio vazio, manter o token atual
  const existing = await prisma.integrationConfig.findUnique({
    where: { tenantId_provider: { tenantId, provider: "TASY" } },
  });

  if (existing && !apiToken) {
    // Atualizar somente a URL
    await prisma.integrationConfig.update({
      where: { id: existing.id },
      data: { apiUrl, enabled: true },
    });
  } else {
    if (!apiToken) {
      return { error: "Token de autenticacao e obrigatorio." };
    }

    await prisma.integrationConfig.upsert({
      where: { tenantId_provider: { tenantId, provider: "TASY" } },
      create: {
        tenantId,
        provider: "TASY",
        apiUrl,
        apiToken,
        enabled: true,
      },
      update: {
        apiUrl,
        apiToken,
        enabled: true,
      },
    });
  }

  revalidatePath("/admin/integracoes");
  return { success: true };
}

// ============================================================
// Ativar / desativar
// ============================================================

export async function toggleIntegration() {
  const { tenantId } = await checkPermission("integration.manage");

  const config = await prisma.integrationConfig.findUnique({
    where: { tenantId_provider: { tenantId, provider: "TASY" } },
  });

  if (!config) return { error: "Integracao nao configurada." };

  await prisma.integrationConfig.update({
    where: { id: config.id },
    data: { enabled: !config.enabled },
  });

  revalidatePath("/admin/integracoes");
  return { success: true };
}

// ============================================================
// Sincronizar equipamentos
// ============================================================

export async function syncEquipments(): Promise<{
  error?: string;
  result?: TasySyncResult;
}> {
  const { tenantId } = await checkPermission("integration.manage");

  const config = await prisma.integrationConfig.findUnique({
    where: { tenantId_provider: { tenantId, provider: "TASY" } },
  });

  if (!config) {
    return {
      error:
        "Integracao Tasy nao configurada. Configure as credenciais primeiro.",
    };
  }

  if (!config.enabled) {
    return {
      error: "Integracao esta desabilitada. Ative-a antes de sincronizar.",
    };
  }

  const syncResult = await syncTasyEquipments(
    tenantId,
    config.apiUrl,
    config.apiToken
  );

  // Persistir resultado da sync
  await prisma.integrationConfig.update({
    where: { id: config.id },
    data: {
      lastSyncAt: new Date(),
      lastSyncResult: syncResult as object,
    },
  });

  revalidatePath("/admin/integracoes");
  revalidatePath("/equipamentos");

  return { result: syncResult };
}
