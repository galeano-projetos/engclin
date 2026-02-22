"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { createPhysicsTestAction } from "../actions";
import Link from "next/link";

interface Equipment {
  id: string;
  name: string;
  patrimony: string | null;
}

export function NewPhysicsTestForm({
  equipments,
}: {
  equipments: Equipment[];
}) {
  const [state, formAction, isPending] = useActionState(createPhysicsTestAction, undefined);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Dados do Teste
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Combobox
            id="equipmentId"
            name="equipmentId"
            label="Equipamento *"
            placeholder="Buscar equipamento..."
            options={equipments.map((eq) => ({
              value: eq.id,
              label: `${eq.name}${eq.patrimony ? ` (${eq.patrimony})` : ""}`,
            }))}
            required
          />
          <Select
            id="type"
            name="type"
            label="Tipo de Teste *"
            placeholder="Selecione o tipo"
            options={[
              { value: "CONTROLE_QUALIDADE", label: "Controle de Qualidade" },
              { value: "TESTE_CONSTANCIA", label: "Teste de Constância" },
              {
                value: "LEVANTAMENTO_RADIOMETRICO",
                label: "Levantamento Radiométrico",
              },
              {
                value: "TESTE_RADIACAO_FUGA",
                label: "Teste de Radiação de Fuga",
              },
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
          <Input
            id="provider"
            name="provider"
            label="Empresa de Física Médica"
            placeholder="Ex: Seprorad"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" loading={isPending}>
          Cadastrar Teste
        </Button>
        <Link href="/fisica-medica">
          <Button type="button" variant="secondary">
            Cancelar
          </Button>
        </Link>
      </div>
    </form>
  );
}
