"use client";

import { useActionState } from "react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createNonConformity } from "../actions";
import Link from "next/link";

export function NewNonConformityForm() {
  const [state, formAction, isPending] = useActionState(createNonConformity, undefined);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Dados da Nao Conformidade
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label
              htmlFor="title"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Titulo *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              placeholder="Titulo da nao conformidade..."
              className="block w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
            />
          </div>

          <Select
            id="source"
            name="source"
            label="Origem *"
            placeholder="Selecione..."
            options={[
              { value: "AUDITORIA_INTERNA", label: "Auditoria Interna" },
              { value: "AUDITORIA_EXTERNA", label: "Auditoria Externa" },
              { value: "CHAMADO_RECORRENTE", label: "Chamado Recorrente" },
              { value: "CHECKLIST_NAO_CONFORME", label: "Checklist Nao Conforme" },
              { value: "EVENTO_ADVERSO", label: "Evento Adverso" },
              { value: "INDICADOR_FORA_META", label: "Indicador Fora da Meta" },
              { value: "RECLAMACAO", label: "Reclamacao" },
              { value: "OUTRO", label: "Outro" },
            ]}
            required
          />

          <Select
            id="severity"
            name="severity"
            label="Severidade *"
            placeholder="Selecione..."
            options={[
              { value: "MENOR", label: "Menor" },
              { value: "MAIOR", label: "Maior" },
              { value: "CRITICA", label: "Critica" },
            ]}
            required
          />

          <div className="sm:col-span-2">
            <label
              htmlFor="description"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Descricao *
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              required
              placeholder="Descreva detalhadamente a nao conformidade identificada..."
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" loading={isPending}>
          Registrar NC
        </Button>
        <Link href="/melhoria">
          <Button type="button" variant="secondary">
            Cancelar
          </Button>
        </Link>
      </div>
    </form>
  );
}
