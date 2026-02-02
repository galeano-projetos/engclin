"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleTenantActive, updateTenant } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const planOptions = [
  { value: "ESSENCIAL", label: "Essencial" },
  { value: "PROFISSIONAL", label: "Profissional" },
  { value: "ENTERPRISE", label: "Enterprise" },
];

const roleLabels: Record<string, string> = {
  MASTER: "Engenheira Clinica",
  TECNICO: "Tecnico",
  COORDENADOR: "Coordenador",
  FISCAL: "Fiscal",
};

interface TenantData {
  id: string;
  name: string;
  cnpj: string;
  plan: string;
  active: boolean;
  users: {
    id: string;
    name: string;
    email: string;
    role: string;
    active: boolean;
    createdAt: Date;
  }[];
  _count: { equipments: number; units: number };
}

export function TenantDetailClient({ tenant }: { tenant: TenantData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData(e.currentTarget);
    const result = await updateTenant(tenant.id, formData);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess("Dados atualizados com sucesso");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleToggleActive() {
    setToggling(true);
    setError("");
    setSuccess("");

    const result = await toggleTenantActive(tenant.id);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(tenant.active ? "Tenant desativado" : "Tenant ativado");
      router.refresh();
    }
    setToggling(false);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
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
        <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
        <Badge variant={tenant.active ? "success" : "danger"}>
          {tenant.active ? "Ativo" : "Inativo"}
        </Badge>
      </div>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{success}</div>}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">Usuarios</p>
          <p className="text-2xl font-bold">{tenant.users.length}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">Equipamentos</p>
          <p className="text-2xl font-bold">{tenant._count.equipments}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">Unidades</p>
          <p className="text-2xl font-bold">{tenant._count.units}</p>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleUpdate} className="space-y-4 rounded-lg border bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Editar Dados</h2>
        <Input name="name" label="Nome" required defaultValue={tenant.name} />
        <Input name="cnpj" label="CNPJ" required defaultValue={tenant.cnpj} />
        <Select name="plan" label="Plano" options={planOptions} defaultValue={tenant.plan} />

        <div className="flex gap-3">
          <Button type="submit" loading={loading}>
            Salvar
          </Button>
          <Button
            type="button"
            variant={tenant.active ? "danger" : "secondary"}
            onClick={handleToggleActive}
            loading={toggling}
          >
            {tenant.active ? "Desativar Tenant" : "Ativar Tenant"}
          </Button>
        </div>
      </form>

      {/* Users list */}
      <div className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Usuarios do Tenant</h2>

        {tenant.users.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum usuario.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">Nome</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Perfil</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {tenant.users.map((user) => (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="py-2 font-medium text-gray-900">{user.name}</td>
                    <td className="py-2 text-gray-600">{user.email}</td>
                    <td className="py-2">
                      <Badge variant="info">{roleLabels[user.role] || user.role}</Badge>
                    </td>
                    <td className="py-2">
                      <Badge variant={user.active ? "success" : "muted"}>
                        {user.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
