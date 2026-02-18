"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createTraining } from "./actions";

interface TrainingItem {
  id: string;
  title: string;
  description: string | null;
  equipmentTypeName: string | null;
  equipmentTypeId: string | null;
  validityMonths: number;
  hasVideo: boolean;
  completionCount: number;
  userStatus: "pending" | "valid" | "expired";
  completedAt: string | null;
  expiresAt: string | null;
}

interface Props {
  trainings: TrainingItem[];
  equipmentTypes: { id: string; name: string }[];
  canCreate: boolean;
  currentFilters: { equipmentTypeId: string; status: string };
}

export function TrainingList({
  trainings,
  equipmentTypes,
  canCreate,
  currentFilters,
}: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleFilter(key: string, value: string) {
    const params = new URLSearchParams();
    const filters = { ...currentFilters, [key]: value };
    if (filters.equipmentTypeId)
      params.set("equipmentTypeId", filters.equipmentTypeId);
    if (filters.status) params.set("status", filters.status);
    router.push(`/treinamentos?${params.toString()}`);
  }

  async function handleCreate(formData: FormData) {
    setSaving(true);
    setError("");
    const result = await createTraining(formData);
    if (result.error) {
      setError(result.error);
    } else {
      setShowForm(false);
    }
    setSaving(false);
  }

  return (
    <div className="mt-6 space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="rounded-md border px-3 py-2 text-sm"
          value={currentFilters.equipmentTypeId}
          onChange={(e) => handleFilter("equipmentTypeId", e.target.value)}
        >
          <option value="">Todos os tipos</option>
          {equipmentTypes.map((et) => (
            <option key={et.id} value={et.id}>
              {et.name}
            </option>
          ))}
        </select>

        <select
          className="rounded-md border px-3 py-2 text-sm"
          value={currentFilters.status}
          onChange={(e) => handleFilter("status", e.target.value)}
        >
          <option value="">Todos</option>
          <option value="concluido">Concluidos</option>
          <option value="pendente">Pendentes</option>
        </select>

        {canCreate && (
          <Button
            variant="secondary"
            onClick={() => setShowForm(!showForm)}
            className="ml-auto"
          >
            {showForm ? "Cancelar" : "Novo Treinamento"}
          </Button>
        )}
      </div>

      {/* Formulario de criacao */}
      {showForm && canCreate && (
        <div className="rounded-lg border bg-blue-50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            Novo Treinamento
          </h3>
          <form action={handleCreate} className="space-y-3">
            <Input
              id="title"
              name="title"
              label="Titulo *"
              placeholder="Ex: Seguranca Eletrica - Desfibriladores"
              required
            />
            <div>
              <label
                htmlFor="description"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Descricao
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Descricao do conteudo do treinamento..."
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="equipmentTypeId"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Tipo de Equipamento
                </label>
                <select
                  id="equipmentTypeId"
                  name="equipmentTypeId"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="">Geral (sem tipo)</option>
                  {equipmentTypes.map((et) => (
                    <option key={et.id} value={et.id}>
                      {et.name}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                id="videoUrl"
                name="videoUrl"
                label="URL do Video"
                placeholder="https://youtube.com/watch?v=..."
              />
              <Input
                id="validityMonths"
                name="validityMonths"
                label="Validade (meses)"
                type="number"
                defaultValue="12"
                min="1"
                max="120"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" loading={saving}>
              Criar Treinamento
            </Button>
          </form>
        </div>
      )}

      {/* Lista */}
      {trainings.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-400">
          Nenhum treinamento encontrado.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trainings.map((t) => (
            <Link key={t.id} href={`/treinamentos/${t.id}`}>
              <div className="rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {t.title}
                  </h3>
                  <StatusBadge
                    status={t.userStatus}
                    expiresAt={t.expiresAt}
                  />
                </div>
                {t.description && (
                  <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                    {t.description}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  {t.equipmentTypeName && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5">
                      {t.equipmentTypeName}
                    </span>
                  )}
                  <span>Validade: {t.validityMonths} meses</span>
                  {t.hasVideo && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">
                      Video
                    </span>
                  )}
                </div>
                {t.userStatus !== "pending" && t.completedAt && (
                  <p className="mt-2 text-xs text-gray-400">
                    Concluido em {t.completedAt}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({
  status,
  expiresAt,
}: {
  status: "pending" | "valid" | "expired";
  expiresAt: string | null;
}) {
  if (status === "pending") {
    return <Badge variant="muted">Pendente</Badge>;
  }
  if (status === "valid") {
    return (
      <Badge variant="success">
        Valido ate {expiresAt}
      </Badge>
    );
  }
  return <Badge variant="danger">Vencido</Badge>;
}
