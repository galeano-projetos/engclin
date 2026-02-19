"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { suggestSectionText, generatePgts } from "./actions";

interface EquipmentSummary {
  total: number;
  critA: number;
  critB: number;
  critC: number;
  ativos: number;
}

interface MaintenanceSummary {
  preventivas: number;
  calibracoes: number;
  tse: number;
}

interface TrainingSummary {
  total: number;
  completions: number;
}

interface PgtsGenerateModalProps {
  onClose: () => void;
  tenantName: string;
  tenantCnpj: string;
  equipmentSummary: EquipmentSummary;
  maintenanceSummary: MaintenanceSummary;
  trainingSummary: TrainingSummary;
}

interface SectionConfig {
  key: string;
  label: string;
  type: "auto" | "text";
  description: string;
}

const SECTIONS: SectionConfig[] = [
  {
    key: "identificacao",
    label: "1. Identifica\u00e7\u00e3o do Estabelecimento",
    type: "auto",
    description: "Dados do estabelecimento preenchidos automaticamente.",
  },
  {
    key: "objetivo",
    label: "2. Objetivo do Plano",
    type: "text",
    description: "Descreva o objetivo do PGTS conforme RDC 509/2021.",
  },
  {
    key: "estrutura_organizacional",
    label: "3. Estrutura Organizacional",
    type: "text",
    description: "Descreva a estrutura do setor de engenharia cl\u00ednica.",
  },
  {
    key: "inventario",
    label: "4. Invent\u00e1rio de Tecnologias",
    type: "auto",
    description: "Invent\u00e1rio de equipamentos preenchido automaticamente a partir do cadastro.",
  },
  {
    key: "etapas_gerenciamento",
    label: "5. Etapas do Gerenciamento",
    type: "text",
    description: "Descreva as etapas do ciclo de vida das tecnologias.",
  },
  {
    key: "gerenciamento_riscos",
    label: "6. Gerenciamento de Riscos",
    type: "text",
    description: "Descreva a gest\u00e3o de riscos e criticidade dos equipamentos.",
  },
  {
    key: "rastreabilidade",
    label: "7. Rastreabilidade",
    type: "text",
    description: "Descreva o sistema de rastreabilidade de equipamentos.",
  },
  {
    key: "capacitacao",
    label: "8. Capacita\u00e7\u00e3o e Treinamento",
    type: "text",
    description: "Descreva o programa de treinamento dos operadores.",
  },
  {
    key: "infraestrutura",
    label: "9. Infraestrutura F\u00edsica",
    type: "text",
    description: "Descreva os requisitos de infraestrutura.",
  },
  {
    key: "documentacao",
    label: "10. Documenta\u00e7\u00e3o e Registros",
    type: "text",
    description: "Descreva o sistema de documenta\u00e7\u00e3o e registros.",
  },
  {
    key: "avaliacao_anual",
    label: "11. Avalia\u00e7\u00e3o Anual",
    type: "text",
    description: "Descreva indicadores e m\u00e9tricas de avalia\u00e7\u00e3o anual.",
  },
  {
    key: "anexos",
    label: "12. Anexos",
    type: "auto",
    description: "Espa\u00e7o reservado para anexos complementares.",
  },
];

