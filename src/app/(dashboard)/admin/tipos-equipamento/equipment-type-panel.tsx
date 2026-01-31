"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { createEquipmentType, deleteEquipmentType } from "./actions";
import { criticalityLabel } from "@/lib/utils/periodicity";

interface ProviderOption {
  id: string;
  name: string;
}

interface EquipmentTypeData {
  id: string;
  name: string;
  defaultCriticality: string;
  preventivaPeriodicity: string;
  calibracaoPeriodicity: string;
  tsePeriodicity: string;
  reserveCount: number;
  defaultPreventivaProvider: ProviderOption | null;
  defaultCalibracaoProvider: ProviderOption | null;
  defaultTseProvider: ProviderOption | null;
  equipmentCount: number;
}

const periodicityOptions = [
  { value: "TRIMESTRAL", label: "Trimestral" },
  { value: "SEMESTRAL", label: "Semestral" },
  { value: "ANUAL", label: "Anual" },
  { value: "BIENAL", label: "Bienal" },
  { value: "QUINQUENAL", label: "Quinquenal" },
  { value: "NAO_APLICAVEL", label: "N/A" },
];

const criticalityOptions = [
  { value: "A", label: "1 - Critico" },
  { value: "B", label: "2 - Moderado" },
  { value: "C", label: "3 - Baixo" },
];

const criticalityVariant: Record<string, "danger" | "warning" | "success"> = {
  A: "danger",
  B: "warning",
  C: "success",
};

export function EquipmentTypePanel({
  types,
  providers,
}: {
  types: EquipmentTypeData[];
  providers: ProviderOption[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const providerOptions = providers.map((p) => ({ value: p.id, label: p.name }));

  async function handleCreate(formData: FormData) {
    setCreating(true);
    setError("");
    const result = await createEquipmentType(formData);
    if (result.error) {
      setError(result.error);
    } else {
      setShowForm(false);
    }
    setCreating(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja excluir este tipo de equipamento?")) return;
    setDeletingId(id);
    setDeleteError("");
    const result = await deleteEquipmentType(id);
    if (result.error) {
      setDeleteError(result.error);
    }
    setDeletingId(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tipos de Equipamento</h1>
          <p className="mt-1 text-sm text-gray-500">
            {types.length} tipo{types.length !== 1 && "s"} cadastrado{types.length !== 1 && "s"}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancelar" : "Novo Tipo"}
        </Button>
      </div>

      {showForm && (
        <div className="mt-4 rounded-lg border bg-blue-50 p-4">
          <form action={handleCreate} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Input id="name" name="name" label="Nome do Tipo *" placeholder="Ex: Monitor Multiparametro" required />
              <Select id="defaultCriticality" name="defaultCriticality" label="Criticidade Padrao" options={criticalityOptions} defaultValue="C" />
              <Input id="reserveCount" name="reserveCount" label="Qtd Reserva" type="number" min="0" defaultValue="0" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">Preventiva</p>
                <Select id="preventivaPeriodicity" name="preventivaPeriodicity" label="Periodicidade" options={periodicityOptions} defaultValue="ANUAL" />
                <div className="mt-2">
                  <Select id="defaultPreventivaProviderId" name="defaultPreventivaProviderId" label="Fornecedor Padrao" placeholder="Nenhum" options={providerOptions} />
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">Calibracao</p>
                <Select id="calibracaoPeriodicity" name="calibracaoPeriodicity" label="Periodicidade" options={periodicityOptions} defaultValue="ANUAL" />
                <div className="mt-2">
                  <Select id="defaultCalibracaoProviderId" name="defaultCalibracaoProviderId" label="Fornecedor Padrao" placeholder="Nenhum" options={providerOptions} />
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">TSE</p>
                <Select id="tsePeriodicity" name="tsePeriodicity" label="Periodicidade" options={periodicityOptions} defaultValue="ANUAL" />
                <div className="mt-2">
                  <Select id="defaultTseProviderId" name="defaultTseProviderId" label="Fornecedor Padrao" placeholder="Nenhum" options={providerOptions} />
                </div>
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" loading={creating}>Criar Tipo</Button>
          </form>
        </div>
      )}

      {deleteError && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {deleteError}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {types.length === 0 ? (
          <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-400">
            Nenhum tipo cadastrado.
          </div>
        ) : (
          types.map((t) => (
            <div key={t.id} className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{t.name}</p>
                    <Badge variant={criticalityVariant[t.defaultCriticality]}>
                      {criticalityLabel(t.defaultCriticality)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {t.equipmentCount} equipamento{t.equipmentCount !== 1 && "s"} | Reserva: {t.reserveCount}
                  </p>
                </div>
                <Button
                  variant="danger"
                  onClick={() => handleDelete(t.id)}
                  loading={deletingId === t.id}
                >
                  Excluir
                </Button>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-gray-600 sm:grid-cols-3">
                <div>
                  <span className="font-medium">Preventiva:</span> {t.preventivaPeriodicity.replace("_", " ")}
                  {t.defaultPreventivaProvider && <span> ({t.defaultPreventivaProvider.name})</span>}
                </div>
                <div>
                  <span className="font-medium">Calibracao:</span> {t.calibracaoPeriodicity.replace("_", " ")}
                  {t.defaultCalibracaoProvider && <span> ({t.defaultCalibracaoProvider.name})</span>}
                </div>
                <div>
                  <span className="font-medium">TSE:</span> {t.tsePeriodicity.replace("_", " ")}
                  {t.defaultTseProvider && <span> ({t.defaultTseProvider.name})</span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
