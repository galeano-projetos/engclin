"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { createContract, deleteContract } from "./actions";

interface ProviderOption {
  id: string;
  name: string;
}

interface EquipmentOption {
  id: string;
  name: string;
  patrimony: string | null;
}

interface ContractData {
  id: string;
  name: string;
  providerName: string;
  startDate: string;
  endDate: string;
  value: number | null;
  documentUrl: string | null;
  equipmentNames: string[];
  isActive: boolean;
}

export function ContractPanel({
  contracts,
  providers,
  equipments,
}: {
  contracts: ContractData[];
  providers: ProviderOption[];
  equipments: EquipmentOption[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);

  const providerOptions = providers.map((p) => ({ value: p.id, label: p.name }));
  const equipmentOptions = equipments.map((e) => ({
    value: e.id,
    label: `${e.name}${e.patrimony ? ` (${e.patrimony})` : ""}`,
  }));

  async function handleCreate(formData: FormData) {
    setCreating(true);
    setError("");
    // Add selected equipment IDs to formData
    for (const eqId of selectedEquipments) {
      formData.append("equipmentIds", eqId);
    }
    const result = await createContract(formData);
    if (result.error) {
      setError(result.error);
    } else {
      setShowForm(false);
      setSelectedEquipments([]);
    }
    setCreating(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja excluir este contrato?")) return;
    setDeletingId(id);
    await deleteContract(id);
    setDeletingId(null);
  }

  function toggleEquipment(eqId: string) {
    setSelectedEquipments((prev) =>
      prev.includes(eqId) ? prev.filter((id) => id !== eqId) : [...prev, eqId]
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contratos</h1>
          <p className="mt-1 text-sm text-gray-500">
            {contracts.length} contrato{contracts.length !== 1 && "s"}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancelar" : "Novo Contrato"}
        </Button>
      </div>

      {showForm && (
        <div className="mt-4 rounded-lg border bg-blue-50 p-4">
          <form action={handleCreate} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Select id="providerId" name="providerId" label="Fornecedor *" placeholder="Selecione" options={providerOptions} required />
              <Input id="name" name="name" label="Nome do Contrato *" placeholder="Ex: Contrato Anual Calibracao" required />
              <Input id="startDate" name="startDate" label="Data Inicio *" type="date" required />
              <Input id="endDate" name="endDate" label="Data Fim *" type="date" required />
              <Input id="value" name="value" label="Valor (R$)" type="number" step="0.01" min="0" placeholder="50000.00" />
              <Input id="documentUrl" name="documentUrl" label="URL do Documento" type="url" placeholder="https://..." />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Equipamentos Cobertos</p>
              <div className="max-h-40 overflow-y-auto rounded border bg-white p-2">
                {equipmentOptions.map((eq) => (
                  <label key={eq.value} className="flex items-center gap-2 px-2 py-1 text-sm hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedEquipments.includes(eq.value)}
                      onChange={() => toggleEquipment(eq.value)}
                    />
                    {eq.label}
                  </label>
                ))}
                {equipmentOptions.length === 0 && (
                  <p className="p-2 text-xs text-gray-400">Nenhum equipamento cadastrado.</p>
                )}
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" loading={creating}>Criar Contrato</Button>
          </form>
        </div>
      )}

      <div className="mt-4 space-y-3">
        {contracts.length === 0 ? (
          <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-400">
            Nenhum contrato cadastrado.
          </div>
        ) : (
          contracts.map((c) => (
            <div key={c.id} className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{c.name}</p>
                    <Badge variant={c.isActive ? "success" : "muted"}>
                      {c.isActive ? "Vigente" : "Encerrado"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{c.providerName}</p>
                </div>
                <Button variant="danger" onClick={() => handleDelete(c.id)} loading={deletingId === c.id}>
                  Excluir
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                <span>De {c.startDate} a {c.endDate}</span>
                {c.value != null && (
                  <span>R$ {c.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                )}
              </div>
              {c.equipmentNames.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  <span className="font-medium">Equipamentos:</span> {c.equipmentNames.join(", ")}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
