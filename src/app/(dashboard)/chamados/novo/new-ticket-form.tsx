"use client";

import { useActionState } from "react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createTicketAction } from "../actions";
import Link from "next/link";

interface Equipment {
  id: string;
  name: string;
  patrimony: string | null;
}

interface NewTicketFormProps {
  equipments: Equipment[];
  defaultEquipmentId?: string;
}

export function NewTicketForm({ equipments, defaultEquipmentId }: NewTicketFormProps) {
  const [state, formAction, isPending] = useActionState(createTicketAction, undefined);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Dados do Chamado
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
            defaultValue={defaultEquipmentId}
            required
          />
          <Select
            id="urgency"
            name="urgency"
            label="Urgência"
            options={[
              { value: "BAIXA", label: "Baixa" },
              { value: "MEDIA", label: "Média" },
              { value: "ALTA", label: "Alta" },
              { value: "CRITICA", label: "Crítica" },
            ]}
            defaultValue="MEDIA"
          />
          <div className="sm:col-span-2">
            <label
              htmlFor="description"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Descrição do Problema *
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              required
              placeholder="Descreva o problema observado no equipamento..."
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" loading={isPending}>
          Abrir Chamado
        </Button>
        <Link href="/chamados">
          <Button type="button" variant="secondary">
            Cancelar
          </Button>
        </Link>
      </div>
    </form>
  );
}
