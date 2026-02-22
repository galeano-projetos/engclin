"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { bulkExecutePreventives } from "./bulk-actions";

interface MaintenanceBulkBarProps {
  selectedIds: string[];
  onClear: () => void;
}

export function MaintenanceBulkBar({ selectedIds, onClear }: MaintenanceBulkBarProps) {
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ error?: string; count?: number } | null>(null);

  if (selectedIds.length === 0) return null;

  function handleSubmit(formData: FormData) {
    formData.set("maintenanceIds", JSON.stringify(selectedIds));
    startTransition(async () => {
      const res = await bulkExecutePreventives(formData);
      setResult(res);
      if (res.count) {
        setTimeout(() => {
          setShowModal(false);
          setResult(null);
          onClear();
        }, 2000);
      }
    });
  }

  return (
    <>
      {/* Floating bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white px-4 py-3 shadow-lg sm:left-64">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {selectedIds.length} manutencao{selectedIds.length !== 1 ? "es" : ""} selecionada{selectedIds.length !== 1 ? "s" : ""}
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClear}>
              Limpar
            </Button>
            <Button onClick={() => setShowModal(true)}>
              Registrar Execucao em Lote
            </Button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">
              Registrar Execucao em Lote
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {selectedIds.length} manutencao{selectedIds.length !== 1 ? "es" : ""} sera{selectedIds.length !== 1 ? "o" : ""} marcada{selectedIds.length !== 1 ? "s" : ""} como realizada{selectedIds.length !== 1 ? "s" : ""}.
              A proxima manutencao sera gerada automaticamente.
            </p>

            {result?.error && (
              <div className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
                {result.error}
              </div>
            )}
            {result?.count && (
              <div className="mt-3 rounded-md bg-green-50 p-3 text-sm text-green-700">
                {result.count} manutencoes executadas com sucesso!
              </div>
            )}

            <form action={handleSubmit} className="mt-4 space-y-4">
              <Input
                id="executionDate"
                name="executionDate"
                label="Data de Execucao *"
                type="date"
                required
              />
              <Input
                id="notes"
                name="notes"
                label="Observacoes"
                placeholder="Notas adicionais..."
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => { setShowModal(false); setResult(null); }}
                >
                  Cancelar
                </Button>
                <Button type="submit" loading={isPending}>
                  Confirmar Execucao
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
