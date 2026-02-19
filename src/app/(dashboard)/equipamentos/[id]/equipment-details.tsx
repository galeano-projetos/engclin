"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EquipmentForm } from "../equipment-form";
import { updateEquipmentAction, deleteEquipment } from "../actions";
import { QrCodeSection } from "./qr-code-section";
import { criticalityDisplay } from "@/lib/utils/periodicity";
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
  equipmentTypeId: string | null;
  equipmentTypeName: string | null;
  ownershipType: string;
  loanProvider: string | null;
  vidaUtilAnos: number | null;
  metodoDepreciacao: string;
  valorResidual: number | null;
  contingencyPlan: string | null;
}

interface Unit {
  id: string;
  name: string;
}

interface EquipmentTypeOption {
  id: string;
  name: string;
  defaultCriticality: string;
}

interface EquipmentDetailsProps {
  equipment: SerializedEquipment;
  units: Unit[];
  equipmentTypes?: EquipmentTypeOption[];
  canEdit?: boolean;
  canDelete?: boolean;
  showQrCode?: boolean;
  plan?: string;
}

const statusLabels: Record<string, string> = {
  ATIVO: "Ativo",
  INATIVO: "Inativo",
  EM_MANUTENCAO: "Em manutencao",
  DESCARTADO: "Descartado",
};

const statusVariant: Record<string, "success" | "muted" | "info" | "danger"> = {
  ATIVO: "success",
  INATIVO: "muted",
  EM_MANUTENCAO: "info",
  DESCARTADO: "danger",
};

const ownershipLabels: Record<string, string> = {
  PROPRIO: "Proprio",
  COMODATO: "Comodato",
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
  equipmentTypes = [],
  canEdit = false,
  canDelete = false,
  showQrCode = true,
  plan,
}: EquipmentDetailsProps) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const crit = equipment.criticality as "A" | "B" | "C";
  const critInfo = criticalityDisplay[crit] || { label: crit, variant: "muted" as const };

  async function handleDelete() {
    const reason = prompt("Motivo do descarte (opcional):");
    if (reason === null) return; // cancelled
    setDeleting(true);
    await deleteEquipment(equipment.id, reason || undefined);
  }

  if (editing) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Editar Equipamento
          </h1>
          <Button variant="secondary" onClick={() => setEditing(false)}>
            Cancelar Edicao
          </Button>
        </div>
        <EquipmentForm
          units={units}
          equipmentTypes={equipmentTypes}
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
            equipmentTypeId: equipment.equipmentTypeId,
            ownershipType: equipment.ownershipType,
            loanProvider: equipment.loanProvider,
            vidaUtilAnos: equipment.vidaUtilAnos,
            metodoDepreciacao: equipment.metodoDepreciacao,
            valorResidual: equipment.valorResidual,
            contingencyPlan: equipment.contingencyPlan,
          }}
          action={updateEquipmentAction}
          plan={plan}
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
            Informacoes do Equipamento
          </h2>
        </div>
        <dl className="divide-y px-6">
          <InfoRow label="Nome" value={equipment.name} />
          <InfoRow label="Marca" value={equipment.brand} />
          <InfoRow label="Modelo" value={equipment.model} />
          <InfoRow label="Numero de Serie" value={equipment.serialNumber} />
          <InfoRow label="Patrimonio" value={equipment.patrimony} />
          <InfoRow label="Setor" value={equipment.unitName} />
          {equipment.equipmentTypeName && (
            <InfoRow label="Tipo de Equipamento" value={equipment.equipmentTypeName} />
          )}
          <InfoRow
            label="Criticidade"
            value={
              <Badge variant={critInfo.variant}>
                {critInfo.label}
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
            label="Propriedade"
            value={ownershipLabels[equipment.ownershipType] || equipment.ownershipType}
          />
          {equipment.ownershipType === "COMODATO" && equipment.loanProvider && (
            <InfoRow label="Fornecedor Comodato" value={equipment.loanProvider} />
          )}
          {equipment.criticality === "A" && equipment.contingencyPlan && (
            <InfoRow
              label="Plano de Contingencia"
              value={
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  {equipment.contingencyPlan}
                </div>
              }
            />
          )}
          <InfoRow
            label="Data de Aquisicao"
            value={
              equipment.acquisitionDate
                ? new Date(equipment.acquisitionDate).toLocaleDateString(
                    "pt-BR"
                  )
                : null
            }
          />
          <InfoRow
            label="Valor de Aquisicao"
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
      {showQrCode && (
        <QrCodeSection
          equipmentId={equipment.id}
          equipmentName={equipment.name}
          brand={equipment.brand}
          model={equipment.model}
          serialNumber={equipment.serialNumber}
          patrimony={equipment.patrimony}
          unitName={equipment.unitName}
        />
      )}
    </div>
  );
}
