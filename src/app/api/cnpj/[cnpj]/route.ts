import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/cnpj/{cnpj}
 *
 * Consulta dados do CNPJ via ReceitaWS (primário) com fallback para BrasilAPI.
 * Retorna dados normalizados do cartão CNPJ.
 * Rota pública — usada no formulário de registro (usuário não autenticado).
 */

interface CnpjResult {
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

async function fetchReceitaWS(digits: string): Promise<CnpjResult | null> {
  try {
    const res = await fetch(
      `https://receitaws.com.br/v1/cnpj/${digits}`,
      {
        cache: "no-store",
        headers: { Accept: "application/json" },
      }
    );
    if (!res.ok) return null;

    const data = await res.json();
    if (data.status === "ERROR") return null;

    const telefone = (data.telefone || "").replace(/[^\d]/g, "");
    const atividadePrincipal =
      data.atividade_principal?.[0]?.text || "";

    return {
      razaoSocial: data.nome || "",
      nomeFantasia: data.fantasia || "",
      logradouro: data.logradouro || "",
      numero: data.numero || "",
      complemento: data.complemento || "",
      bairro: data.bairro || "",
      cidade: data.municipio || "",
      uf: data.uf || "",
      cep: (data.cep || "").replace(/[^\d]/g, ""),
      telefone,
      email: data.email || "",
      atividadePrincipal,
    };
  } catch {
    return null;
  }
}

async function fetchBrasilAPI(digits: string): Promise<CnpjResult | null> {
  try {
    const res = await fetch(
      `https://brasilapi.com.br/api/cnpj/v1/${digits}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;

    const data = await res.json();

    let telefone = "";
    if (data.ddd_telefone_1) {
      telefone = data.ddd_telefone_1.replace(/\D/g, "");
    }

    return {
      razaoSocial: data.razao_social || "",
      nomeFantasia: data.nome_fantasia || "",
      logradouro: data.logradouro || "",
      numero: data.numero || "",
      complemento: data.complemento || "",
      bairro: data.bairro || "",
      cidade: data.municipio || "",
      uf: data.uf || "",
      cep: data.cep ? data.cep.replace(/\D/g, "") : "",
      telefone,
      email: data.email || "",
      atividadePrincipal: data.cnae_fiscal_descricao || "",
    };
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cnpj: string }> }
) {
  const { cnpj } = await params;
  const digits = cnpj.replace(/\D/g, "");

  if (digits.length !== 14) {
    return NextResponse.json({ error: "CNPJ deve ter 14 dígitos" }, { status: 400 });
  }

  // Tenta ReceitaWS primeiro, fallback para BrasilAPI
  let result = await fetchReceitaWS(digits);

  if (!result) {
    console.warn(`[CNPJ] ReceitaWS falhou para ${digits}, tentando BrasilAPI...`);
    result = await fetchBrasilAPI(digits);
  }

  if (!result) {
    console.error(`[CNPJ] Todas as APIs falharam para ${digits}`);
    return NextResponse.json(
      { error: "CNPJ não encontrado ou serviço indisponível" },
      { status: 502 }
    );
  }

  return NextResponse.json(result);
}
