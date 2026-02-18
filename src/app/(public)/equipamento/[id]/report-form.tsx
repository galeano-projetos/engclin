"use client";

import { useState } from "react";
import { reportPublicProblem } from "./actions";

interface ReportFormProps {
  equipmentId: string;
}

export function ReportForm({ equipmentId }: ReportFormProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError("");

    const formData = new FormData(e.currentTarget);
    formData.set("equipmentId", equipmentId);

    const result = await reportPublicProblem(formData);

    if (result.error) {
      setError(result.error);
      setStatus("error");
    } else {
      setStatus("success");
    }
  }

  if (status === "success") {
    return (
      <div className="mt-4 rounded-lg border border-green-300 bg-green-50 p-5 text-center">
        <svg className="mx-auto h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="mt-2 font-semibold text-green-800">Problema reportado com sucesso!</p>
        <p className="mt-1 text-sm text-green-700">A equipe técnica será notificada e tomará as providências necessárias.</p>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        Reportar Problema
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-white p-5">
      <h3 className="mb-3 text-base font-semibold text-gray-900">Reportar um Problema</h3>
      <p className="mb-4 text-xs text-gray-500">
        Preencha os dados abaixo para informar a equipe técnica sobre o problema.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="reporterName" className="mb-1 block text-sm font-medium text-gray-700">
            Seu nome *
          </label>
          <input
            id="reporterName"
            name="reporterName"
            type="text"
            required
            placeholder="Ex: João da Silva"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
            Descrição do problema *
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={3}
            placeholder="Descreva o problema observado no equipamento..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
            Telefone para contato <span className="text-gray-400">(opcional)</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="(11) 99999-9999"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {status === "error" && error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={status === "submitting"}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {status === "submitting" ? "Enviando..." : "Enviar Reporte"}
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); setError(""); setStatus("idle"); }}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
