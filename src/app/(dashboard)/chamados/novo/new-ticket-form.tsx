"use client";

import { useActionState, useState } from "react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createTicketAction } from "../actions";
import Link from "next/link";

interface Equipment {
  id: string;
  name: string;
  patrimony: string | null;
  criticality: string;
  contingencyPlan: string | null;
}

interface NewTicketFormProps {
  equipments: Equipment[];
  defaultEquipmentId?: string;
}

const criticalityLabels: Record<string, string> = {
  A: "Critico",
  B: "Moderado",
  C: "Baixo",
};

const slaLabels: Record<string, string> = {
  A: "10 minutos",
  B: "2 horas",
  C: "24 horas",
};

export function NewTicketForm({ equipments, defaultEquipmentId }: NewTicketFormProps) {
  const [state, formAction, isPending] = useActionState(createTicketAction, undefined);
  const [selectedId, setSelectedId] = useState(defaultEquipmentId || "");

  const selectedEquipment = equipments.find((eq) => eq.id === selectedId);

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
              label: `${eq.name}${eq.patrimony ? ` (${eq.patrimony})` : ""} [${criticalityLabels[eq.criticality]}]`,
            }))}
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            required
          />
          <Select
            id="urgency"
            name="urgency"
            label="Urgencia"
            options={[
              { value: "BAIXA", label: "Baixa" },
              { value: "MEDIA", label: "Media" },
              { value: "ALTA", label: "Alta" },
              { value: "CRITICA", label: "Critica" },
            ]}
            defaultValue="MEDIA"
          />

          {/* SLA info based on selected equipment */}
          {selectedEquipment && (
            <div className="sm:col-span-2 rounded-md border border-blue-200 bg-blue-50 p-3">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Criticidade:</span>{" "}
                {criticalityLabels[selectedEquipment.criticality]} —{" "}
                <span className="font-semibold">SLA:</span> Primeiro atendimento em ate{" "}
                {slaLabels[selectedEquipment.criticality]}
              </p>
            </div>
          )}

          {/* Contingency plan alert for critical equipment */}
          {selectedEquipment?.criticality === "A" && selectedEquipment.contingencyPlan && (
            <div className="sm:col-span-2 rounded-md border border-red-300 bg-red-50 p-3">
              <div className="flex items-start gap-2">
                <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-red-800">Plano de Contingencia</p>
                  <p className="mt-1 text-sm text-red-700">{selectedEquipment.contingencyPlan}</p>
                </div>
              </div>
            </div>
          )}

          <div className="sm:col-span-2">
            <label
              htmlFor="description"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Descricao do Problema *
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
