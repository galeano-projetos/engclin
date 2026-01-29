"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EquipmentForm } from "../equipment-form";
import { updateEquipmentAction, deleteEquipment } from "../actions";
import { QrCodeSection } from "./qr-code-section";
import Link from "next/link";

interface SerializedEquipment {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  patrimony: string | null;
  unitId: string;
  unitName: string;
  criticality: string;
  status: string;
  acquisitionDate: string | null;
  acquisitionValue: number | null;
  createdAt: string;
  updatedAt: string;
}

interface Unit {
  id: string;
  name: string;
}

interface EquipmentDetailsProps {
  equipment: SerializedEquipment;
  units: Unit[];
  canEdit?: boolean;
  canDelete?: boolean;
}

const criticalityVariant = {
  A: "danger",
  B: "warning",
  C: "success",
} as const;

const criticalityLabel = {
  A: "A — Alta",
  B: "B — Média",
  C: "C — Baixa",
} as const;

const statusLabels: Record<string, string> = {
  ATIVO: "Ativo",
  INATIVO: "Inativo",
  EM_MANUTENCAO: "Em manutenção",
  DESCARTADO: "Descartado",
};

const statusVariant: Record<string, "success" | "muted" | "info" | "danger"> = {
  ATIVO: "success",
  INATIVO: "muted",
  EM_MANUTENCAO: "info",
  DESCARTADO: "danger",
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

export function EquipmentDetails({
  equipment,
  units,
  canEdit = false,
  canDelete = false,
}: EquipmentDetailsProps) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const crit = equipment.criticality as "A" | "B" | "C";

  async function handleDelete() {
    if (!confirm("Deseja realmente descartar este equipamento?")) return;
    setDeleting(true);
    await deleteEquipment(equipment.id);
  }

  if (editing) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Editar Equipamento
          </h1>
          <Button variant="secondary" onClick={() => setEditing(false)}>
            Cancelar Edição
          </Button>
        </div>
        <EquipmentForm
          units={units}
          equipment={{
            id: equipment.id,
            name: equipment.name,
            brand: equipment.brand,
            model: equipment.model,
            serialNumber: equipment.serialNumber,
            patrimony: equipment.patrimony,
            unitId: equipment.unitId,
            criticality: equipment.criticality,
            status: equipment.status,
            acquisitionDate: equipment.acquisitionDate
              ? new Date(equipment.acquisitionDate)
              : null,
            acquisitionValue: equipment.acquisitionValue,
          }}
          action={updateEquipmentAction}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/equipamentos"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            &larr; Voltar para equipamentos
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            {equipment.name}
          </h1>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button variant="secondary" onClick={() => setEditing(true)}>
              Editar
            </Button>
          )}
          {canDelete && equipment.status !== "DESCARTADO" && (
            <Button
              variant="danger"
              loading={deleting}
              onClick={handleDelete}
            >
              Descartar
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-lg border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Informações do Equipamento
          </h2>
        </div>
        <dl className="divide-y px-6">
          <InfoRow label="Nome" value={equipment.name} />
          <InfoRow label="Marca" value={equipment.brand} />
          <InfoRow label="Modelo" value={equipment.model} />
          <InfoRow label="Número de Série" value={equipment.serialNumber} />
          <InfoRow label="Patrimônio" value={equipment.patrimony} />
          <InfoRow label="Setor" value={equipment.unitName} />
          <InfoRow
            label="Criticidade"
            value={
              <Badge variant={criticalityVariant[crit]}>
                {criticalityLabel[crit]}
              </Badge>
            }
          />
          <InfoRow
            label="Status"
            value={
              <Badge variant={statusVariant[equipment.status]}>
                {statusLabels[equipment.status]}
              </Badge>
            }
          />
          <InfoRow
            label="Data de Aquisição"
            value={
              equipment.acquisitionDate
                ? new Date(equipment.acquisitionDate).toLocaleDateString(
                    "pt-BR"
                  )
                : null
            }
          />
          <InfoRow
            label="Valor de Aquisição"
            value={
              equipment.acquisitionValue != null
                ? `R$ ${equipment.acquisitionValue.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}`
                : null
            }
          />
        </dl>
      </div>

      {/* QR Code */}
      <QrCodeSection
        equipmentId={equipment.id}
        equipmentName={equipment.name}
        patrimony={equipment.patrimony}
        unitName={equipment.unitName}
      />

      {/* Placeholder para histórico */}
      <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
        <p className="text-gray-400">
          Histórico de manutenções preventivas e corretivas será exibido aqui.
        </p>
      </div>
    </div>
  );
}
