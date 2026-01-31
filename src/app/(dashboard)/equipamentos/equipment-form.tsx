"use client";

import { useActionState, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Unit {
  id: string;
  name: string;
}

interface EquipmentTypeOption {
  id: string;
  name: string;
  defaultCriticality: string;
}

interface EquipmentData {
  id?: string;
  name: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  patrimony: string | null;
  unitId: string;
  criticality: string;
  status: string;
  acquisitionDate: Date | null;
  acquisitionValue: number | null;
  equipmentTypeId: string | null;
  ownershipType: string;
  loanProvider: string | null;
}

interface EquipmentFormProps {
  units: Unit[];
  equipmentTypes?: EquipmentTypeOption[];
  equipment?: EquipmentData;
  action: (
    state: { error?: string } | undefined,
    formData: FormData
  ) => Promise<{ error?: string } | undefined>;
}

function formatDate(date: Date | null): string {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
}

export function EquipmentForm({
  units,
  equipmentTypes = [],
  equipment,
  action,
}: EquipmentFormProps) {
  const [state, formAction, isPending] = useActionState(action, undefined);
  const [ownershipType, setOwnershipType] = useState(equipment?.ownershipType || "PROPRIO");
  const [selectedTypeId, setSelectedTypeId] = useState(equipment?.equipmentTypeId || "");
  const [criticality, setCriticality] = useState(equipment?.criticality || "C");

  function handleTypeChange(typeId: string) {
    setSelectedTypeId(typeId);
    if (typeId) {
      const eqType = equipmentTypes.find((t) => t.id === typeId);
      if (eqType) {
        setCriticality(eqType.defaultCriticality);
      }
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      {equipment?.id && (
        <input type="hidden" name="_equipmentId" value={equipment.id} />
      )}
      {state?.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Informacoes Basicas
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="name"
            name="name"
            label="Nome do Equipamento *"
            placeholder="Ex: Monitor Multiparametro"
            defaultValue={equipment?.name}
            required
          />
          <Select
            id="unitId"
            name="unitId"
            label="Setor / Localizacao *"
            placeholder="Selecione o setor"
            options={units.map((u) => ({ value: u.id, label: u.name }))}
            defaultValue={equipment?.unitId}
            required
          />
          {equipmentTypes.length > 0 && (
            <Select
              id="equipmentTypeId"
              name="equipmentTypeId"
              label="Tipo de Equipamento"
              placeholder="Selecione o tipo"
              options={equipmentTypes.map((t) => ({ value: t.id, label: t.name }))}
              value={selectedTypeId}
              onChange={(e) => handleTypeChange(e.target.value)}
            />
          )}
          <Input
            id="brand"
            name="brand"
            label="Marca"
            placeholder="Ex: Philips"
            defaultValue={equipment?.brand || ""}
          />
          <Input
            id="model"
            name="model"
            label="Modelo"
            placeholder="Ex: IntelliVue MX450"
            defaultValue={equipment?.model || ""}
          />
          <Input
            id="serialNumber"
            name="serialNumber"
            label="Numero de Serie"
            placeholder="Ex: SN-001234"
            defaultValue={equipment?.serialNumber || ""}
          />
          <Input
            id="patrimony"
            name="patrimony"
            label="Patrimonio"
            placeholder="Ex: PAT-0001"
            defaultValue={equipment?.patrimony || ""}
          />
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Classificacao e Status
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            id="criticality"
            name="criticality"
            label="Criticidade"
            options={[
              { value: "A", label: "1 - Critico" },
              { value: "B", label: "2 - Moderado" },
              { value: "C", label: "3 - Baixo" },
            ]}
            value={criticality}
            onChange={(e) => setCriticality(e.target.value)}
          />
          <Select
            id="status"
            name="status"
            label="Status"
            options={[
              { value: "ATIVO", label: "Ativo" },
              { value: "INATIVO", label: "Inativo" },
              { value: "EM_MANUTENCAO", label: "Em manutencao" },
              { value: "DESCARTADO", label: "Descartado" },
            ]}
            defaultValue={equipment?.status || "ATIVO"}
          />
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Propriedade
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tipo de Propriedade</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="ownershipType"
                  value="PROPRIO"
                  checked={ownershipType === "PROPRIO"}
                  onChange={(e) => setOwnershipType(e.target.value)}
                />
                Proprio
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="ownershipType"
                  value="COMODATO"
                  checked={ownershipType === "COMODATO"}
                  onChange={(e) => setOwnershipType(e.target.value)}
                />
                Comodato
              </label>
            </div>
          </div>
          {ownershipType === "COMODATO" && (
            <Input
              id="loanProvider"
              name="loanProvider"
              label="Fornecedor Comodato"
              placeholder="Nome do fornecedor"
              defaultValue={equipment?.loanProvider || ""}
            />
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Aquisicao
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="acquisitionDate"
            name="acquisitionDate"
            label="Data de Aquisicao"
            type="date"
            defaultValue={formatDate(equipment?.acquisitionDate ?? null)}
          />
          <Input
            id="acquisitionValue"
            name="acquisitionValue"
            label="Valor de Aquisicao (R$)"
            type="number"
            step="0.01"
            min="0"
            placeholder="Ex: 45000.00"
            defaultValue={equipment?.acquisitionValue?.toString() || ""}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" loading={isPending}>
          {equipment ? "Salvar Alteracoes" : "Cadastrar Equipamento"}
        </Button>
        <Link href="/equipamentos">
          <Button type="button" variant="secondary">
            Cancelar
          </Button>
        </Link>
      </div>
    </form>
  );
}
