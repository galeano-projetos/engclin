"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { completeTraining, deleteTraining } from "../actions";
import { useRouter } from "next/navigation";

interface Props {
  training: {
    id: string;
    title: string;
    description: string | null;
    equipmentTypeName: string | null;
    videoUrl: string | null;
    embedUrl: string | null;
    validityMonths: number;
  };
  myStatus: "pending" | "valid" | "expired";
  myCompletedAt: string | null;
  myExpiresAt: string | null;
  canComplete: boolean;
  canManage: boolean;
  completions: {
    userId: string;
    userName: string;
    completedAt: string;
    expiresAt: string;
    status: "valid" | "expired";
  }[];
}

export function TrainingDetails({
  training,
  myStatus,
  myCompletedAt,
  myExpiresAt,
  canComplete,
  canManage,
  completions,
}: Props) {
  const router = useRouter();
  const [completing, setCompleting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleComplete() {
    setCompleting(true);
    await completeTraining(training.id);
    setCompleting(false);
  }

  async function handleDelete() {
    if (!confirm("Tem certeza que deseja excluir este treinamento?")) return;
    setDeleting(true);
    await deleteTraining(training.id);
    router.push("/treinamentos");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/treinamentos"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          &larr; Voltar para Treinamentos
        </Link>
        <div className="mt-2 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {training.title}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
              {training.equipmentTypeName && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                  {training.equipmentTypeName}
                </span>
              )}
              <span>Validade: {training.validityMonths} meses</span>
            </div>
          </div>
          {canManage && (
            <Button
              variant="ghost"
              onClick={handleDelete}
              loading={deleting}
              className="text-red-600 hover:text-red-800"
            >
              Excluir
            </Button>
          )}
        </div>
      </div>

      {/* Descricao */}
      {training.description && (
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-gray-900">
            Descricao
          </h2>
          <p className="whitespace-pre-wrap text-sm text-gray-600">
            {training.description}
          </p>
        </div>
      )}

      {/* Video */}
      {training.embedUrl && (
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">
            Video do Treinamento
          </h2>
          <div className="relative w-full overflow-hidden rounded-lg bg-black" style={{ paddingTop: "56.25%" }}>
            <iframe
              className="absolute inset-0 h-full w-full"
              src={training.embedUrl}
              title={training.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          {training.videoUrl && (
            <a
              href={training.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs text-blue-600 hover:text-blue-800"
            >
              Abrir video em nova aba
            </a>
          )}
        </div>
      )}

      {/* Status e Conclusao */}
      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">
          Meu Status
        </h2>

        {myStatus === "pending" && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="muted">Pendente</Badge>
              <span className="text-sm text-gray-500">
                Voce ainda nao concluiu este treinamento.
              </span>
            </div>
            {canComplete && (
              <Button onClick={handleComplete} loading={completing}>
                Marcar como Concluido
              </Button>
            )}
          </div>
        )}

        {myStatus === "valid" && (
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="success">Concluido</Badge>
                <span className="text-sm text-gray-600">
                  Concluido em {myCompletedAt}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Valido ate {myExpiresAt}
              </p>
            </div>
            {canComplete && (
              <Button
                variant="secondary"
                onClick={handleComplete}
                loading={completing}
              >
                Refazer Treinamento
              </Button>
            )}
          </div>
        )}

        {myStatus === "expired" && (
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="danger">Vencido</Badge>
                <span className="text-sm text-gray-600">
                  Concluido em {myCompletedAt} — venceu em {myExpiresAt}
                </span>
              </div>
              <p className="mt-1 text-xs text-red-500">
                Este treinamento precisa ser refeito.
              </p>
            </div>
            {canComplete && (
              <Button onClick={handleComplete} loading={completing}>
                Refazer Treinamento
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Historico de conclusoes (MASTER) */}
      {canManage && completions.length > 0 && (
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Historico de Conclusoes ({completions.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-5 py-3">Usuario</th>
                  <th className="px-5 py-3">Data</th>
                  <th className="px-5 py-3">Valido ate</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {completions.map((c) => (
                  <tr key={c.userId}>
                    <td className="px-5 py-3 font-medium text-gray-900">
                      {c.userName}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {c.completedAt}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{c.expiresAt}</td>
                    <td className="px-5 py-3">
                      <Badge
                        variant={
                          c.status === "valid" ? "success" : "danger"
                        }
                      >
                        {c.status === "valid" ? "Valido" : "Vencido"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
