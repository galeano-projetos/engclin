"use client";

import { useRouter } from "next/navigation";

interface PgtsExportButtonProps {
  latestPgtsId: string | null;
  canExport: boolean;
}

export function PgtsExportButton({ latestPgtsId, canExport }: PgtsExportButtonProps) {
  const router = useRouter();

  if (canExport) {
    return (
      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="h-8 w-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">PGTS</h3>
              <p className="text-xs text-gray-500">
                {latestPgtsId
                  ? "Exporte a ultima versao do PGTS"
                  : "Nenhum PGTS gerado ainda"}
              </p>
            </div>
          </div>
          {latestPgtsId ? (
            <a
              href={`/api/pgts/${latestPgtsId}/download`}
              className="inline-flex items-center rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
            >
              Exportar PGTS
            </a>
          ) : (
            <button
              onClick={() => router.push("/pgts")}
              className="inline-flex items-center rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
            >
              Gerar PGTS
            </button>
          )}
        </div>
      </div>
    );
  }

  // Non-Enterprise: locked state
  return (
    <div className="rounded-lg border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">PGTS</h3>
            <p className="text-xs text-gray-400">Exportacao do PGTS</p>
          </div>
        </div>
        <span className="text-2xl">&#128274;</span>
      </div>
      <p className="mt-3 text-sm text-gray-500">
        Disponivel no plano Enterprise.
      </p>
    </div>
  );
}
