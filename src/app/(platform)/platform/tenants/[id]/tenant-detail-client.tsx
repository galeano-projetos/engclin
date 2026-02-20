"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  toggleTenantActive,
  deleteTenant,
  updateTenant,
  resetUserPassword,
  toggleUserActiveFromPlatform,
  createUserForTenant,
} from "../../actions";
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
  MASTER: "Master",
  TECNICO: "Tecnico",
  COORDENADOR: "Coordenador",
  FISCAL: "Fiscal",
};

const roleOptions = [
  { value: "MASTER", label: "Master" },
  { value: "COORDENADOR", label: "Coordenador" },
  { value: "TECNICO", label: "Tecnico" },
  { value: "FISCAL", label: "Fiscal" },
];

const UF_OPTIONS = [
  { value: "", label: "Selecione" },
  { value: "AC", label: "AC" }, { value: "AL", label: "AL" },
  { value: "AP", label: "AP" }, { value: "AM", label: "AM" },
  { value: "BA", label: "BA" }, { value: "CE", label: "CE" },
  { value: "DF", label: "DF" }, { value: "ES", label: "ES" },
  { value: "GO", label: "GO" }, { value: "MA", label: "MA" },
  { value: "MT", label: "MT" }, { value: "MS", label: "MS" },
  { value: "MG", label: "MG" }, { value: "PA", label: "PA" },
  { value: "PB", label: "PB" }, { value: "PR", label: "PR" },
  { value: "PE", label: "PE" }, { value: "PI", label: "PI" },
  { value: "RJ", label: "RJ" }, { value: "RN", label: "RN" },
  { value: "RS", label: "RS" }, { value: "RO", label: "RO" },
  { value: "RR", label: "RR" }, { value: "SC", label: "SC" },
  { value: "SP", label: "SP" }, { value: "SE", label: "SE" },
  { value: "TO", label: "TO" },
];

interface TenantData {
  id: string;
  name: string;
  cnpj: string;
  plan: string;
  active: boolean;
  createdAt: Date;
  razaoSocial: string | null;
  nomeFantasia: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
  telefone: string | null;
  email: string | null;
  atividadePrincipal: string | null;
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
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Password reset modal
  const [resetModal, setResetModal] = useState<{
    userName: string;
    password: string;
  } | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

