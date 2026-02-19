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
  const [counts, setCounts] = useState<{ units: number; providers: number; equipments: number; maintenances: number; equipmentTypes: number } | null>(null);
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
        <div className="rounded-lg border bg-white p-8 shadow-sm">
          <div className="text-center">
            <p className="mb-4 text-gray-600">
              Importe equipamentos e manutencoes a partir de uma planilha Excel (.xlsx).
            </p>
          </div>

          {/* Download template */}
          <div className="mb-6 rounded-md border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-800">Primeiro, baixe o modelo</p>
                <p className="mt-1 text-xs text-blue-700">
                  Baixe a planilha modelo, preencha com os dados dos seus equipamentos
                  e depois envie o arquivo preenchido. Apenas SETOR e EQUIPAMENTO sao obrigatorios,
                  todos os outros campos podem ser preenchidos depois no sistema.
                </p>
                <a
                  href="/api/import-template"
                  download
                  className="mt-3 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Baixar Modelo Excel
                </a>
              </div>
            </div>
          </div>

          {/* Upload file */}
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <p className="mb-1 text-sm font-medium text-gray-700">Enviar planilha preenchida</p>
            <p className="mb-3 text-xs text-gray-500">
              22 colunas suportadas: SETOR, EQUIPAMENTO, TIPO EQUIPAMENTO, CRITICIDADE,
              PATRIMONIO, MARCA, N/S, MODELO, REGISTRO ANVISA, TIPO PROPRIEDADE,
              FORNECEDOR COMODATO, AQUISICAO, VALOR AQUISICAO, PLANO CONTINGENCIA, STATUS,
              DATA MANUTENCAO, PROXIMA MANUTENCAO, DATA CALIBRACAO, PROXIMA CALIBRACAO,
              DATA TSE, PROXIMA TSE, QUEM REALIZOU
            </p>
            <label className="inline-block cursor-pointer rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700">
              {loading ? "Processando..." : "Selecionar Arquivo (.xlsx)"}
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileUpload}
                disabled={loading}
              />
            </label>
          </div>
        </div>
      )}

      {/* Step: Preview */}
      {step === "preview" && payload && (
        <div className="space-y-4">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold text-gray-900">Resumo da Importacao</h3>
            <div className="grid gap-3 sm:grid-cols-5">
              <div className="rounded-md bg-blue-50 p-3 text-center">
                <p className="text-2xl font-bold text-blue-700">{payload.units.length}</p>
                <p className="text-xs text-blue-600">Setores</p>
              </div>
              <div className="rounded-md bg-green-50 p-3 text-center">
                <p className="text-2xl font-bold text-green-700">{payload.providers.length}</p>
                <p className="text-xs text-green-600">Fornecedores</p>
              </div>
              <div className="rounded-md bg-teal-50 p-3 text-center">
                <p className="text-2xl font-bold text-teal-700">
                  {new Set(payload.equipments.map((eq) => eq.typeName).filter(Boolean)).size}
                </p>
                <p className="text-xs text-teal-600">Tipos Equip.</p>
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
                      <th className="px-3 py-2">Tipo</th>
                      <th className="px-3 py-2">Setor</th>
                      <th className="px-3 py-2">Crit.</th>
                      <th className="px-3 py-2">Patrimonio</th>
                      <th className="px-3 py-2">Marca</th>
                      <th className="px-3 py-2">Modelo</th>
                      <th className="px-3 py-2">ANVISA</th>
                      <th className="px-3 py-2">Prop.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {payload.equipments.slice(0, 20).map((eq, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{eq.name}</td>
                        <td className="px-3 py-2">{eq.typeName || "—"}</td>
                        <td className="px-3 py-2">{eq.unitName}</td>
                        <td className="px-3 py-2">{eq.criticality}</td>
                        <td className="px-3 py-2">{eq.patrimony || "—"}</td>
                        <td className="px-3 py-2">{eq.brand || "—"}</td>
                        <td className="px-3 py-2">{eq.model || "—"}</td>
                        <td className="px-3 py-2">{eq.anvisaRegistry || "—"}</td>
                        <td className="px-3 py-2">{eq.ownershipType || "—"}</td>
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
            <div className="mt-4 grid gap-3 sm:grid-cols-5">
              <div className="rounded-md bg-white p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{counts.units}</p>
                <p className="text-xs text-gray-500">Setores</p>
              </div>
              <div className="rounded-md bg-white p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{counts.providers}</p>
                <p className="text-xs text-gray-500">Fornecedores</p>
              </div>
              <div className="rounded-md bg-white p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{counts.equipmentTypes}</p>
                <p className="text-xs text-gray-500">Tipos Equip.</p>
              </div>
              <div className="rounded-md bg-white p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{counts.equipments}</p>
                <p className="text-xs text-gray-500">Equipamentos</p>
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
