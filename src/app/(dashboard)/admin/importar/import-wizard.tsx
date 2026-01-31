"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { parseExcelAction, executeImportAction } from "./actions";
import type { ImportPayload } from "@/lib/import/import-mapper";

type Step = "upload" | "preview" | "validation" | "executing" | "done";

export function ImportWizard() {
  const [step, setStep] = useState<Step>("upload");
  const [error, setError] = useState("");
  const [payload, setPayload] = useState<ImportPayload | null>(null);
  const [counts, setCounts] = useState<{ units: number; providers: number; equipments: number; maintenances: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      const result = await parseExcelAction(base64);
      if (result.error) {
        setError(result.error);
      } else if (result.payload) {
        setPayload(result.payload);
        setStep("preview");
      }
    } catch {
      setError("Erro ao ler o arquivo.");
    }
    setLoading(false);
  }, []);

  async function handleExecute() {
    if (!payload) return;
    setStep("executing");
    setLoading(true);
    setError("");

    const result = await executeImportAction(payload);
    if (result.error) {
      setError(result.error);
      setStep("preview");
    } else {
      setCounts(result.counts || null);
      setStep("done");
    }
    setLoading(false);
  }

  function handleReset() {
    setStep("upload");
    setPayload(null);
    setCounts(null);
    setError("");
  }

  return (
    <div className="mt-6">
      {/* Step indicators */}
      <div className="mb-6 flex gap-2">
        {(["upload", "preview", "executing", "done"] as Step[]).map((s, i) => {
          const labels = ["1. Upload", "2. Preview", "3. Importando", "4. Concluido"];
          const isActive = s === step;
          const isPast = (["upload", "preview", "executing", "done"] as Step[]).indexOf(step) > i;
          return (
            <Badge
              key={s}
              variant={isActive ? "info" : isPast ? "success" : "muted"}
            >
              {labels[i]}
            </Badge>
          );
        })}
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Step: Upload */}
      {step === "upload" && (
        <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
          <p className="mb-4 text-gray-600">
            Selecione uma planilha Excel (.xlsx) no formato HCAN para importar
            equipamentos e manutencoes.
          </p>
          <p className="mb-6 text-xs text-gray-400">
            Colunas esperadas: SETOR, EQUIPAMENTO, CRITICIDADE, PATRIMONIO, MARCA,
            N/S, MODELO, AQUISICAO, DATA MANUTENCAO, PROXIMA MANUTENCAO, DATA
            CALIBRACAO, PROXIMA CALIBRACAO, QUEM REALIZOU
          </p>
          <label className="inline-block cursor-pointer rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700">
            {loading ? "Processando..." : "Selecionar Arquivo"}
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileUpload}
              disabled={loading}
            />
          </label>
        </div>
      )}

      {/* Step: Preview */}
      {step === "preview" && payload && (
        <div className="space-y-4">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold text-gray-900">Resumo da Importacao</h3>
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-md bg-blue-50 p-3 text-center">
                <p className="text-2xl font-bold text-blue-700">{payload.units.length}</p>
                <p className="text-xs text-blue-600">Setores</p>
              </div>
              <div className="rounded-md bg-green-50 p-3 text-center">
                <p className="text-2xl font-bold text-green-700">{payload.providers.length}</p>
                <p className="text-xs text-green-600">Fornecedores</p>
              </div>
              <div className="rounded-md bg-purple-50 p-3 text-center">
                <p className="text-2xl font-bold text-purple-700">{payload.equipments.length}</p>
                <p className="text-xs text-purple-600">Equipamentos</p>
              </div>
              <div className="rounded-md bg-orange-50 p-3 text-center">
                <p className="text-2xl font-bold text-orange-700">{payload.maintenances.length}</p>
                <p className="text-xs text-orange-600">Manutencoes</p>
              </div>
            </div>
          </div>

          {/* Equipment preview table */}
          {payload.equipments.length > 0 && (
            <div className="rounded-lg border bg-white shadow-sm">
              <div className="border-b px-4 py-3">
                <h4 className="font-medium text-gray-900">Equipamentos (primeiros 20)</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-3 py-2">Nome</th>
                      <th className="px-3 py-2">Setor</th>
                      <th className="px-3 py-2">Crit.</th>
                      <th className="px-3 py-2">Patrimonio</th>
                      <th className="px-3 py-2">Marca</th>
                      <th className="px-3 py-2">Modelo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {payload.equipments.slice(0, 20).map((eq, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{eq.name}</td>
                        <td className="px-3 py-2">{eq.unitName}</td>
                        <td className="px-3 py-2">{eq.criticality}</td>
                        <td className="px-3 py-2">{eq.patrimony || "—"}</td>
                        <td className="px-3 py-2">{eq.brand || "—"}</td>
                        <td className="px-3 py-2">{eq.model || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={handleExecute} loading={loading}>
              Confirmar Importacao
            </Button>
            <Button variant="secondary" onClick={handleReset}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Step: Executing */}
      {step === "executing" && (
        <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
          <p className="text-gray-600">Importando dados, aguarde...</p>
        </div>
      )}

      {/* Step: Done */}
      {step === "done" && counts && (
        <div className="space-y-4">
          <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center shadow-sm">
            <p className="text-lg font-semibold text-green-800">Importacao concluida!</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <div className="rounded-md bg-white p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{counts.units}</p>
                <p className="text-xs text-gray-500">Setores</p>
              </div>
              <div className="rounded-md bg-white p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{counts.providers}</p>
                <p className="text-xs text-gray-500">Fornecedores</p>
              </div>
              <div className="rounded-md bg-white p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{counts.equipments}</p>
                <p className="text-xs text-gray-500">Equipamentos criados</p>
              </div>
              <div className="rounded-md bg-white p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{counts.maintenances}</p>
                <p className="text-xs text-gray-500">Manutencoes</p>
              </div>
            </div>
          </div>
          <Button onClick={handleReset}>Nova Importacao</Button>
        </div>
      )}
    </div>
  );
}
