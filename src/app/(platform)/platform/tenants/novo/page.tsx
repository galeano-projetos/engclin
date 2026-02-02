"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTenant } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import Link from "next/link";

const planOptions = [
  { value: "ESSENCIAL", label: "Essencial" },
  { value: "PROFISSIONAL", label: "Profissional" },
  { value: "ENTERPRISE", label: "Enterprise" },
];

export default function NovoTenantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await createTenant(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/platform/tenants");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/platform/tenants"
          className="rounded-md p-1 text-gray-400 hover:text-gray-600"
          aria-label="Voltar"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Novo Tenant</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border bg-white p-6">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        {/* Dados do tenant */}
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold text-gray-900">Dados do Hospital/Clinica</legend>
          <Input name="name" label="Nome" required placeholder="Ex: Hospital Regional de Campinas" />
          <Input name="cnpj" label="CNPJ" required placeholder="00.000.000/0000-00" />
          <Select name="plan" label="Plano" options={planOptions} defaultValue="ESSENCIAL" />
        </fieldset>

        {/* Dados do MASTER */}
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold text-gray-900">Usuario MASTER Inicial</legend>
          <Input name="masterName" label="Nome" required placeholder="Nome do engenheiro clinico" />
          <Input name="masterEmail" label="Email" type="email" required placeholder="email@hospital.com" />
          <Input name="masterPassword" label="Senha" type="password" required placeholder="Minimo 6 caracteres" />
        </fieldset>

        <div className="flex gap-3">
          <Button type="submit" loading={loading}>
            Criar Tenant
          </Button>
          <Link href="/platform/tenants">
            <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