  // Create user form
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);

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

  async function handleDelete() {
    setDeleting(true);
    setError("");

    const result = await deleteTenant(tenant.id);

    if (result.error) {
      setError(result.error);
      setDeleting(false);
      setConfirmDelete(false);
    } else {
      router.push("/platform/tenants");
    }
  }

  async function handleResetPassword(userId: string, userName: string) {
    setResettingId(userId);
    const result = await resetUserPassword(userId);
    setResettingId(null);

    if (result.error) {
      setError(result.error);
    } else if (result.temporaryPassword) {
      setResetModal({ userName, password: result.temporaryPassword });
    }
  }

  async function handleToggleUser(userId: string) {
    setTogglingUserId(userId);
    const result = await toggleUserActiveFromPlatform(userId);
    setTogglingUserId(null);

    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
  }

  async function handleCreateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreatingUser(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await createUserForTenant(tenant.id, formData);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess("Usuario criado com sucesso");
      setShowCreateUser(false);
      router.refresh();
    }
    setCreatingUser(false);
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
      <div className="grid gap-4 sm:grid-cols-4">
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
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">Criado em</p>
          <p className="text-lg font-bold">
            {new Date(tenant.createdAt).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleUpdate} className="space-y-5 rounded-lg border bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Editar Dados</h2>

        <Input name="name" label="Nome de Exibicao" required defaultValue={tenant.name} />
        <Input name="cnpj" label="CNPJ" required defaultValue={tenant.cnpj} />
        <Select name="plan" label="Plano" options={planOptions} defaultValue={tenant.plan} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input name="razaoSocial" label="Razao Social" defaultValue={tenant.razaoSocial || ""} />
          <Input name="nomeFantasia" label="Nome Fantasia" defaultValue={tenant.nomeFantasia || ""} />
        </div>

        <Input name="atividadePrincipal" label="Atividade Principal (CNAE)" defaultValue={tenant.atividadePrincipal || ""} />

        <h3 className="text-sm font-semibold text-gray-700 pt-2">Endereco</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Input name="logradouro" label="Logradouro" defaultValue={tenant.logradouro || ""} />
          </div>
          <Input name="numero" label="Numero" defaultValue={tenant.numero || ""} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input name="complemento" label="Complemento" defaultValue={tenant.complemento || ""} />
          <Input name="bairro" label="Bairro" defaultValue={tenant.bairro || ""} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input name="cidade" label="Cidade" defaultValue={tenant.cidade || ""} />
          <Select name="uf" label="UF" options={UF_OPTIONS} defaultValue={tenant.uf || ""} />
          <Input name="cep" label="CEP" defaultValue={tenant.cep || ""} />
        </div>

        <h3 className="text-sm font-semibold text-gray-700 pt-2">Contato da Empresa</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input name="telefone" label="Telefone" defaultValue={tenant.telefone || ""} />
          <Input name="emailEmpresa" label="Email" type="email" defaultValue={tenant.email || ""} />
        </div>

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
          <Button
            type="button"
            variant="danger"
            onClick={() => setConfirmDelete(true)}
          >
            Excluir Tenant
          </Button>
        </div>
      </form>

      {/* Users list */}
      <div className="rounded-lg border bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Usuarios do Tenant ({tenant.users.length})
          </h2>
          <Button
            variant="secondary"
            onClick={() => setShowCreateUser(!showCreateUser)}
          >
            {showCreateUser ? "Cancelar" : "Adicionar Usuario"}
          </Button>
        </div>

        {/* Create user form */}
        {showCreateUser && (
          <form
            onSubmit={handleCreateUser}
            className="mb-4 space-y-3 rounded-lg border border-teal-200 bg-teal-50 p-4"
          >
            <h3 className="text-sm font-semibold text-teal-800">Novo Usuario</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input name="name" label="Nome" required />
              <Input name="email" label="Email" type="email" required />
              <Input name="password" label="Senha" type="text" required />
              <Select
                name="role"
                label="Perfil"
                options={roleOptions}
                defaultValue="COORDENADOR"
              />
            </div>
            <Button type="submit" loading={creatingUser}>
              Criar Usuario
            </Button>
          </form>
        )}

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
                  <th className="pb-2 font-medium">Criado em</th>
                  <th className="pb-2 font-medium text-right">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {tenant.users.map((user) => (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="py-2.5 font-medium text-gray-900">{user.name}</td>
                    <td className="py-2.5 text-gray-600">{user.email}</td>
                    <td className="py-2.5">
                      <Badge variant="info">{roleLabels[user.role] || user.role}</Badge>
                    </td>
                    <td className="py-2.5">
                      <Badge variant={user.active ? "success" : "muted"}>
                        {user.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-gray-500 text-xs">
                      {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleResetPassword(user.id, user.name)}
                          disabled={resettingId === user.id}
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                          title="Redefinir senha"
                        >
                          {resettingId === user.id ? (
                            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => handleToggleUser(user.id)}
                          disabled={togglingUserId === user.id}
                          className={`rounded p-1.5 hover:bg-gray-100 disabled:opacity-50 ${
                            user.active ? "text-yellow-500 hover:text-yellow-600" : "text-green-500 hover:text-green-600"
                          }`}
                          title={user.active ? "Desativar usuario" : "Ativar usuario"}
                        >
                          {togglingUserId === user.id ? (
                            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : user.active ? (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-red-700">Excluir Tenant</h3>
            <p className="mt-2 text-sm text-gray-600">
              Tem certeza que deseja excluir <strong>{tenant.name}</strong>?
            </p>
            <p className="mt-2 text-sm text-red-600 font-medium">
              Esta acao e irreversivel. Todos os dados serao perdidos: usuarios, equipamentos, manutencoes, calibracoes e demais registros.
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                loading={deleting}
              >
                Excluir Permanentemente
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Senha Provisoria</h3>
            <p className="mt-2 text-sm text-gray-600">
              Nova senha gerada para <strong>{resetModal.userName}</strong>:
            </p>
            <div className="mt-3 rounded-md bg-gray-100 p-3 text-center font-mono text-lg font-bold text-gray-900 select-all">
              {resetModal.password}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Um email com link de redefinicao tambem foi enviado ao usuario.
              O usuario sera obrigado a alterar a senha no proximo login.
            </p>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setResetModal(null)}>Fechar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
