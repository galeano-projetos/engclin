"use client";

import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
      <h2 className="text-xl font-semibold text-gray-900">Erro inesperado</h2>
      <p className="text-sm text-gray-600">
        Ocorreu um erro na aplicacao. Tente novamente.
      </p>
      <button
        onClick={reset}
        className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
      >
        Tentar novamente
      </button>
    </div>
  );
}
