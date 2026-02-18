"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  saveIntegrationConfig,
  toggleIntegration,
  syncEquipments,
} from "./actions";

interface SyncResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

interface ConfigData {
  id: string;
  provider: string;
  apiUrl: string;
  apiTokenMasked: string;
  hasToken: boolean;
  enabled: boolean;
  lastSyncAt: string | null;
  lastSyncResult: SyncResult | null;
}

export function IntegrationPanel({
  config,
}: {
  config: ConfigData | null;
}) {
  const [showForm, setShowForm] = useState(!config);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState("");
  const [syncResult, setSyncResult] = useState<SyncResult | null>(
    config?.lastSyncResult ?? null
  );
  const [syncError, setSyncError] = useState("");

  async function handleSave(formData: FormData) {
    setSaving(true);
    setError("");
    const result = await saveIntegrationConfig(formData);
    if (result.error) {
      setError(result.error);
    } else {
      setShowForm(false);
    }
    setSaving(false);
  }

  async function handleToggle() {
    setToggling(true);
    await toggleIntegration();
    setToggling(false);
  }

  async function handleSync() {
    setSyncing(true);
    setSyncError("");
    setSyncResult(null);
    const response = await syncEquipments();
    if (response.error) {
      setSyncError(response.error);
    } else if (response.result) {
      setSyncResult(response.result);
    }
    setSyncing(false);
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Secao 1: Configuracao */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Tasy</h2>
              <p className="text-sm text-gray-500">
                Sistema de gestao hospitalar Philips Tasy
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {config && (
              <>
                <Badge variant={config.enabled ? "success" : "muted"}>
                  {config.enabled ? "Ativa" : "Desativada"}
                </Badge>
                <Button
                  variant="ghost"
                  onClick={handleToggle}
                  loading={toggling}
                >
                  {config.enabled ? "Desativar" : "Ativar"}
                </Button>
              </>
            )}
            <Button
              variant="secondary"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm
                ? "Cancelar"
                : config
                  ? "Editar Credenciais"
                  : "Configurar"}
            </Button>
          </div>
        </div>

        {/* Resumo da config atual */}
        {config && !showForm && (
          <div className="mt-4 rounded-md bg-gray-50 p-4 text-sm text-gray-600">
            <div className="grid gap-2 sm:grid-cols-3">
              <div>
                <span className="font-medium text-gray-900">URL:</span>{" "}
                <span className="break-all">{config.apiUrl}</span>
              </div>
              <div>
                <span className="font-medium text-gray-900">Token:</span>{" "}
                {config.apiTokenMasked}
              </div>
              <div>
                <span className="font-medium text-gray-900">
                  Ultima sync:
                </span>{" "}
                {config.lastSyncAt
                  ? new Date(config.lastSyncAt).toLocaleString("pt-BR")
                  : "Nunca"}
              </div>
            </div>
          </div>
        )}

        {/* Formulario */}
        {showForm && (
          <form action={handleSave} className="mt-4 space-y-4">
            <Input
              id="apiUrl"
              name="apiUrl"
              label="URL da API Tasy"
              placeholder="https://tasy.hospital.com.br"
              defaultValue={config?.apiUrl ?? ""}
              required
            />
            <Input
              id="apiToken"
              name="apiToken"
              label="Token de Autenticacao"
              type="password"
              placeholder={
                config?.hasToken
                  ? "Deixe em branco para manter o atual"
                  : "Bearer token da API"
              }
              required={!config?.hasToken}
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <div className="flex gap-2">
              <Button type="submit" loading={saving}>
                Salvar Configuracao
              </Button>
              {config && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Secao 2: Sincronizacao */}
      {config && config.enabled && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Sincronizar Equipamentos
              </h2>
              <p className="text-sm text-gray-500">
                Importa equipamentos do Tasy. Equipamentos ja importados serao
                atualizados automaticamente.
              </p>
            </div>
            <Button onClick={handleSync} loading={syncing}>
              {syncing
                ? "Sincronizando..."
                : "Sincronizar Equipamentos do Tasy"}
            </Button>
          </div>

          {syncError && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {syncError}
            </div>
          )}

          {syncResult && (
            <div className="mt-4">
              <div className="grid gap-3 sm:grid-cols-4">
                <ResultCard
                  value={syncResult.created}
                  label="Criados"
                  color="green"
                />
                <ResultCard
                  value={syncResult.updated}
                  label="Atualizados"
                  color="blue"
                />
                <ResultCard
                  value={syncResult.skipped}
                  label="Ignorados"
                  color="gray"
                />
                <ResultCard
                  value={syncResult.errors.length}
                  label="Erros"
                  color="red"
                />
              </div>

              {syncResult.errors.length > 0 && (
                <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
                  <p className="mb-1 text-sm font-medium text-red-800">
                    Detalhes dos erros:
                  </p>
                  <ul className="list-disc space-y-1 pl-5 text-xs text-red-700">
                    {syncResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultCard({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: "green" | "blue" | "gray" | "red";
}) {
  const bg = {
    green: "bg-green-50",
    blue: "bg-blue-50",
    gray: "bg-gray-50",
    red: "bg-red-50",
  }[color];

  const text = {
    green: "text-green-700",
    blue: "text-blue-700",
    gray: "text-gray-700",
    red: "text-red-700",
  }[color];

  const sub = {
    green: "text-green-600",
    blue: "text-blue-600",
    gray: "text-gray-500",
    red: "text-red-600",
  }[color];

  return (
    <div className={`rounded-md ${bg} p-3 text-center`}>
      <p className={`text-2xl font-bold ${text}`}>{value}</p>
      <p className={`text-xs ${sub}`}>{label}</p>
    </div>
  );
}
