"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PgtsGenerateModal } from "./pgts-generate-modal";

interface PgtsVersion {
  id: string;
  version: number;
  fileName: string;
  createdAt: string;
  generatedByName: string;
}

interface PgtsPageClientProps {
  versions: PgtsVersion[];
  canGenerate: boolean;
  isEnterprise: boolean;
  tenantName: string;
  tenantCnpj: string;
  equipmentSummary: {
    total: number;
    critA: number;
    critB: number;
    critC: number;
    ativos: number;
  };
  maintenanceSummary: {
    preventivas: number;
    calibracoes: number;
    tse: number;
  };
  trainingSummary: {
    total: number;
    completions: number;
  };
}

export function PgtsPageClient({
  versions,
  canGenerate,
  isEnterprise,
  tenantName,
  tenantCnpj,
  equipmentSummary,
  maintenanceSummary,
  trainingSummary,
}: PgtsPageClientProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Plano de Gerenciamento de Tecnologias em Saude (PGTS)
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gere o documento oficial exigido pela RDC 509/2021 da Anvisa.
          </p>
        </div>
        <div className="relative">
          <Button
            disabled={!canGenerate}
            onClick={() => setShowModal(true)}
          >
            Gerar Novo PGTS
          </Button>
          {!isEnterprise && (
            <p className="mt-1 text-right text-xs text-gray-400">
              Disponivel no plano Enterprise
            </p>
          )}
        </div>
      </div>

      {/* Informações sobre o PGTS */}
      <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-800">O que e o PGTS?</p>
            <p className="mt-1 text-xs text-blue-700">
              O Plano de Gerenciamento de Tecnologias em Saude e um documento obrigatorio
              exigido pela RDC 509/2021 da Anvisa. Ele consolida todas as informacoes sobre
              o gerenciamento de equipamentos medicos do estabelecimento, incluindo inventario,
              cronogramas de manutencao, gestao de riscos e indicadores de desempenho.
            </p>
          </div>
        </div>
      </div>

      {/* Estrutura do PGTS */}
      <div className="mt-4 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Estrutura do Documento (12 secoes)</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "1. Identificacao do Estabelecimento",
            "2. Objetivo do Plano",
            "3. Estrutura Organizacional",
            "4. Inventario de Tecnologias",
            "5. Etapas do Gerenciamento",
            "6. Gerenciamento de Riscos",
            "7. Rastreabilidade",
            "8. Capacitacao e Treinamento",
            "9. Infraestrutura Fisica",
            "10. Documentacao e Registros",
            "11. Avaliacao Anual",
            "12. Anexos",
          ].map((section) => (
            <div key={section} className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-700">
              <svg className="h-3.5 w-3.5 flex-shrink-0 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {section}
            </div>
          ))}
        </div>
      </div>

      {/* Histórico de versões */}
      <div className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Historico de Versoes</h2>

        {versions.length === 0 ? (
          <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="mt-3 text-sm text-gray-500">
              Nenhuma versao do PGTS gerada ainda.
            </p>
            {canGenerate && (
              <p className="mt-1 text-xs text-gray-400">
                Clique em &quot;Gerar Novo PGTS&quot; para criar a primeira versao.
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Mobile: Cards */}
            <div className="space-y-3 lg:hidden">
              {versions.map((v) => (
                <div key={v.id} className="rounded-lg border bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <Badge variant="info">v{v.version}</Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(v.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-900">{v.fileName}</p>
                  <p className="text-xs text-gray-500">{v.generatedByName}</p>
                  <div className="mt-3">
                    <a
                      href={`/api/pgts/${v.id}/download`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      Baixar PDF
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Tabela */}
            <div className="hidden overflow-x-auto rounded-lg border bg-white shadow-sm lg:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Versao</th>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Responsavel</th>
                    <th className="px-4 py-3">Arquivo</th>
                    <th className="px-4 py-3">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {versions.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Badge variant="info">v{v.version}</Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {new Date(v.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{v.generatedByName}</td>
                      <td className="px-4 py-3 text-gray-700">{v.fileName}</td>
                      <td className="px-4 py-3">
                        <a
                          href={`/api/pgts/${v.id}/download`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          Baixar PDF
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <PgtsGenerateModal
          onClose={() => setShowModal(false)}
          tenantName={tenantName}
          tenantCnpj={tenantCnpj}
          equipmentSummary={equipmentSummary}
          maintenanceSummary={maintenanceSummary}
          trainingSummary={trainingSummary}
        />
      )}
    </div>
  );
}
