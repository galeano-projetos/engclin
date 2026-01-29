"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createPreventiveAction } from "../actions";
import Link from "next/link";

interface Equipment {
  id: string;
  name: string;
  patrimony: string | null;
}

interface NewPreventiveFormProps {
  equipments: Equipment[];
}

export function NewPreventiveForm({ equipments }: NewPreventiveFormProps) {
  const [state, formAction, isPending] = useActionState(createPreventiveAction, undefined);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Dados da Manutenção
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            id="equipmentId"
            name="equipmentId"
            label="Equipamento *"
            placeholder="Selecione o equipamento"
            options={equipments.map((eq) => ({
              value: eq.id,
              label: `${eq.name}${eq.patrimony ? ` (${eq.patrimony})` : ""}`,
            }))}
            required
          />
          <Select
            id="type"
            name="type"
            label="Tipo de Manutenção *"
            placeholder="Selecione o tipo"
            options={[
              { value: "Calibração", label: "Calibração" },
              { value: "Teste de Segurança Elétrica", label: "Teste de Segurança Elétrica" },
              { value: "Qualificação Térmica", label: "Qualificação Térmica" },
              { value: "Manutenção Preventiva Geral", label: "Manutenção Preventiva Geral" },
            ]}
            required
          />
          <Input
            id="scheduledDate"
            name="scheduledDate"
            label="Data Agendada *"
            type="date"
            required
          />
          <Input
            id="dueDate"
            name="dueDate"
            label="Data de Vencimento *"
            type="date"
            required
          />
          <Select
            id="periodicityMonths"
            name="periodicityMonths"
            label="Periodicidade"
            options={[
              { value: "3", label: "Trimestral (3 meses)" },
              { value: "6", label: "Semestral (6 meses)" },
              { value: "12", label: "Anual (12 meses)" },
              { value: "24", label: "Bienal (24 meses)" },
            ]}
            defaultValue="12"
          />
          <Input
            id="provider"
            name="provider"
            label="Fornecedor / Empresa"
            placeholder="Ex: LabCal Calibrações"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" loading={isPending}>
          Agendar Manutenção
        </Button>
        <Link href="/manutencoes">
          <Button type="button" variant="secondary">
            Cancelar
          </Button>
        </Link>
      </div>
    </form>
  );
}
