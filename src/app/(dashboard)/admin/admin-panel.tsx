"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createUnit, deleteUnit, createUser, toggleUserActive } from "./actions";

interface UnitData {
  id: string;
  name: string;
  equipmentCount: number;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

const roleLabels: Record<string, string> = {
  MASTER: "Master",
  TECNICO: "Técnico",
  COORDENADOR: "Coordenador",
  FISCAL: "Fiscal",
};

const roleVariant: Record<string, "danger" | "info" | "warning" | "muted"> = {
  MASTER: "danger",
  TECNICO: "info",
  COORDENADOR: "warning",
  FISCAL: "muted",
};

export function AdminPanel({
  units,
  users,
}: {
  units: UnitData[];
  users: UserData[];
}) {
  const [tab, setTab] = useState<"users" | "units">("users");

  return (
    <div className="mt-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setTab("users")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            tab === "users"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Usuários ({users.length})
        </button>
        <button
          onClick={() => setTab("units")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            tab === "units"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Unidades ({units.length})
        </button>
      </div>

      {tab === "users" && <UsersTab users={users} />}
      {tab === "units" && <UnitsTab units={units} />}
    </div>
  );
}

// ============================================================
// Tab: Usuários
// ============================================================

function UsersTab({ users }: { users: UserData[] }) {
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleCreate(formData: FormData) {
    setCreating(true);
    setError("");
    const result = await createUser(formData);
    if (result.error) {
      setError(result.error);
    } else {
      setShowForm(false);
    }
    setCreating(false);
  }

  async function handleToggle(userId: string) {
    setTogglingId(userId);
    await toggleUserActive(userId);
    setTogglingId(null);
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Usuários</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancelar" : "Novo Usuário"}
        </Button>
      </div>

      {showForm && (
        <div className="mt-4 rounded-lg border bg-blue-50 p-4">
          <form action={handleCreate} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input id="name" name="name" label="Nome *" required />
              <Input
                id="email"
                name="email"
                label="E-mail *"
                type="email"
                required
              />
              <Input
                id="password"
                name="password"
                label="Senha *"
                type="password"
                required
              />
              <div>
                <label
                  htmlFor="role"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Perfil *
                </label>
                <select
                  id="role"
                  name="role"
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="TECNICO">Técnico</option>
                  <option value="COORDENADOR">Coordenador</option>
                  <option value="FISCAL">Fiscal</option>
                  <option value="MASTER">Master</option>
                </select>
              </div>
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <Button type="submit" loading={creating}>
              Criar Usuário
            </Button>
          </form>
        </div>
      )}

      {/* Mobile: Cards */}
      <div className="mt-4 space-y-3 lg:hidden">
        {users.map((user) => (
          <div
            key={user.id}
            className={`rounded-lg border bg-white p-4 shadow-sm ${!user.active ? "opacity-50" : ""}`}
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <div className="ml-2 flex flex-shrink-0 gap-1.5">
                <Badge variant={roleVariant[user.role] || "muted"}>
                  {roleLabels[user.role] || user.role}
                </Badge>
                <Badge variant={user.active ? "success" : "muted"}>
                  {user.active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-gray-500">Desde {user.createdAt}</span>
              <Button
                variant="ghost"
                onClick={() => handleToggle(user.id)}
                loading={togglingId === user.id}
              >
                {user.active ? "Desativar" : "Ativar"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Tabela */}
      <div className="mt-4 hidden overflow-hidden rounded-lg border lg:block">
        <table className="min-w-full divide-y">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Nome
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                E-mail
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Perfil
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Desde
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y bg-white">
            {users.map((user) => (
              <tr key={user.id} className={!user.active ? "opacity-50" : ""}>
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                  {user.name}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                  {user.email}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <Badge variant={roleVariant[user.role] || "muted"}>
                    {roleLabels[user.role] || user.role}
                  </Badge>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <Badge variant={user.active ? "success" : "muted"}>
                    {user.active ? "Ativo" : "Inativo"}
                  </Badge>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                  {user.createdAt}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleToggle(user.id)}
                    loading={togglingId === user.id}
                  >
                    {user.active ? "Desativar" : "Ativar"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// Tab: Unidades
// ============================================================

function UnitsTab({ units }: { units: UnitData[] }) {
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  async function handleCreate(formData: FormData) {
    setCreating(true);
    setError("");
    const result = await createUnit(formData);
    if (result.error) {
      setError(result.error);
    } else {
      setShowForm(false);
    }
    setCreating(false);
  }

  async function handleDelete(unitId: string) {
    if (!confirm("Deseja excluir esta unidade?")) return;
    setDeletingId(unitId);
    setDeleteError("");
    const result = await deleteUnit(unitId);
    if (result.error) {
      setDeleteError(result.error);
    }
    setDeletingId(null);
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Unidades / Setores
        </h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancelar" : "Nova Unidade"}
        </Button>
      </div>

      {showForm && (
        <div className="mt-4 rounded-lg border bg-blue-50 p-4">
          <form action={handleCreate} className="flex items-end gap-3">
            <div className="flex-1">
              <Input
                id="name"
                name="name"
                label="Nome da Unidade *"
                placeholder="Ex: UTI, Centro Cirúrgico, Radiologia"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <Button type="submit" loading={creating}>
              Criar
            </Button>
          </form>
        </div>
      )}

      {deleteError && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {deleteError}
        </div>
      )}

      <div className="mt-4 space-y-2">
        {units.map((unit) => (
          <div
            key={unit.id}
            className="flex items-center justify-between rounded-lg border bg-white px-4 py-3 shadow-sm"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">{unit.name}</p>
              <p className="text-xs text-gray-500">
                {unit.equipmentCount} equipamento
                {unit.equipmentCount !== 1 && "s"}
              </p>
            </div>
            <Button
              variant="danger"
              onClick={() => handleDelete(unit.id)}
              loading={deletingId === unit.id}
            >
              Excluir
            </Button>
          </div>
        ))}

        {units.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">
            Nenhuma unidade cadastrada. Crie a primeira unidade para começar.
          </p>
        )}
      </div>
    </div>
  );
}
