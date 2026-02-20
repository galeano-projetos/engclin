/**
 * Cliente para a API do Asaas (cobranca recorrente).
 *
 * Env vars:
 *   ASAAS_API_KEY   — chave de API ($aact_hmlg_ para sandbox, $aact_prod_ para producao)
 *   ASAAS_ENV       — "sandbox" ou "production" (default: sandbox)
 */

const BASE_URL =
  process.env.ASAAS_ENV === "production"
    ? "https://api.asaas.com/v3"
    : "https://api-sandbox.asaas.com/v3";

function getHeaders(): Record<string, string> {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) throw new Error("ASAAS_API_KEY nao configurada");
  return {
    "Content-Type": "application/json",
    access_token: apiKey,
  };
}

async function asaasRequest<T>(endpoint: string, body: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`[Asaas] Error ${response.status}:`, text);
    throw new Error(`Asaas API error ${response.status}: ${text}`);
  }

  return response.json();
}

// ============================================================
// Criar customer
// ============================================================

interface CreateCustomerInput {
  name: string;
  cpfCnpj: string;
  email?: string;
  phone?: string;
  postalCode?: string;
  externalReference?: string;
}

interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
}

export async function createCustomer(data: CreateCustomerInput): Promise<AsaasCustomer> {
  return asaasRequest<AsaasCustomer>("/customers", data);
}

/** Busca customer por externalReference (tenantId). Retorna null se nao encontrar. */
export async function findCustomerByExternalReference(externalReference: string): Promise<AsaasCustomer | null> {
  try {
    const response = await fetch(
      `${BASE_URL}/customers?externalReference=${encodeURIComponent(externalReference)}`,
      { headers: getHeaders(), signal: AbortSignal.timeout(15_000) },
    );
    if (!response.ok) return null;
    const body = await response.json();
    const customers = body.data as AsaasCustomer[] | undefined;
    return customers?.[0] ?? null;
  } catch {
    return null;
  }
}

// ============================================================
// Criar subscription com trial
// ============================================================

interface CreditCard {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

interface CreditCardHolderInfo {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  phone?: string;
}

interface CreateSubscriptionInput {
  customer: string;
  value: number;
  nextDueDate: string; // YYYY-MM-DD (30 dias no futuro para trial)
  cycle: "MONTHLY" | "YEARLY";
  description?: string;
  creditCard: CreditCard;
  creditCardHolderInfo: CreditCardHolderInfo;
}

interface AsaasSubscription {
  id: string;
  customer: string;
  value: number;
  nextDueDate: string;
  cycle: string;
  status: string;
}

export async function createSubscription(
  data: CreateSubscriptionInput
): Promise<AsaasSubscription> {
  return asaasRequest<AsaasSubscription>("/subscriptions", {
    ...data,
    billingType: "CREDIT_CARD",
  });
}

// ============================================================
// Helpers
// ============================================================

/** Retorna data 30 dias no futuro no formato YYYY-MM-DD */
export function trialEndDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().slice(0, 10);
}
