"use client";

import { useActionState } from "react";
import { Select } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { createAdverseEvent } from "../actions";
import Link from "next/link";

interface Equipment {
  id: string;
  name: string;
  patrimony: string | null;
}

interface NewAdverseEventFormProps {
  equipments: Equipment[];
}

export function NewAdverseEventForm({ equipments }: NewAdverseEventFormProps) {
  const [state, formAction, isPending] = useActionState(createAdverseEvent, undefined);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Dados do Evento
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

          <div>
            <label
              htmlFor="eventDate"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Data do Evento *
            </label>
            <input
              type="date"
              id="eventDate"
              name="eventDate"
              required
              className="block w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
            />
          </div>

          <Select
            id="severity"
            name="severity"
            label="Severidade *"
            placeholder="Selecione..."
            options={[
              { value: "LEVE", label: "Leve" },
              { value: "MODERADO", label: "Moderado" },
              { value: "GRAVE", label: "Grave" },
              { value: "OBITO", label: "Obito" },
            ]}
            required
          />

          <Select
            id="eventType"
            name="eventType"
            label="Tipo de Evento *"
            placeholder="Selecione..."
            options={[
              { value: "MAU_FUNCIONAMENTO", label: "Mau Funcionamento" },
              { value: "LESAO_PACIENTE", label: "Lesao ao Paciente" },
              { value: "LESAO_OPERADOR", label: "Lesao ao Operador" },
              { value: "QUASE_INCIDENTE", label: "Quase Incidente" },
              { value: "RECALL", label: "Recall" },
            ]}
            required
          />

          <div className="sm:col-span-2">
            <label
              htmlFor="description"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Descricao do Evento *
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              required
              placeholder="Descreva detalhadamente o evento adverso ocorrido..."
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" loading={isPending}>
          Registrar Evento
        </Button>
        <Link href="/tecnovigilancia">
          <Button type="button" variant="secondary">
            Cancelar
          </Button>
        </Link>
      </div>
    </form>
  );
}