export function PgtsGenerateModal({
  onClose,
  tenantName,
  tenantCnpj,
  equipmentSummary,
  maintenanceSummary,
  trainingSummary,
}: PgtsGenerateModalProps) {
  const [sections, setSections] = useState<Record<string, string>>({});
  const [suggestingKey, setSuggestingKey] = useState<string | null>(null);
  const [fillingAll, setFillingAll] = useState(false);
  const [generating, startGenerating] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState(0);

  const textSectionKeys = SECTIONS.filter((s) => s.type === "text").map((s) => s.key);

  function updateSection(key: string, value: string) {
    setSections((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSuggest(key: string) {
    setSuggestingKey(key);
    setError(null);
    try {
      const result = await suggestSectionText(key);
      if (result.error) {
        setError(result.error);
      } else if (result.text) {
        updateSection(key, result.text);
      }
    } catch {
      setError("Erro ao comunicar com a IA.");
    } finally {
      setSuggestingKey(null);
    }
  }

  async function handleFillAll() {
    setFillingAll(true);
    setError(null);
    const emptyKeys = textSectionKeys.filter((k) => !sections[k]?.trim());
    if (emptyKeys.length === 0) {
      setFillingAll(false);
      return;
    }
    try {
      const results = await Promise.allSettled(
        emptyKeys.map(async (key) => {
          const result = await suggestSectionText(key);
          return { key, result };
        })
      );
      setSections((prev) => {
        const updated = { ...prev };
        for (const r of results) {
          if (r.status === "fulfilled" && r.value.result.text) {
            updated[r.value.key] = r.value.result.text;
          }
        }
        return updated;
      });
    } catch {
      setError("Erro ao preencher se\u00e7\u00f5es com IA.");
    } finally {
      setFillingAll(false);
    }
  }

  function handleGenerate() {
    setError(null);
    startGenerating(async () => {
      const result = await generatePgts(sections);
      if (result.error) {
        setError(result.error);
      } else if (result.id) {
        setSuccess(result.id);
      }
    });
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="mx-4 max-w-md rounded-lg bg-white p-8 text-center shadow-xl">
          <svg
            className="mx-auto h-16 w-16 text-teal-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="mt-4 text-xl font-bold text-gray-900">PGTS Gerado com Sucesso!</h2>
          <p className="mt-2 text-sm text-gray-500">
            O documento foi salvo e est{"\u00e1"} dispon{"\u00ed"}vel para download na tabela de vers{"\u00f5"}es.
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <a
              href={`/api/pgts/${success}/download`}
              className="inline-flex items-center rounded-md bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700"
            >
              Baixar PDF
            </a>
            <Button variant="secondary" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b bg-white px-6 py-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Gerar Novo PGTS</h2>
          <p className="text-sm text-gray-500">
            Preencha as se{"\u00e7\u00f5"}es ou clique em &quot;Preencher tudo com IA&quot;. Se{"\u00e7\u00f5"}es vazias ser{"\u00e3"}o preenchidas automaticamente.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={handleFillAll}
            loading={fillingAll}
            disabled={fillingAll || generating}
          >
            {fillingAll ? "Preenchendo..." : "Preencher tudo com IA"}
          </Button>
          <Button
            onClick={handleGenerate}
            loading={generating}
            disabled={generating || fillingAll}
          >
            {generating ? "Gerando PDF..." : "Gerar PGTS"}
          </Button>
          <Button variant="ghost" onClick={onClose} disabled={generating || fillingAll}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar navigation */}
        <nav className="hidden w-64 flex-shrink-0 overflow-y-auto border-r bg-gray-50 p-4 lg:block">
          <ul className="space-y-1">
            {SECTIONS.map((s, idx) => (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => setActiveSection(idx)}
                  className={`w-full rounded-md px-3 py-2 text-left text-xs transition-colors ${
                    activeSection === idx
                      ? "bg-teal-100 font-medium text-teal-800"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {sections[s.key] || s.type === "auto" ? (
                      <svg className="h-3.5 w-3.5 flex-shrink-0 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="9" />
                      </svg>
                    )}
                    {s.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile section selector */}
        <div className="border-b bg-gray-50 p-3 lg:hidden">
          <select
            value={activeSection}
            onChange={(e) => setActiveSection(Number(e.target.value))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            {SECTIONS.map((s, idx) => (
              <option key={s.key} value={idx}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6">
          {SECTIONS.map((section, idx) => (
            <div
              key={section.key}
              className={activeSection === idx ? "block" : "hidden"}
            >
              <h3 className="text-lg font-semibold text-gray-900">{section.label}</h3>
              <p className="mt-1 text-sm text-gray-500">{section.description}</p>

              <div className="mt-4">
                {section.key === "identificacao" && (
                  <div className="space-y-3">
                    <div className="rounded-lg border bg-gray-50 p-4">
                      <p className="text-xs font-medium text-gray-500">Estabelecimento</p>
                      <p className="text-sm font-medium text-gray-900">{tenantName}</p>
                    </div>
                    <div className="rounded-lg border bg-gray-50 p-4">
                      <p className="text-xs font-medium text-gray-500">CNPJ</p>
                      <p className="text-sm font-medium text-gray-900">{tenantCnpj}</p>
                    </div>
                  </div>
                )}

                {section.key === "inventario" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-lg border bg-blue-50 p-4 text-center">
                        <p className="text-2xl font-bold text-blue-700">{equipmentSummary.total}</p>
                        <p className="text-xs text-blue-600">Total</p>
                      </div>
                      <div className="rounded-lg border bg-red-50 p-4 text-center">
                        <p className="text-2xl font-bold text-red-700">{equipmentSummary.critA}</p>
                        <p className="text-xs text-red-600">Criticidade A</p>
                      </div>
                      <div className="rounded-lg border bg-yellow-50 p-4 text-center">
                        <p className="text-2xl font-bold text-yellow-700">{equipmentSummary.critB}</p>
                        <p className="text-xs text-yellow-600">Criticidade B</p>
                      </div>
                      <div className="rounded-lg border bg-green-50 p-4 text-center">
                        <p className="text-2xl font-bold text-green-700">{equipmentSummary.critC}</p>
                        <p className="text-xs text-green-600">Criticidade C</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      O inventario completo sera incluido automaticamente no PDF gerado.
                    </p>
                  </div>
                )}

                {section.key === "anexos" && (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                    <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">
                      Os anexos serao referenciados no documento gerado.
                    </p>
                  </div>
                )}

                {section.type === "text" && (
                  <div>
                    <div className="mb-2 flex items-center justify-end">
                      <Button
                        variant="secondary"
                        className="text-xs"
                        loading={suggestingKey === section.key}
                        disabled={suggestingKey !== null}
                        onClick={() => handleSuggest(section.key)}
                      >
                        {suggestingKey === section.key ? "Gerando..." : "Sugerir com IA"}
                      </Button>
                    </div>
                    <textarea
                      rows={10}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      placeholder={`Digite o conteudo para "${section.label}" ou clique em "Sugerir com IA"...`}
                      value={sections[section.key] || ""}
                      onChange={(e) => updateSection(section.key, e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="mt-6 flex justify-between">
                <Button
                  variant="ghost"
                  disabled={idx === 0}
                  onClick={() => setActiveSection(idx - 1)}
                >
                  Anterior
                </Button>
                {idx < SECTIONS.length - 1 ? (
                  <Button
                    variant="secondary"
                    onClick={() => setActiveSection(idx + 1)}
                  >
                    Proximo
                  </Button>
                ) : (
                  <Button
                    onClick={handleGenerate}
                    loading={generating}
                    disabled={generating}
                  >
                    {generating ? "Gerando PDF..." : "Gerar PGTS"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
