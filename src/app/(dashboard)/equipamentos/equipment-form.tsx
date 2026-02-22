"use client";

import { useActionState, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
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
  anvisaRegistry: string | null;
  patrimony: string | null;
  unitId: string;
  criticality: string;
  status: string;
  acquisitionDate: Date | null;
  acquisitionValue: number | null;
  equipmentTypeId: string | null;
  ownershipType: string;
  loanProvider: string | null;
  vidaUtilAnos: number | null;
  metodoDepreciacao: string;
  valorResidual: number | null;
  contingencyPlan: string | null;
}

interface EquipmentFormProps {
  units: Unit[];
  equipmentTypes?: EquipmentTypeOption[];
  equipment?: EquipmentData;
  action: (
    state: { error?: string } | undefined,
    formData: FormData
  ) => Promise<{ error?: string } | undefined>;
  plan?: string;
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
  plan,
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
          <Combobox
            id="unitId"
            name="unitId"
            label="Setor / Localizacao *"
            placeholder="Buscar setor..."
            options={units.map((u) => ({ value: u.id, label: u.name }))}
            defaultValue={equipment?.unitId}
            required
          />
          {equipmentTypes.length > 0 && (
            <Combobox
              id="equipmentTypeId"
              name="equipmentTypeId"
              label="Tipo de Equipamento"
              placeholder="Buscar tipo..."
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
            id="anvisaRegistry"
            name="anvisaRegistry"
            label="Registro ANVISA"
            placeholder="Ex: 80000000001"
            defaultValue={equipment?.anvisaRegistry || ""}
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
          {criticality === "A" && (
            <>
              <div className="sm:col-span-2 rounded-md border border-amber-300 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Equipamento Critico</p>
                    <p className="mt-1 text-sm text-amber-700">
                      Equipamentos de criticidade A devem ter um plano de manutencao preventiva obrigatoriamente associado. Certifique-se de cadastrar as preventivas apos salvar.
                    </p>
                  </div>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="contingencyPlan"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Plano de Contingencia *
                </label>
                <textarea
                  id="contingencyPlan"
                  name="contingencyPlan"
                  rows={3}
                  required
                  placeholder="Ex: Em caso de falha, usar equipamento reserva do Setor Y. Contatar fornecedor Z no telefone (11) 9999-0000."
                  defaultValue={equipment?.contingencyPlan || ""}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Descreva o que fazer em caso de falha deste equipamento critico.
                </p>
              </div>
            </>
          )}
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
          {plan === "ENTERPRISE" ? (
            <>
              <Input
                id="vidaUtilAnos"
                name="vidaUtilAnos"
                label="Vida Util (anos)"
                type="number"
                min="1"
                max="50"
                placeholder="Ex: 10"
                defaultValue={equipment?.vidaUtilAnos?.toString() || "10"}
              />
              <Select
                id="metodoDepreciacao"
                name="metodoDepreciacao"
                label="Metodo de Depreciacao"
                options={[
                  { value: "LINEAR", label: "Linear" },
                  { value: "ACELERADA", label: "Acelerada" },
                ]}
                defaultValue={equipment?.metodoDepreciacao || "LINEAR"}
              />
              <Input
                id="valorResidual"
                name="valorResidual"
                label="Valor Residual (R$)"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 0.00"
                defaultValue={equipment?.valorResidual?.toString() || ""}
              />
            </>
          ) : (
            <div className="sm:col-span-2 rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-500">
              Controle de depreciacao disponivel no plano Enterprise.
            </div>
          )}
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
