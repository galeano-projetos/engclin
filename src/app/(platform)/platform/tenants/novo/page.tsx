"use client";

import { useState, useRef } from "react";
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

interface CnpjData {
  razaoSocial: string;
  nomeFantasia: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  telefone: string;
  email: string;
  atividadePrincipal: string;
}

export default function NovoTenantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cnpjStatus, setCnpjStatus] = useState<"" | "success" | "error">("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Form field states for auto-fill
  const [name, setName] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [cep, setCep] = useState("");
  const [telefone, setTelefone] = useState("");
  const [emailEmpresa, setEmailEmpresa] = useState("");
  const [atividadePrincipal, setAtividadePrincipal] = useState("");

  async function fetchCnpj(cnpjValue: string) {
    const digits = cnpjValue.replace(/\D/g, "");
    if (digits.length !== 14) return;

    setCnpjLoading(true);
    setCnpjStatus("");

    try {
      const res = await fetch(`/api/cnpj/${digits}`);
      if (!res.ok) {
        setCnpjStatus("error");
        return;
      }

      const data: CnpjData = await res.json();
      setCnpjStatus("success");

      // Auto-fill fields
      setRazaoSocial(data.razaoSocial);
      setNomeFantasia(data.nomeFantasia);
      setName(data.nomeFantasia || data.razaoSocial);
      setLogradouro(data.logradouro);
      setNumero(data.numero);
      setComplemento(data.complemento);
      setBairro(data.bairro);
      setCidade(data.cidade);
      setUf(data.uf);
      setCep(data.cep);
      setTelefone(data.telefone);
      setEmailEmpresa(data.email);
      setAtividadePrincipal(data.atividadePrincipal);
    } catch {
      setCnpjStatus("error");
    } finally {
      setCnpjLoading(false);
    }
  }

  function handleCnpjChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setCnpjStatus("");

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const digits = value.replace(/\D/g, "");
    if (digits.length === 14) {
      debounceRef.current = setTimeout(() => fetchCnpj(value), 400);
    }
  }

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
    <div className="mx-auto max-w-3xl space-y-6">
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

        {/* Dados da empresa */}
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold text-gray-900">Dados da Empresa</legend>

          {/* CNPJ com auto-busca */}
          <div className="relative">
            <Input
              name="cnpj"
              label="CNPJ"
              required
              placeholder="00.000.000/0000-00"
              onChange={handleCnpjChange}
            />
            {cnpjLoading && (
              <div className="absolute right-3 top-8">
                <svg className="h-5 w-5 animate-spin text-teal-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            )}
            {cnpjStatus === "success" && (
              <p className="mt-1 text-xs text-green-600">Dados do CNPJ carregados automaticamente</p>
            )}
            {cnpjStatus === "error" && (
              <p className="mt-1 text-xs text-amber-600">CNPJ nao encontrado. Preencha os dados manualmente.</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              name="razaoSocial"
              label="Razao Social"
              value={razaoSocial}
              onChange={(e) => setRazaoSocial(e.target.value)}
              placeholder="Razao social da empresa"
            />
            <Input
              name="nomeFantasia"
              label="Nome Fantasia"
              value={nomeFantasia}
              onChange={(e) => setNomeFantasia(e.target.value)}
              placeholder="Nome fantasia"
            />
          </div>

          <Input
            name="name"
            label="Nome de Exibicao"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome que aparecera no sistema"
          />

          <Input
            name="atividadePrincipal"
            label="Atividade Principal (CNAE)"
            value={atividadePrincipal}
            onChange={(e) => setAtividadePrincipal(e.target.value)}
            placeholder="Ex: Atividades de atendimento hospitalar"
          />

          <Select name="plan" label="Plano" options={planOptions} defaultValue="ESSENCIAL" />
        </fieldset>

        {/* Endereco */}
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold text-gray-900">Endereco</legend>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Input
                name="logradouro"
                label="Logradouro"
                value={logradouro}
                onChange={(e) => setLogradouro(e.target.value)}
                placeholder="Rua, Avenida, etc."
              />
            </div>
            <Input
              name="numero"
              label="Numero"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="123"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              name="complemento"
              label="Complemento"
              value={complemento}
              onChange={(e) => setComplemento(e.target.value)}
              placeholder="Sala, Andar, etc."
            />
            <Input
              name="bairro"
              label="Bairro"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              placeholder="Bairro"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              name="cidade"
              label="Cidade"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              placeholder="Cidade"
            />
            <Select
              name="uf"
              label="UF"
              options={UF_OPTIONS}
              value={uf}
              onChange={(e) => setUf(e.target.value)}
            />
            <Input
              name="cep"
              label="CEP"
              value={cep}
              onChange={(e) => setCep(e.target.value)}
              placeholder="00000-000"
            />
          </div>
        </fieldset>

        {/* Contato */}
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold text-gray-900">Contato da Empresa</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              name="telefone"
              label="Telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(00) 0000-0000"
            />
            <Input
              name="emailEmpresa"
              label="Email"
              type="email"
              value={emailEmpresa}
              onChange={(e) => setEmailEmpresa(e.target.value)}
              placeholder="contato@empresa.com.br"
            />
          </div>
        </fieldset>

        {/* Dados do MASTER */}
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold text-gray-900">Usuario MASTER Inicial</legend>
          <Input name="masterName" label="Nome" required placeholder="Nome do engenheiro clinico" />
          <Input name="masterEmail" label="Email" type="email" required placeholder="email@empresa.com" />
          <Input name="masterPassword" label="Senha" type="password" required placeholder="Minimo 8 caracteres" />
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
