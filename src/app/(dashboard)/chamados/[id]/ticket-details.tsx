"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { acceptTicket, resolveTicket, closeTicket } from "../actions";
import Link from "next/link";

interface TicketData {
  id: string;
  description: string;
  urgency: string;
  status: string;
  diagnosis: string | null;
  solution: string | null;
  partsUsed: string | null;
  timeSpent: number | null;
  cost: number | null;
  openedAt: string;
  closedAt: string | null;
  equipmentName: string;
  equipmentId: string;
  equipmentPatrimony: string | null;
  openedByName: string;
  assignedToName: string | null;
}

const statusLabels: Record<string, string> = {
  ABERTO: "Aberto",
  EM_ATENDIMENTO: "Em atendimento",
  RESOLVIDO: "Resolvido",
  FECHADO: "Fechado",
};

const statusVariant: Record<string, "danger" | "warning" | "success" | "muted"> = {
  ABERTO: "danger",
  EM_ATENDIMENTO: "warning",
  RESOLVIDO: "success",
  FECHADO: "muted",
};

const urgencyLabels: Record<string, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  CRITICA: "Crítica",
};

const urgencyVariant: Record<string, "muted" | "info" | "warning" | "danger"> = {
  BAIXA: "muted",
  MEDIA: "info",
  ALTA: "warning",
  CRITICA: "danger",
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
        {value || "—"}
      </dd>
    </div>
  );
}

export function TicketDetails({ ticket }: { ticket: TicketData }) {
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleAccept() {
    setLoading(true);
    await acceptTicket(ticket.id);
    window.location.reload();
  }

  async function handleResolve(formData: FormData) {
    setLoading(true);
    await resolveTicket(ticket.id, formData);
  }

  async function handleClose() {
    setLoading(true);
    await closeTicket(ticket.id);
    window.location.reload();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/chamados"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            &larr; Voltar para chamados
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            Chamado — {ticket.equipmentName}
          </h1>
          <p className="text-sm text-gray-500">
            Aberto por {ticket.openedByName} em{" "}
            {new Date(ticket.openedAt).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <div className="flex gap-2">
          {ticket.status === "ABERTO" && (
            <Button loading={loading} onClick={handleAccept}>
              Aceitar Chamado
            </Button>
          )}
          {ticket.status === "EM_ATENDIMENTO" && (
            <Button
              onClick={() => setShowResolveForm(!showResolveForm)}
            >
              Resolver Chamado
            </Button>
          )}
          {ticket.status === "RESOLVIDO" && (
            <Button
              variant="secondary"
              loading={loading}
              onClick={handleClose}
            >
              Confirmar Fechamento
            </Button>
          )}
        </div>
      </div>

      {/* Formulário de resolução */}
      {showResolveForm && (
        <div className="mt-6 rounded-lg border bg-green-50 p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Resolver Chamado
          </h2>
          <form action={handleResolve} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="diagnosis"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Diagnóstico
                </label>
                <textarea
                  id="diagnosis"
                  name="diagnosis"
                  rows={2}
                  placeholder="O que foi identificado..."
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="solution"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Solução Aplicada *
                </label>
                <textarea
                  id="solution"
                  name="solution"
                  rows={3}
                  required
                  placeholder="Descreva o que foi feito para resolver..."
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Input
                id="partsUsed"
                name="partsUsed"
                label="Peças Utilizadas"
                placeholder="Ex: Sensor SpO2, cabo de força"
              />
              <Input
                id="timeSpent"
                name="timeSpent"
                label="Tempo Gasto (minutos)"
                type="number"
                min="0"
                placeholder="Ex: 120"
              />
              <Input
                id="cost"
                name="cost"
                label="Custo do Reparo (R$)"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 350.00"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" loading={loading}>
                Confirmar Resolução
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowResolveForm(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Detalhes do chamado */}
      <div className="mt-6 rounded-lg border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Informações do Chamado
          </h2>
        </div>
        <dl className="divide-y px-6">
          <InfoRow
            label="Equipamento"
            value={
              <Link
                href={`/equipamentos/${ticket.equipmentId}`}
                className="text-blue-600 hover:text-blue-800"
              >
                {ticket.equipmentName}
                {ticket.equipmentPatrimony &&
                  ` (${ticket.equipmentPatrimony})`}
              </Link>
            }
          />
          <InfoRow
            label="Status"
            value={
              <Badge variant={statusVariant[ticket.status]}>
                {statusLabels[ticket.status]}
              </Badge>
            }
          />
          <InfoRow
            label="Urgência"
            value={
              <Badge variant={urgencyVariant[ticket.urgency]}>
                {urgencyLabels[ticket.urgency]}
              </Badge>
            }
          />
          <InfoRow label="Descrição do Problema" value={ticket.description} />
          <InfoRow label="Aberto por" value={ticket.openedByName} />
          <InfoRow
            label="Data de Abertura"
            value={new Date(ticket.openedAt).toLocaleString("pt-BR")}
          />
          <InfoRow label="Técnico Responsável" value={ticket.assignedToName} />
        </dl>
      </div>

      {/* Detalhes da resolução */}
      {(ticket.status === "RESOLVIDO" || ticket.status === "FECHADO") && (
        <div className="mt-6 rounded-lg border bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Resolução
            </h2>
          </div>
          <dl className="divide-y px-6">
            <InfoRow label="Diagnóstico" value={ticket.diagnosis} />
            <InfoRow label="Solução Aplicada" value={ticket.solution} />
            <InfoRow label="Peças Utilizadas" value={ticket.partsUsed} />
            <InfoRow
              label="Tempo Gasto"
              value={
                ticket.timeSpent != null
                  ? `${ticket.timeSpent} minutos`
                  : null
              }
            />
            <InfoRow
              label="Custo"
              value={
                ticket.cost != null
                  ? `R$ ${ticket.cost.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}`
                  : null
              }
            />
            <InfoRow
              label="Data de Fechamento"
              value={
                ticket.closedAt
                  ? new Date(ticket.closedAt).toLocaleString("pt-BR")
                  : null
              }
            />
          </dl>
        </div>
      )}
    </div>
  );
}
