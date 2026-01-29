"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Unit {
  id: string;
  name: string;
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
}

interface EquipmentFormProps {
  units: Unit[];
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
  equipment,
  action,
}: EquipmentFormProps) {
  const [state, formAction, isPending] = useActionState(action, undefined);

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
          Informações Básicas
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="name"
            name="name"
            label="Nome do Equipamento *"
            placeholder="Ex: Monitor Multiparâmetro"
            defaultValue={equipment?.name}
            required
          />
          <Select
            id="unitId"
            name="unitId"
            label="Setor / Localização *"
            placeholder="Selecione o setor"
            options={units.map((u) => ({ value: u.id, label: u.name }))}
            defaultValue={equipment?.unitId}
            required
          />
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
            label="Número de Série"
            placeholder="Ex: SN-001234"
            defaultValue={equipment?.serialNumber || ""}
          />
          <Input
            id="patrimony"
            name="patrimony"
            label="Patrimônio"
            placeholder="Ex: PAT-0001"
            defaultValue={equipment?.patrimony || ""}
          />
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Classificação e Status
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            id="criticality"
            name="criticality"
            label="Criticidade"
            options={[
              { value: "A", label: "A — Alta" },
              { value: "B", label: "B — Média" },
              { value: "C", label: "C — Baixa" },
            ]}
            defaultValue={equipment?.criticality || "C"}
          />
          <Select
            id="status"
            name="status"
            label="Status"
            options={[
              { value: "ATIVO", label: "Ativo" },
              { value: "INATIVO", label: "Inativo" },
              { value: "EM_MANUTENCAO", label: "Em manutenção" },
              { value: "DESCARTADO", label: "Descartado" },
            ]}
            defaultValue={equipment?.status || "ATIVO"}
          />
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Aquisição
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="acquisitionDate"
            name="acquisitionDate"
            label="Data de Aquisição"
            type="date"
            defaultValue={formatDate(equipment?.acquisitionDate ?? null)}
          />
          <Input
            id="acquisitionValue"
            name="acquisitionValue"
            label="Valor de Aquisição (R$)"
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
          {equipment ? "Salvar Alterações" : "Cadastrar Equipamento"}
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
