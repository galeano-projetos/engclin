"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { registerPayment, registerPixPayment, checkPixStatus, getPlanPricing } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PagamentoPage() {
  return (
    <Suspense fallback={<div className="text-center text-gray-400">Carregando...</div>}>
      <PagamentoForm />
    </Suspense>
  );
}

type Tab = "cartao" | "pix";

function PagamentoForm() {
  const searchParams = useSearchParams();
  const tenantId = searchParams.get("tenantId") || "";

  const [tab, setTab] = useState<Tab>("cartao");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pricing, setPricing] = useState<{ plan: string; monthly: number; annualTotal: number } | null>(null);

  // PIX state
  const [pixQrCode, setPixQrCode] = useState("");
  const [pixCopiaECola, setPixCopiaECola] = useState("");
  const [pixCopied, setPixCopied] = useState(false);
  const [pixPolling, setPixPolling] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load pricing info
  useEffect(() => {
    if (tenantId) {
      getPlanPricing(tenantId).then((p) => {
        if (p) setPricing(p);
      });
    }
  }, [tenantId]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const startPixPolling = useCallback(() => {
    setPixPolling(true);
    pollingRef.current = setInterval(async () => {
      const result = await checkPixStatus(tenantId);
      if (result.paid) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        setPixPolling(false);
        window.location.href = "/dashboard";
      }
    }, 5000);
  }, [tenantId]);

  // ---- Credit Card Submit ----
  async function handleCardSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const formData = new FormData(e.currentTarget);
      formData.set("tenantId", tenantId);

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

      window.location.href = "/dashboard";
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  // ---- PIX Submit ----
  async function handlePixSubmit() {
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const result = await registerPixPayment(tenantId);

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      setPixQrCode(result.qrCodeBase64 || "");
      setPixCopiaECola(result.pixCopiaECola || "");
      setLoading(false);
      startPixPolling();
    } catch {
      setError("Erro ao gerar PIX. Tente novamente.");
      setLoading(false);
    }
  }

  async function handleCopyPix() {
    try {
      await navigator.clipboard.writeText(pixCopiaECola);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 3000);
    } catch {
      // fallback
    }
  }

  const planLabel = pricing?.plan || "ESSENCIAL";
  const annualTotal = pricing?.annualTotal || 2970;
  const monthlyEquivalent = Math.round(annualTotal / 12);

  return (
    <div className="w-full max-w-lg">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Dados de pagamento</h1>
        <p className="mt-2 text-sm text-gray-500">
          Escolha a forma de pagamento para o plano{" "}
          <strong className="text-teal-600">{planLabel}</strong>
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex rounded-lg border bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => { setTab("cartao"); setError(""); }}
          className={`flex-1 rounded-md py-2.5 text-sm font-medium transition-colors ${
            tab === "cartao"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Cartão de Crédito
        </button>
        <button
          type="button"
          onClick={() => { setTab("pix"); setError(""); }}
          className={`flex-1 rounded-md py-2.5 text-sm font-medium transition-colors ${
            tab === "pix"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          PIX (Anual)
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* ========== CARTAO TAB ========== */}
      {tab === "cartao" && (
        <form onSubmit={handleCardSubmit} className="space-y-5 rounded-xl border bg-white/80 backdrop-blur-sm p-6 shadow-sm">
          {/* Resumo Trial */}
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
            <p className="mt-2 text-xs text-teal-600">
              Após o trial: R$ {pricing?.monthly || 297},00/mês
            </p>
          </div>

          <Input
            name="holderName"
            label="Nome impresso no cartão"
            required
            placeholder="Como aparece no cartão"
          />

          <Input
            name="cardNumber"
            label="Número do cartão"
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

          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>

          <Button type="submit" loading={loading} className="w-full">
            Ativar trial de 30 dias
          </Button>

          <p className="text-center text-xs text-gray-400">
            Seus dados de pagamento são processados de forma segura pelo Asaas.
            Nenhum valor será cobrado durante o período de trial.
          </p>
        </form>
      )}

      {/* ========== PIX TAB ========== */}
      {tab === "pix" && (
        <div className="space-y-5 rounded-xl border bg-white/80 backdrop-blur-sm p-6 shadow-sm">
          {/* Resumo PIX Anual */}
          <div className="rounded-lg bg-teal-50 border border-teal-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-teal-800">Plano Anual via PIX</p>
                <p className="text-xs text-teal-600">12 meses — equivale a R$ {monthlyEquivalent},00/mês</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-teal-700">
                  R$ {annualTotal.toLocaleString("pt-BR")},00
                </p>
                <p className="text-xs text-teal-500">pagamento único</p>
              </div>
            </div>
          </div>

          {!pixQrCode ? (
            <>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                <p className="font-medium">Pagamento à vista via PIX</p>
                <p className="mt-1 text-xs text-amber-600">
                  O valor total de 12 meses será cobrado imediatamente.
                  Acesso liberado assim que o pagamento for confirmado.
                </p>
              </div>

              <Button
                type="button"
                onClick={handlePixSubmit}
                loading={loading}
                className="w-full"
              >
                Gerar QR Code PIX
              </Button>
            </>
          ) : (
            <div className="space-y-4 text-center">
              {/* QR Code */}
              <div className="flex justify-center">
                <img
                  src={`data:image/png;base64,${pixQrCode}`}
                  alt="QR Code PIX"
                  className="h-56 w-56 rounded-lg border"
                />
              </div>

              {/* Copia e Cola */}
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">PIX Copia e Cola</p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={pixCopiaECola}
                    className="flex-1 truncate rounded-md border bg-gray-50 px-3 py-2 text-xs text-gray-600"
                  />
                  <button
                    type="button"
                    onClick={handleCopyPix}
                    className="shrink-0 rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
                  >
                    {pixCopied ? "Copiado!" : "Copiar"}
                  </button>
                </div>
              </div>

              {/* Status */}
              {pixPolling && (
                <div className="flex items-center justify-center gap-2 text-sm text-teal-600">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Aguardando confirmação do pagamento...
                </div>
              )}

              <p className="text-xs text-gray-400">
                O QR Code é válido por 3 dias. Após o pagamento, o acesso será liberado automaticamente.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
