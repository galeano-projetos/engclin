"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { bulkSchedulePreventive } from "./bulk-actions";

interface EquipmentBulkBarProps {
  selectedIds: string[];
  onClear: () => void;
  providers: { id: string; name: string }[];
  allowedServiceTypes: string[];
}

export function EquipmentBulkBar({ selectedIds, onClear, providers, allowedServiceTypes }: EquipmentBulkBarProps) {
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ error?: string; count?: number } | null>(null);

  if (selectedIds.length === 0) return null;

  function handleSubmit(formData: FormData) {
    formData.set("equipmentIds", JSON.stringify(selectedIds));
    startTransition(async () => {
      const res = await bulkSchedulePreventive(formData);
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

  const serviceTypeOptions = [
    { value: "PREVENTIVA", label: "Preventiva" },
    { value: "CALIBRACAO", label: "Calibracao" },
    { value: "TSE", label: "Teste Seg. Eletrica" },
  ].filter((o) => allowedServiceTypes.includes(o.value));

  return (
    <>
      {/* Floating bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white px-4 py-3 shadow-lg sm:left-64">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {selectedIds.length} equipamento{selectedIds.length !== 1 && "s"} selecionado{selectedIds.length !== 1 && "s"}
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClear}>
              Limpar
            </Button>
            <Button onClick={() => setShowModal(true)}>
              Agendar Preventiva em Lote
            </Button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">
              Agendar Preventiva em Lote
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Sera criada uma manutencao para cada um dos {selectedIds.length} equipamentos selecionados.
            </p>

            {result?.error && (
              <div className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
                {result.error}
              </div>
            )}
            {result?.count && (
              <div className="mt-3 rounded-md bg-green-50 p-3 text-sm text-green-700">
                {result.count} manutencoes agendadas com sucesso!
              </div>
            )}

            <form action={handleSubmit} className="mt-4 space-y-4">
              <Select
                id="serviceType"
                name="serviceType"
                label="Tipo de Servico *"
                options={serviceTypeOptions}
                required
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  id="scheduledDate"
                  name="scheduledDate"
                  label="Data Agendada *"
                  type="date"
                  required
                />
                <Select
                  id="periodicityMonths"
                  name="periodicityMonths"
                  label="Periodicidade"
                  options={[
                    { value: "3", label: "Trimestral" },
                    { value: "6", label: "Semestral" },
                    { value: "12", label: "Anual" },
                    { value: "24", label: "Bienal" },
                  ]}
                />
              </div>
              {providers.length > 0 && (
                <Combobox
                  id="providerId"
                  name="providerId"
                  label="Fornecedor"
                  placeholder="Buscar fornecedor..."
                  options={providers.map((p) => ({ value: p.id, label: p.name }))}
                />
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => { setShowModal(false); setResult(null); }}
                >
                  Cancelar
                </Button>
                <Button type="submit" loading={isPending}>
                  Agendar {selectedIds.length} Preventiva{selectedIds.length !== 1 && "s"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
