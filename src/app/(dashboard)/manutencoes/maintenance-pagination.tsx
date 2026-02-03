"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  perPage: number;
}

const PER_PAGE_OPTIONS = [
  { value: "20", label: "20 por pagina" },
  { value: "50", label: "50 por pagina" },
  { value: "100", label: "100 por pagina" },
  { value: "150", label: "150 por pagina" },
  { value: "200", label: "200 por pagina" },
  { value: "0", label: "Todos" },
];

export function MaintenancePagination({
  currentPage,
  totalPages,
  totalCount,
  perPage,
}: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const buildUrl = useCallback(
    (params: Record<string, string>) => {
      const current = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(params)) {
        if (value) {
          current.set(key, value);
        } else {
          current.delete(key);
        }
      }
      return `/manutencoes?${current.toString()}`;
    },
    [searchParams]
  );

  function goToPage(page: number) {
    router.push(buildUrl({ page: String(page) }));
  }

  function handlePerPageChange(value: string) {
    router.push(buildUrl({ perPage: value, page: "1" }));
  }

  const showAll = perPage === 0;

  function getPageNumbers(): (number | "...")[] {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | "...")[] = [1];

    if (currentPage > 3) pages.push("...");

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) pages.push("...");

    pages.push(totalPages);

    return pages;
  }

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>Exibir:</span>
        <select
          value={String(perPage)}
          onChange={(e) => handlePerPageChange(e.target.value)}
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {PER_PAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="text-gray-400">({totalCount} total)</span>
      </div>

      {!showAll && totalPages > 1 && (
        <nav className="flex items-center gap-1">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Anterior
          </button>

          {getPageNumbers().map((p, idx) =>
            p === "..." ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-sm text-gray-400">
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => goToPage(p)}
                className={`min-w-[36px] rounded-md border px-2 py-1.5 text-sm font-medium ${
                  p === currentPage
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Proximo
          </button>
        </nav>
      )}
    </div>
  );
}
