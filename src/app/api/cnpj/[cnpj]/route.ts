import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/cnpj/{cnpj}
 *
 * Consulta dados do CNPJ via BrasilAPI (gratuita, sem autenticacao).
 * Retorna dados normalizados do cartao CNPJ.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cnpj: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cnpj } = await params;
  const digits = cnpj.replace(/\D/g, "");

  if (digits.length !== 14) {
    return NextResponse.json({ error: "CNPJ deve ter 14 digitos" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://brasilapi.com.br/api/cnpj/v1/${digits}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error(`[CNPJ] BrasilAPI error ${response.status}:`, text);
      return NextResponse.json(
        { error: "CNPJ nao encontrado ou servico indisponivel" },
        { status: response.status === 404 ? 404 : 502 }
      );
    }

    const data = await response.json();

    // Montar telefone a partir de DDD + numero
    let telefone = "";
    if (data.ddd_telefone_1) {
      telefone = data.ddd_telefone_1.replace(/\D/g, "");
    }

    // CNAE principal
    let atividadePrincipal = "";
    if (data.cnae_fiscal_descricao) {
      atividadePrincipal = data.cnae_fiscal_descricao;
    }

    return NextResponse.json({
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
      atividadePrincipal,
    });
  } catch (error) {
    console.error("[CNPJ] Fetch error:", error);
    return NextResponse.json(
      { error: "Erro ao consultar CNPJ" },
      { status: 502 }
    );
  }
}
