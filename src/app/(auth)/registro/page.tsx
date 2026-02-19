"use client";

import { Suspense, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { registerStep1 } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

const PLAN_LABELS: Record<string, string> = {
  essencial: "Essencial",
  profissional: "Profissional",
  enterprise: "Enterprise",
};

export default function RegistroPage() {
  return (
    <Suspense fallback={<div className="text-center text-gray-400">Carregando...</div>}>
      <RegistroForm />
    </Suspense>
  );
}

function RegistroForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plano") || "essencial";
  const ciclo = searchParams.get("ciclo") || "mensal";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cnpjStatus, setCnpjStatus] = useState<"" | "success" | "error">("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-fill states
  const [name, setName] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");

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
      const data = await res.json();
      setCnpjStatus("success");
      setRazaoSocial(data.razaoSocial);
      setNomeFantasia(data.nomeFantasia);
      setName(data.nomeFantasia || data.razaoSocial);
    } catch {
      setCnpjStatus("error");
    } finally {
      setCnpjLoading(false);
    }
  }

  function handleCnpjChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCnpjStatus("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const digits = e.target.value.replace(/\D/g, "");
    if (digits.length === 14) {
      debounceRef.current = setTimeout(() => fetchCnpj(e.target.value), 400);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    formData.set("plan", plan);
    formData.set("ciclo", ciclo);

    const result = await registerStep1(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Auto-login
    const email = (formData.get("email") as string)?.trim();
    const password = formData.get("password") as string;

    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (signInResult?.error) {
      // Login falhou mas cadastro deu certo — redirecionar para login
      router.push("/login");
      return;
    }

    // Redirecionar para pagamento
    router.push(`/registro/pagamento?tenantId=${result.tenantId}`);
    router.refresh();
  }

  return (
    <div className="w-full max-w-lg">
      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Criar sua conta</h1>
        <p className="mt-2 text-sm text-gray-500">
          Plano selecionado:{" "}
          <span className="font-semibold text-teal-600">
            {PLAN_LABELS[plan] || "Essencial"}
          </span>
          {" "}({ciclo})
        </p>
        <p className="mt-1 text-xs text-gray-400">
          30 dias grátis — sem cobrança até o fim do período
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border bg-white/80 backdrop-blur-sm p-6 shadow-sm">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        {/* CNPJ */}
        <div className="relative">
          <Input
            name="cnpj"
            label="CNPJ da empresa"
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
            <p className="mt-1 text-xs text-green-600">Dados carregados automaticamente</p>
          )}
          {cnpjStatus === "error" && (
            <p className="mt-1 text-xs text-amber-600">CNPJ não encontrado. Preencha manualmente.</p>
          )}
        </div>

        {/* Hidden fields for CNPJ data */}
        <input type="hidden" name="razaoSocial" value={razaoSocial} />
        <input type="hidden" name="nomeFantasia" value={nomeFantasia} />

        <Input
          name="name"
          label="Nome da empresa"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome que aparecerá no sistema"
        />

        <Input
          name="responsavel"
          label="Seu nome completo"
          required
          placeholder="Nome do responsável"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="email"
            label="Email"
            type="email"
            required
            placeholder="seu@email.com"
          />
          <Input
            name="phone"
            label="Telefone"
            placeholder="(00) 00000-0000"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="password"
            label="Senha"
            type="password"
            required
            placeholder="Mínimo 8 caracteres"
          />
          <Input
            name="confirmPassword"
            label="Confirmar senha"
            type="password"
            required
            placeholder="Repita a senha"
          />
        </div>

        <Button type="submit" loading={loading} className="w-full">
          Criar conta e continuar
        </Button>

        <p className="text-center text-xs text-gray-500">
          Já tem uma conta?{" "}
          <Link href="/login" className="font-medium text-teal-600 hover:text-teal-700">
            Fazer login
          </Link>
        </p>
      </form>
    </div>
  );
}
