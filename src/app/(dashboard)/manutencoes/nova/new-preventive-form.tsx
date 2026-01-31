"use client";

import { useActionState, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createPreventiveAction } from "../actions";
import Link from "next/link";

interface Equipment {
  id: string;
  name: string;
  patrimony: string | null;
  equipmentTypeId: string | null;
}

interface ProviderOption {
  id: string;
  name: string;
}

interface NewPreventiveFormProps {
  equipments: Equipment[];
  providers: ProviderOption[];
}

const serviceTypeOptions = [
  { value: "PREVENTIVA", label: "Preventiva" },
  { value: "CALIBRACAO", label: "Calibracao" },
  { value: "TSE", label: "Teste de Seguranca Eletrica" },
];

const periodicityOptions = [
  { value: "3", label: "Trimestral (3 meses)" },
  { value: "6", label: "Semestral (6 meses)" },
  { value: "12", label: "Anual (12 meses)" },
  { value: "24", label: "Bienal (24 meses)" },
  { value: "60", label: "Quinquenal (60 meses)" },
];

export function NewPreventiveForm({ equipments, providers }: NewPreventiveFormProps) {
  const [state, formAction, isPending] = useActionState(createPreventiveAction, undefined);
  const [scheduledDate, setScheduledDate] = useState("");
  const [periodicityMonths, setPeriodicityMonths] = useState("12");

  const computedDueDate = useMemo(() => {
    if (!scheduledDate) return "";
    const d = new Date(scheduledDate);
    d.setMonth(d.getMonth() + parseInt(periodicityMonths));
    return d.toISOString().split("T")[0];
  }, [scheduledDate, periodicityMonths]);

  const providerOptions = providers.map((p) => ({ value: p.id, label: p.name }));

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Dados da Manutencao
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
            id="serviceType"
            name="serviceType"
            label="Tipo de Servico *"
            placeholder="Selecione o tipo"
            options={serviceTypeOptions}
            required
          />
          <Input
            id="scheduledDate"
            name="scheduledDate"
            label="Data Agendada *"
            type="date"
            required
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
          />
          <Input
            id="dueDate"
            name="dueDate"
            label="Data de Vencimento *"
            type="date"
            required
            value={computedDueDate}
            onChange={() => {/* allow manual override via the input */}}
          />
          <Select
            id="periodicityMonths"
            name="periodicityMonths"
            label="Periodicidade"
            options={periodicityOptions}
            value={periodicityMonths}
            onChange={(e) => setPeriodicityMonths(e.target.value)}
          />
          <Select
            id="providerId"
            name="providerId"
            label="Fornecedor"
            placeholder="Selecione o fornecedor"
            options={providerOptions}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" loading={isPending}>
          Agendar Manutencao
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
