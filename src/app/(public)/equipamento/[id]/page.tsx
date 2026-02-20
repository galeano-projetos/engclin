import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ReportForm } from "./report-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const equipment = await prisma.equipment.findUnique({
    where: { id },
    select: { name: true },
  });

  return {
    title: equipment
      ? `${equipment.name} — Vitalis`
      : "Equipamento não encontrado",
  };
}

export default async function PublicEquipmentPage({ params }: PageProps) {
  const { id } = await params;

  const equipment = await prisma.equipment.findUnique({
    where: { id },
    omit: { photoData: true },
    include: {
      unit: { select: { name: true } },
      preventiveMaintenances: {
        where: { status: { in: ["AGENDADA", "REALIZADA"] } },
        orderBy: { dueDate: "desc" },
        take: 1,
        select: {
          type: true,
          status: true,
          dueDate: true,
          executionDate: true,
        },
      },
    },
  });

  const statusLabels: Record<string, string> = {
    ATIVO: "Ativo",
    INATIVO: "Inativo",
    EM_MANUTENCAO: "Em manutenção",
    DESCARTADO: "Descartado",
  };

  const criticalityLabels: Record<string, string> = {
    A: "Alta",
    B: "Moderada",
    C: "Baixa",
  };

  if (!equipment) {
    notFound();
  }

  // Determinar status da calibração
  const lastCalibration = equipment.preventiveMaintenances[0];
  const now = new Date();

  let calibrationStatus: "em_dia" | "vencida" | "sem_registro";
  let calibrationLabel: string;
  let calibrationDate: string | null = null;

  if (!lastCalibration) {
    calibrationStatus = "sem_registro";
    calibrationLabel = "Sem registro de calibração";
  } else if (
    lastCalibration.status === "REALIZADA" &&
    lastCalibration.dueDate >= now
  ) {
    calibrationStatus = "em_dia";
    calibrationLabel = "Calibração em dia";
    calibrationDate = lastCalibration.dueDate.toLocaleDateString("pt-BR");
  } else if (lastCalibration.dueDate < now) {
    calibrationStatus = "vencida";
    calibrationLabel = "Calibração vencida";
    calibrationDate = lastCalibration.dueDate.toLocaleDateString("pt-BR");
  } else {
    calibrationStatus = "em_dia";
    calibrationLabel = "Calibração agendada";
    calibrationDate = lastCalibration.dueDate.toLocaleDateString("pt-BR");
  }

  const statusColors = {
    em_dia: "bg-green-100 text-green-800 border-green-300",
    vencida: "bg-red-100 text-red-800 border-red-300",
    sem_registro: "bg-gray-100 text-gray-600 border-gray-300",
  };

  const statusIcons = {
    em_dia: (
      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    vencida: (
      <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    sem_registro: (
      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
      </svg>
    ),
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-6 text-center">
          <p className="text-lg font-bold text-blue-600">Vitalis</p>
          <p className="text-xs text-gray-400">
            Consulta pública de equipamento
          </p>
        </div>

        <div className="rounded-xl bg-white shadow-lg">
          {/* Foto do equipamento */}
          {equipment.photoMimeType ? (
            <div className="flex h-48 items-center justify-center overflow-hidden rounded-t-xl bg-gray-100">
              <img
                src={`/api/equipment/${equipment.id}/photo`}
                alt={equipment.name}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-t-xl bg-gray-100">
              <svg
                className="h-20 w-20 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25a1.5 1.5 0 001.5 1.5z"
                />
              </svg>
            </div>
          )}

          {/* Informações */}
          <div className="p-6">
            <h1 className="text-xl font-bold text-gray-900">
              {equipment.name}
            </h1>

            <dl className="mt-4 space-y-3">
              {equipment.model && (
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Modelo</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {equipment.brand && `${equipment.brand} `}
                    {equipment.model}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Setor</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {equipment.unit.name}
                </dd>
              </div>
              {equipment.patrimony && (
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Patrimônio</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {equipment.patrimony}
                  </dd>
                </div>
              )}
              {equipment.serialNumber && (
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Nº de Série</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {equipment.serialNumber}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Status</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {statusLabels[equipment.status] ?? equipment.status}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Criticidade</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {criticalityLabels[equipment.criticality] ?? equipment.criticality}
                </dd>
              </div>
            </dl>

            {/* Status da calibração */}
            <div
              className={`mt-6 flex items-center gap-3 rounded-lg border p-4 ${statusColors[calibrationStatus]}`}
            >
              {statusIcons[calibrationStatus]}
              <div>
                <p className="font-semibold">{calibrationLabel}</p>
                {calibrationDate && (
                  <p className="text-sm opacity-75">
                    {calibrationStatus === "vencida"
                      ? `Venceu em ${calibrationDate}`
                      : `Válido até ${calibrationDate}`}
                  </p>
                )}
              </div>
            </div>

            {/* Formulário Reportar Problema (público, sem login) */}
            <ReportForm equipmentId={equipment.id} />
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Informações gerenciadas pelo sistema Vitalis
        </p>
      </div>
    </div>
  );
}
