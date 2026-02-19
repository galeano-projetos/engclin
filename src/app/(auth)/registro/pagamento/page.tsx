"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { registerPayment } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PagamentoPage() {
  return (
    <Suspense fallback={<div className="text-center text-gray-400">Carregando...</div>}>
      <PagamentoForm />
    </Suspense>
  );
}

function PagamentoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get("tenantId") || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    formData.set("tenantId", tenantId);

    // Separar validade MM/AA
    const expiry = (formData.get("expiry") as string) || "";
    const [month, year] = expiry.split("/").map((s) => s.trim());
    formData.set("expiryMonth", month || "");
    formData.set("expiryYear", year?.length === 2 ? `20${year}` : year || "");

    const result = await registerPayment(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  function handleSkip() {
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="w-full max-w-lg">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Dados de pagamento</h1>
        <p className="mt-2 text-sm text-gray-500">
          Seu cartao <strong>nao sera cobrado agora</strong>. A primeira cobranca
          sera realizada apenas apos 30 dias.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border bg-white/80 backdrop-blur-sm p-6 shadow-sm">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        {/* Resumo */}
        <div className="rounded-lg bg-teal-50 border border-teal-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-teal-800">Trial de 30 dias</p>
              <p className="text-xs text-teal-600">Cancele a qualquer momento</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-teal-700">R$ 0,00</p>
              <p className="text-xs text-teal-500">hoje</p>
            </div>
          </div>
        </div>

        <Input
          name="holderName"
          label="Nome impresso no cartao"
          required
          placeholder="Como aparece no cartao"
        />

        <Input
          name="cardNumber"
          label="Numero do cartao"
          required
          placeholder="0000 0000 0000 0000"
          maxLength={19}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="expiry"
            label="Validade"
            required
            placeholder="MM/AA"
            maxLength={5}
          />
          <Input
            name="ccv"
            label="CVV"
            required
            placeholder="000"
            maxLength={4}
          />
        </div>

        <Input
          name="holderCpfCnpj"
          label="CPF/CNPJ do titular"
          required
          placeholder="000.000.000-00"
        />

        <Input
          name="holderPostalCode"
          label="CEP do titular"
          required
          placeholder="00000-000"
        />

        <Input
          name="holderEmail"
          label="Email para notas fiscais"
          type="email"
          placeholder="financeiro@empresa.com"
        />

        <Button type="submit" loading={loading} className="w-full">
          Ativar trial de 30 dias
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={handleSkip}
            className="text-sm text-gray-400 underline hover:text-gray-600"
          >
            Pular por agora e ir para o sistema
          </button>
        </div>

        <p className="text-center text-xs text-gray-400">
          Seus dados de pagamento sao processados de forma segura pelo Asaas.
          Nenhum valor sera cobrado durante o periodo de trial.
        </p>
      </form>
    </div>
  );
}
