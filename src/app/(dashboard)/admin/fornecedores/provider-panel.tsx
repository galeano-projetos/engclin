"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createProvider, toggleProviderActive } from "./actions";

interface ProviderData {
  id: string;
  name: string;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  contactPerson: string | null;
  active: boolean;
}

export function ProviderPanel({ providers }: { providers: ProviderData[] }) {
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleCreate(formData: FormData) {
    setCreating(true);
    setError("");
    const result = await createProvider(formData);
    if (result.error) {
      setError(result.error);
    } else {
      setShowForm(false);
    }
    setCreating(false);
  }

  async function handleToggle(id: string) {
    setTogglingId(id);
    await toggleProviderActive(id);
    setTogglingId(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fornecedores</h1>
          <p className="mt-1 text-sm text-gray-500">
            {providers.length} fornecedor{providers.length !== 1 && "es"} cadastrado{providers.length !== 1 && "s"}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancelar" : "Novo Fornecedor"}
        </Button>
      </div>

      {showForm && (
        <div className="mt-4 rounded-lg border bg-blue-50 p-4">
          <form action={handleCreate} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Input id="name" name="name" label="Nome *" placeholder="Ex: LabCal Calibracoes" required />
              <Input id="cnpj" name="cnpj" label="CNPJ" placeholder="00.000.000/0000-00" />
              <Input id="phone" name="phone" label="Telefone" placeholder="(00) 00000-0000" />
              <Input id="email" name="email" label="E-mail" type="email" placeholder="contato@empresa.com" />
              <Input id="contactPerson" name="contactPerson" label="Pessoa de Contato" placeholder="Nome do responsavel" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" loading={creating}>Criar Fornecedor</Button>
          </form>
        </div>
      )}

      {/* Mobile: Cards */}
      <div className="mt-4 space-y-3 lg:hidden">
        {providers.length === 0 ? (
          <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-400">
            Nenhum fornecedor cadastrado.
          </div>
        ) : (
          providers.map((p) => (
            <div key={p.id} className={`rounded-lg border bg-white p-4 shadow-sm ${!p.active ? "opacity-50" : ""}`}>
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">{p.name}</p>
                  {p.cnpj && <p className="text-xs text-gray-500">{p.cnpj}</p>}
                </div>
                <Badge variant={p.active ? "success" : "muted"}>
                  {p.active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                {p.phone && <span>{p.phone}</span>}
                {p.email && <span>{p.email}</span>}
                {p.contactPerson && <span>{p.contactPerson}</span>}
              </div>
              <div className="mt-2 text-right">
                <Button variant="ghost" onClick={() => handleToggle(p.id)} loading={togglingId === p.id}>
                  {p.active ? "Desativar" : "Ativar"}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop: Tabela */}
      <div className="mt-4 hidden overflow-x-auto rounded-lg border bg-white shadow-sm lg:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">CNPJ</th>
              <th className="px-4 py-3">Telefone</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Contato</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {providers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Nenhum fornecedor cadastrado.
                </td>
              </tr>
            ) : (
              providers.map((p) => (
                <tr key={p.id} className={`hover:bg-gray-50 ${!p.active ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-gray-600">{p.cnpj || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{p.phone || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{p.email || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{p.contactPerson || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={p.active ? "success" : "muted"}>
                      {p.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" onClick={() => handleToggle(p.id)} loading={togglingId === p.id}>
                      {p.active ? "Desativar" : "Ativar"}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
