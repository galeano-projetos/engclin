"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { ReportData } from "./actions";

interface ReportOption {
  key: string;
  label: string;
  description: string;
  fetchAction: () => Promise<ReportData>;
}

interface ReportViewerProps {
  reports: ReportOption[];
}

export function ReportViewer({ reports }: ReportViewerProps) {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [data, setData] = useState<ReportData | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSelect(reportKey: string) {
    const report = reports.find((r) => r.key === reportKey);
    if (!report) return;

    setSelectedReport(reportKey);
    startTransition(async () => {
      const result = await report.fetchAction();
      setData(result);
    });
  }

  function handleExportCsv() {
    if (!data) return;

    // BOM para UTF-8 no Excel
    const BOM = "\uFEFF";
    const header = data.columns.map((c) => `"${c.label}"`).join(";");
    const rows = data.rows.map((row) =>
      data.columns
        .map((c) => {
          const val = row[c.key];
          if (val == null) return "";
          if (typeof val === "number") return val.toString();
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(";")
    );

    const csv = BOM + [header, ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedReport}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* Seleção de relatório */}
      <div className="grid gap-4 sm:grid-cols-2">
        {reports.map((report) => (
          <button
            key={report.key}
            onClick={() => handleSelect(report.key)}
            className={`rounded-lg border p-5 text-left transition-all hover:shadow-md ${
              selectedReport === report.key
                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <h3 className="font-semibold text-gray-900">{report.label}</h3>
            <p className="mt-1 text-sm text-gray-500">{report.description}</p>
          </button>
        ))}
      </div>

      {/* Resultado */}
      {isPending && (
        <div className="mt-8 flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-gray-500">
            <svg
              className="h-5 w-5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Gerando relatório...
          </div>
        </div>
      )}

      {!isPending && data && (
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {data.title}
              </h2>
              <p className="text-sm text-gray-500">
                {data.rows.length} registro{data.rows.length !== 1 && "s"}
              </p>
            </div>
            <Button onClick={handleExportCsv} variant="secondary">
              Exportar CSV
            </Button>
          </div>

          {/* Mobile: Cards */}
          <div className="mt-4 space-y-3 lg:hidden">
            {data.rows.length === 0 ? (
              <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-400">
                Nenhum dado encontrado para este relatorio.
              </div>
            ) : (
              data.rows.map((row, i) => (
                <div key={i} className="rounded-lg border bg-white p-4 shadow-sm">
                  {data.columns.map((col) => (
                    <div key={col.key} className="flex justify-between border-b border-gray-100 py-2 last:border-b-0">
                      <span className="text-xs font-medium text-gray-500">{col.label}</span>
                      <span className="ml-2 text-right text-sm text-gray-900">{formatCell(row[col.key])}</span>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Desktop: Tabela */}
          <div className="mt-4 hidden overflow-x-auto rounded-lg border bg-white shadow-sm lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  {data.columns.map((col) => (
                    <th key={col.key} className="px-4 py-3 whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={data.columns.length}
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      Nenhum dado encontrado para este relatório.
                    </td>
                  </tr>
                ) : (
                  data.rows.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      {data.columns.map((col) => (
                        <td
                          key={col.key}
                          className="px-4 py-3 text-gray-700 whitespace-nowrap"
                        >
                          {formatCell(row[col.key])}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function formatCell(value: string | number | null): string {
  if (value == null) return "—";
  if (typeof value === "number") {
    // Se parece valor monetário (tem casas decimais ou é grande)
    return value.toLocaleString("pt-BR", { minimumFractionDigits: 0 });
  }
  return String(value);
}
